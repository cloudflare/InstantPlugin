import "./application.styl"
import template from "./application.pug"
import previewOverrides from "inline-assets/preview-overrides.styl"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import AttributePicker from "./attribute-picker"
import ImageUploader from "components/image-uploader"
import createElement from "lib/create-element"
import createEagerSchema from "lib/create-eager-schema"
import {postJson} from "simple-fetch"
import autosize from "autosize"
import formSerialize from "form-serialize"
import * as demos from "./demos"
import $$ from "lib/constants"

export default class Application extends BaseComponent {
  static template = template;

  constructor(mountPoint, options) {
    super(options)

    Object.assign(this, {
      awaitingPreview: false,
      entities: {},
      installJSON: null,
      steps: {}
    })

    window.addEventListener("message", ({data}) => {
      if (data.type !== "eager:app-tester:upload-listener-ready") return

      if (this.deferredIframeCallback) {
        this.deferredIframeCallback()
        this.deferredIframeCallback = null
      }
    })

    const element = this.compileTemplate()
    const {
      attributePickerMount,
      embedCodeInput,
      imageUploadMount,
      navigationButtons,
      pluginDetailsForm,
      steps
    } = this.refs

    autosize(this.element.querySelectorAll("textarea"))

    embedCodeInput.addEventListener("input", this.handleEntry)

    pluginDetailsForm.addEventListener("submit", event => {
      event.preventDefault()
      this.navigateToCreating()
    })

    this.attributePicker = new AttributePicker({$root: this})
    this.replaceElement(attributePickerMount, this.attributePicker.render())

    steps.forEach(stepEl => this.steps[stepEl.getAttribute("data-step")] = stepEl)

    const stepHandlers = {
      demo: this.navigateToDemo,
      intro: this.navigateToIntro,
      embedCode: this.navigateToEmbedCode,
      attributePicker: this.navigateToAttributePicker,
      preview: this.navigateToPreview,
      details: this.navigateToDetails,
      creating: this.navigateToCreating,
      download: this.navigateToDownload,
      reset: () => window.location.reload() // TODO: Reset more elegantly.
    }

    // TODO: Simplify button handlers.
    const combinedNavigationButtons = [
      ...this.attributePicker.refs.navigationButtons,
      ...navigationButtons
    ]

    combinedNavigationButtons.forEach(buttonEl => {
      const step = buttonEl.getAttribute("data-step")

      buttonEl.addEventListener("click", stepHandlers[step])
    })

    this.imageUploader = new ImageUploader({name: "app[icon]"})
    this.replaceElement(imageUploadMount, this.imageUploader.render())
    this.imageUploader.imageURL = $$.DEFAULT_PLUGIN_ICON

    mountPoint.appendChild(element)

    this.navigateToIntro()
  }

  @autobind
  getTrackedEntityIDs() {
    const $ = this.entities

    return Object.keys($)
      .filter(key => $[key].tracked)
      .sort((keyA, keyB) => $[keyA].order - $[keyB].order)
  }

  get activeStep() {
    return this.element.getAttribute($$.ACTIVE_STEP)
  }

  set activeStep(value) {
    const {steps, stepsContainer} = this.refs
    const containerStyle = stepsContainer.style

    this.element.setAttribute($$.ACTIVE_STEP, value)

    if (this.activeStep !== "intro") {
      containerStyle.height = `${stepsContainer.clientHeight}px`
    }

    requestAnimationFrame(() => {
      steps.forEach(stepEl => {
        const active = stepEl.getAttribute("data-step") === value
        const method = active ? "add" : "remove"

        stepEl.classList[method]("active")

        if (active) {
          requestAnimationFrame(() => {
            containerStyle.height = `${stepEl.clientHeight + 16}px`

            // HACK: Chrome seems to be selective in calling transitionend if an
            // element is hidden or already in another transition.
            // The timeout is set slightly past the height transition to reset the property.
            setTimeout(() => containerStyle.height = "auto", $$.TRANSITION_DELAY)
          })

          this.autofocus(stepEl)
        }
      })

      this.syncButtonState()
      window.scrollTo(0, 0)
    })

    return value
  }

  @autobind
  createPreviewIframe(next = () => {}) {
    this.deferredIframeCallback = next

    const {previewContainer} = this.refs
    const previewIframe = createElement("iframe", {
      sandbox: "allow-forms allow-scripts allow-same-origin allow-popups",
      src: $$.PREVIEW_URL
    })

    this.refs.previewIframe = previewIframe

    previewContainer.innerHTML = ""
    previewContainer.appendChild(previewIframe)
  }

  @autobind
  navigateToIntro() {
    this.activeStep = "intro"
  }

  @autobind
  navigateToDemo({target}) {
    demos[target.getAttribute("data-demo")](this)
  }

  @autobind
  navigateToEmbedCode() {
    this.activeStep = "embedCode"
  }

  @autobind
  navigateToAttributePicker() {
    this.activeStep = "attributePicker"
    this.syncButtonState()
  }

  @autobind
  navigateToPreview() {
    const IDs = this.getTrackedEntityIDs()
    const embedCodeDOM = this.attributePicker.refs.picker.cloneNode(true)
    const properties = {}

    IDs.forEach((id, index) => {
      const {delimiter, identifier, format, normalized, placeholder, title, type} = this.entities[id]
      const current = embedCodeDOM.querySelector(`[${$$.ENTITY_ID}="${id}"]`)

      properties[id] = {
        format,
        order: index + 1,
        placeholder,
        default: normalized,
        title: title || identifier || `Option ${index + 1}`,
        type
      }

      current.textContent = `${delimiter}TRACKED_ENTITY[${id}]${delimiter}`
    })

    if (this.includesHTMLTags) {
      properties.embedLocation = {
        default: {selector: "body", method: "prepend"},
        format: "element",
        title: "Location",
        order: 0,
        type: "object"
      }
    }

    const {attributesForm} = this.attributePicker.refs

    this.installJSON = createEagerSchema({
      options: formSerialize(attributesForm, {hash: true}),
      embedCode: embedCodeDOM.textContent,
      properties
    })

    this.activeStep = "preview"

    this.createPreviewIframe(() => {
      this.sendPreviewStyleOverrides()
      this.sendPreviewPayload()
    })
  }

  @autobind
  navigateToDetails() {
    this.activeStep = "details"
  }

  @autobind
  navigateToCreating() {
    this.activeStep = "creating"

    const onComplete = ({downloadURL}) => {
      this.downloadURL = downloadURL
      this.navigateToDownload()
    }

    const {pluginDetailsForm} = this.refs
    const pluginDetails = formSerialize(pluginDetailsForm, {hash: true})

    pluginDetails.app.icon = pluginDetails.app.icon || $$.DEFAULT_PLUGIN_ICON

    const payload = {
      cmsName: "wordpress",
      installJSON: this.installJSON,
      ...pluginDetails
    }

    postJson(`${API_BASE}/create/instant`, payload)
      .then(onComplete)
      .catch(error => console.error(error))
  }

  @autobind
  navigateToDownload() {
    this.activeStep = "download"

    const {downloadLink} = this.refs

    downloadLink.href = this.downloadURL

    const downloadIframe = createElement("iframe", {
      className: "download-iframe",
      src: this.downloadURL
    })

    document.body.appendChild(downloadIframe)
  }

  syncButtonState() {
    const {embedCodeInput, stepsContainer} = this.refs
    const embedCodeStep = stepsContainer.querySelector(".step[data-step='embedCode']")
    const navigateToAttributesButton = embedCodeStep.querySelector("button[data-step='attributePicker']")

    navigateToAttributesButton.disabled = embedCodeInput.value.length === 0
  }

  @autobind
  sendPreviewPayload() {
    const {previewIframe} = this.refs

    previewIframe.contentWindow.postMessage({
      installJSON: this.installJSON,
      type: "eager:app-tester:upload-app"
    }, "*")
  }


  @autobind
  handleEntry() {
    this.attributePicker.parseInput()
  }
}
