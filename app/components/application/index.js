import "./application.styl"
import template from "./application.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import AttributeList from "components/attribute-list"
import ImageUploader from "components/image-uploader"
import {highlight} from "highlight.js"
import createElement from "lib/create-element"
import createEagerSchema from "lib/create-eager-schema"
import {postJson} from "simple-fetch"
import autosize from "autosize"
import formSerialize from "form-serialize"
import runDemo from "./emoji-react-demo"

const ENTITY_ID = "data-entity-id"
const ENTITY_ORDER = "data-entity-order"
const ENTITY_QUERY = ".hljs-string, .hljs-number"
const TYPE_PATTERN = /hljs-([\S]*)/

export default class Application extends BaseComponent {
  static template = template;

  constructor(mountPoint, options) {
    super(options)

    Object.assign(this, {
      entities: {},
      installJSON: null
    })

    const element = this.compileTemplate()
    const {
      attributeListMount,
      embedCodeInput,
      pluginDetailsForm,
      navigationButtons,
      imageUploadMount
    } = this.refs

    autosize(embedCodeInput)

    embedCodeInput.addEventListener("input", this.handleEntry)
    pluginDetailsForm.addEventListener("submit", event => {
      event.preventDefault()

      this.navigateToDownload()
    })

    const stepHandlers = {
      demo: this.navigateToDemo,
      intro: this.navigateToIntro,
      "embed-code": this.navigateToEmbedCode,
      attributes: this.navigateToAttributes,
      preview: this.navigateToPreview,
      details: this.navigateToDetails,
      download: this.navigateToDownload
    }

    navigationButtons.forEach(buttonEl => {
      const step = buttonEl.getAttribute("data-step")

      buttonEl.addEventListener("click", stepHandlers[step])
    })

    this.attributeList = new AttributeList({
      getEntities: () => this.entities,
      getTrackedEntityIDs: this.getTrackedEntityIDs,
      setEntityTitle: this.setEntityTitle
    })

    this.replaceElement(attributeListMount, this.attributeList.render())

    this.imageUploader = new ImageUploader({name: "app[icon]"})

    this.replaceElement(imageUploadMount, this.imageUploader.render())

    this.navigateToIntro()
    mountPoint.appendChild(element)
  }

  @autobind
  getTrackedEntityIDs() {
    const $ = this.entities

    return Object.keys($)
      .filter(key => $[key].tracked)
      .sort((keyA, keyB) => $[keyA].order - $[keyB].order)
  }

  get route() {
    return this.refs.stepsContainer.getAttribute("data-active-step")
  }

  set route(value) {
    const {steps, stepsContainer} = this.refs

    stepsContainer.setAttribute("data-active-step", value)

    steps.forEach(stepEl => {
      const active = stepEl.getAttribute("data-step") === value
      const method = active ? "add" : "remove"

      stepEl.classList[method]("active")
      if (active) this.autofocus(stepEl)
    })

    this.syncButtonState()
    window.scrollTo(0, 0)

    return value
  }

  @autobind
  navigateToIntro() {
    this.route = "intro"
  }

  @autobind
  navigateToDemo() {
    runDemo(this)
  }

  @autobind
  navigateToEmbedCode() {
    this.route = "embed-code"
  }

  @autobind
  navigateToAttributes() {
    this.route = "attributes"
    this.attributeList.render()
    this.syncButtonState()
  }

  @autobind
  navigateToPreview() {
    const {previewContainer} = this.refs

    previewContainer.innerHTML = ""

    const IDs = this.getTrackedEntityIDs()
    const embedCodeDOM = this.refs.attributePicker.cloneNode(true)
    const properties = {}

    IDs.forEach((id, order) => {
      const entity = this.entities[id]
      const current = embedCodeDOM.querySelector(`[${ENTITY_ID}="${id}"]`)
      const text = current.textContent
      const entityDelimiter = entity.type === "string" ? text[0] : ""

      properties[id] = {
        order,
        placeholder: entityDelimiter ? text.substring(1, text.length - 1) : text,
        title: entity.title || `Option ${order + 1}`,
        type: entity.type
      }

      current.textContent = `${entityDelimiter}TRACKED_ENTITY[${id}]${entityDelimiter}`
    })

    this.installJSON = createEagerSchema({
      embedCode: embedCodeDOM.textContent,
      properties
    })

    const preview = createElement("iframe", {
      src: `${APP_BASE}/developer/app-tester?remoteInstall&embed&cmsName=appTester&initialUrl=example.com`
    })

    window.removeEventListener("message", this.messageHandler)

    this.messageHandler = ({data}) => {
      if (data.type !== "eager:app-tester:upload-listener-ready") return

      preview.contentWindow.postMessage({
        installJSON: this.installJSON,
        type: "eager:app-tester:upload-app"
      }, "*")
    }

    window.addEventListener("message", this.messageHandler)

    previewContainer.appendChild(preview)

    this.route = "preview"
  }

  @autobind
  navigateToDetails() {
    this.route = "details"
  }

  @autobind
  navigateToDownload() {
    this.route = "download"

    this.startDownload()
  }

  parseInput() {
    this.entities = {}

    const {attributePicker, embedCodeInput} = this.refs
    const serializer = createElement("div", {
      innerHTML: highlight("html", embedCodeInput.value).value
    })

    if (!serializer.querySelector(ENTITY_QUERY)) {
      attributePicker.classList.add("empty")
      attributePicker.innerHTML = `
        <p class="details">
          We couldn't find any configurable strings or numbers in that embed code.
        </p>

        <p class="details">
          Press “Back” edit the embed code, or “Preview Plugin” to continue.
        </p>
      `

      this.syncButtonState()
      return
    }

    attributePicker.classList.remove("empty")
    attributePicker.innerHTML = serializer.innerHTML

    Array
      .from(attributePicker.querySelectorAll(ENTITY_QUERY))
      .forEach((element, order) => {
        const id = `option_${order + 1}`
        const [, type] = element.className.match(TYPE_PATTERN)

        this.entities[id] = {
          element,
          order,
          original: element.textContent,
          tracked: false,
          type}

        element.setAttribute(ENTITY_ID, id)
        element.setAttribute(ENTITY_ORDER, order)
        element.addEventListener("click", this.toggleEntityTracking.bind(this, element))
      })

    this.attributeList.render()
    this.syncButtonState()
  }

  @autobind
  startDownload() {
    const {downloadLink, downloadDetails} = this.refs

    function onComplete({downloadURL}) {
      downloadDetails.setAttribute("data-state", "ready")
      downloadLink.href = downloadURL

      const downloadIframe = createElement("iframe", {
        className: "download-iframe",
        src: downloadURL
      })

      document.body.appendChild(downloadIframe)
    }

    const {pluginDetailsForm} = this.refs
    const pluginDetails = formSerialize(pluginDetailsForm, {hash: true})
    const payload = {
      cmsName: "wordpress",
      installJSON: this.installJSON,
      ...pluginDetails
    }

    console.log(payload)

    postJson(`${API_BASE}/create/instant`, payload)
      .then(onComplete)
      .catch(error => console.error(error))
  }

  toggleEntityTracking(element) {
    const entity = this.entities[element.getAttribute(ENTITY_ID)]

    if (entity.tracked) {
      entity.tracked = false
      element.classList.remove("tracked")
    }
    else {
      entity.tracked = true
      element.classList.add("tracked")
    }

    this.attributeList.render()
    this.syncButtonState()
  }

  @autobind
  setEntityTitle(id, {target: {value}}) {
    this.entities[id].title = value
  }

  syncButtonState() {
    const {embedCodeInput, stepsContainer} = this.refs
    const embedCodeStep = stepsContainer.querySelector(".step[data-step='embed-code']")
    const attributesStep = stepsContainer.querySelector(".step[data-step='attributes']")
    const navigateToAttributesButton = embedCodeStep.querySelector("button[data-step='attributes']")
    const navigateToPreviewButton = attributesStep.querySelector("button[data-step='preview']")
    const IDs = this.getTrackedEntityIDs()

    navigateToAttributesButton.disabled = embedCodeInput.value.length === 0
    navigateToPreviewButton.disabled = IDs.length === 0 && Object.keys(this.entities).length !== 0
  }

  @autobind
  handleEntry() {
    this.parseInput()
  }
}
