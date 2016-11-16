import "./preview.styl"
import template from "./preview.pug"
import previewOverrides from "./inline-assets/preview-overrides.styl"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import createElement from "lib/create-element"

const PREVIEW_URL = [
  EAGER_BASE,
  "/developer/app-tester?remoteInstall&embed&siteId=preview&cmsName=appTester&initialUrl=typical.design"
].join("")

export default class PreviewStep extends BaseComponent {
  static template = template;

  constructor() {
    super(arguments)

    window.addEventListener("message", ({data}) => {
      if (data.type !== "eager:app-tester:upload-listener-ready") return

      if (this.deferredIframeCallback) {
        this.deferredIframeCallback()
        this.deferredIframeCallback = null
      }
    })
  }

  render() {
    const element = this.compileTemplate()

    this.createPreviewIframe(() => {
      this.sendPreviewStyleOverrides()
    })

    return element
  }

  @autobind
  createPreviewIframe(next = () => {}) {
    this.deferredIframeCallback = next

    const {previewContainer} = this.refs
    const previewIframe = createElement("iframe", {
      sandbox: "allow-forms allow-scripts allow-same-origin allow-popups",
      src: PREVIEW_URL
    })

    this.refs.previewIframe = previewIframe

    previewContainer.innerHTML = ""
    previewContainer.appendChild(previewIframe)
  }

  sendPreviewStyleOverrides() {
    const {previewIframe} = this.refs

    previewIframe.contentWindow.postMessage({
      styleContent: previewOverrides,
      type: "eager:app-tester:set-style"
    }, "*")
  }

  get navigationButtons() {
    return [
      {label: "Back", handler: this.navigatePrevious},
      {label: "Next", handler: this.navigateNext}
    ]
  }

  @autobind
  navigatePrevious() {
    this.$root.$activeStep = "schema"
  }

  @autobind
  navigateNext() {
    this.$root.$activeStep = "details"
  }
}
