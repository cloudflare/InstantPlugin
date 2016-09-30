import "./application.styl"
import template from "./application.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import {highlight} from "highlight.js"
import createEagerSchema from "lib/create-eager-schema"
import {postJson} from "simple-fetch"

const ENTITY_ID = "data-entity-id"
const ENTITY_ORDER = "data-entity-order"
const TYPE_PATTERN = /hljs-([\S]*)/

export default class Application extends BaseComponent {
  static template = template;

  constructor(mountPoint, options) {
    super(options)

    Object.assign(this, {
      schema: null,
      entities: null,
      parsedEmbedCode: null
    })

    const element = this.compileTemplate()
    const {embedCodeInput, downloadButton, navigationButtons} = this.refs

    embedCodeInput.addEventListener("input", this.handleEntry)
    downloadButton.addEventListener("click", this.startDownload)

    // TODO: Remove after testing is done.
    embedCodeInput.value = `<script>
  (function(){
  var handle = '@placeholder';
  var a = document.createElement('script');
  var m = document.getElementsByTagName('script')[0];
  a.async = 1;
  a.src = 'https://nectar.ninja/api/v1/' + handle.slice(1);
  m.parentNode.insertBefore(a, m);
  })();
</script>`
    this.parseInput()

    const stepHandlers = {
      "embed-code": this.navigateToEmbedCode,
      attributes: this.navigateToAttributes,
      preview: this.navigateToPreview
    }

    navigationButtons.forEach(buttonEl => {
      const step = buttonEl.getAttribute("data-step")

      buttonEl.addEventListener("click", stepHandlers[step])
    })

    // this.navigateToEmbedCode()
    this.navigateToAttributes()
    mountPoint.appendChild(element)
  }

  getTrackedEntitiesIDs() {
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
      const method = stepEl.getAttribute("data-step") === value ? "add" : "remove"

      stepEl.classList[method]("active")
    })

    // TODO: autofocus

    return value
  }

  @autobind
  navigateToEmbedCode() {
    this.route = "embed-code"
  }

  @autobind
  navigateToAttributes() {
    this.route = "attributes"
  }

  @autobind
  navigateToPreview() {
    const {previewContainer} = this.refs

    previewContainer.innerHTML = ""

    const trackedIDs = this.getTrackedEntitiesIDs()
    const embedCodeDOM = this.refs.attributePicker.cloneNode(true)
    const properties = {}

    trackedIDs.forEach((id, order) => {
      const entity = this.entities[id]

      properties[id] = {
        title: entity.title,
        order,
        type: entity.type
      }

      const current = embedCodeDOM.querySelector(`[${ENTITY_ID}="${id}"]`)
      const entityDelimiter = entity.type === "string" ? current.textContent[0] : ""

      current.textContent = `${entityDelimiter}TRACKED_ENTITY[${id}]${entityDelimiter}`
    })

    // const schema = this.schema = createEagerSchema({
    //   embedCode: embedCodeDOM.textContent,
    //   properties
    // })
    //
    const schema = {
      resources: {
        body: [
          {
            type: "script",
            contents: "alert('hello')"
          }
        ]
      },

      options: {
        properties: {
          option_1: {
            order: 1,
            type: "string"
          }
        }
      }
    }

    const preview = Object.assign(document.createElement("iframe"), {
      // src: `${APP_BASE}/developer/app-tester?schema=true&embed=true`
      // src: `${APP_BASE}/developer/app-tester?version=2cgno43jfxw-1465583283291`
      // src: `${APP_BASE}/developer/app-tester?embed=true&remoteInstall=true&cmsName=wordpress`
      src: `${APP_BASE}/developer/app-tester?&remoteInstall=true`
    })

    window.removeEventListener("message", this.messageHandler)

    this.messageHandler = ({data}) => {
      if (data.type !== "child-listening") return

      preview.contentWindow.postMessage({
        type: "eager:app-tester:upload-app",
        schema
      }, "*")
    }

    window.addEventListener("message", this.messageHandler)

    previewContainer.appendChild(preview)

    this.route = "preview"
  }

  @autobind
  startDownload() {
    function onComplete({downloadURL}) {
      const downloadIframe = document.createElement("iframe")

      downloadIframe.className = "download-iframe"
      downloadIframe.src = downloadURL
      document.body.appendChild(downloadIframe)
    }

    postJson(`${API_BASE}/instant-plugin`, {schema: this.schema})
      .then(onComplete)
      .catch(error => console.error(error))
  }

  parseInput() {
    const {attributePicker, embedCodeInput} = this.refs

    this.entities = {}

    attributePicker.innerHTML = highlight("html", embedCodeInput.value).value

    Array
      .from(attributePicker.querySelectorAll(".hljs-string, .hljs-number"))
      .forEach((element, order) => {
        const id = `option_${order + 1}`
        const title = `Option ${order + 1}`
        const [, type] = element.className.match(TYPE_PATTERN)

        this.entities[id] = {order, title, tracked: false, type}

        element.setAttribute(ENTITY_ID, id)
        element.setAttribute(ENTITY_ORDER, order)
        element.addEventListener("click", this.toggleEntityTracking.bind(this, element))
      })

    this.syncButtonState()
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

    this.syncButtonState()
  }

  syncButtonState() {
    const {embedCodeInput, stepsContainer} = this.refs
    const embedCodeStep = stepsContainer.querySelector(".step[data-step='embed-code']")
    const attributesStep = stepsContainer.querySelector(".step[data-step='attributes']")
    const navigateToAttributesButton = embedCodeStep.querySelector("button[data-step='attributes']")
    const navigateToPreviewButton = attributesStep.querySelector("button[data-step='preview']")

    navigateToAttributesButton.disabled = embedCodeInput.value.length === 0
    navigateToPreviewButton.disabled = this.getTrackedEntitiesIDs().length === 0
  }

  @autobind
  handleEntry() {
    this.parseInput()
  }
}
