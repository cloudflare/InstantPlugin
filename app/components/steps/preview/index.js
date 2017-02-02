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
    super(...arguments)

    window.addEventListener("message", ({data}) => {
      if (data.type !== "cloudflare-apps:app-creator:upload-listener-ready") return

      if (this.deferredIframeCallback) {
        this.deferredIframeCallback()
        this.deferredIframeCallback = null
      }
    })
  }

  title = "Preview your options.";

  render() {
    const element = this.compileTemplate()

    this.updateRender()

    return element
  }

  @autobind
  updateRender() {
    this.createPreviewIframe(() => {
      this.sendPreviewStyleOverrides()
    })
  }

  @autobind
  onEnter() {
    const {previewIframe} = this.refs

    previewIframe.contentWindow.postMessage({
      installJSON: this.$root.$installJSON,
      type: "cloudflare-apps:app-creator:upload-app"
    }, "*")
  }

  @autobind
  createPreviewIframe(next = () => {}) {
    this.deferredIframeCallback = next

    const {previewContainer} = this.refs

    this.refs.previewIframe = createElement("iframe", {
      sandbox: "allow-forms allow-scripts allow-same-origin allow-popups",
      src: PREVIEW_URL
    })

    previewContainer.innerHTML = ""
    previewContainer.appendChild(this.refs.previewIframe)
  }

  sendPreviewStyleOverrides() {
    const {previewIframe} = this.refs

    previewIframe.contentWindow.postMessage({
      styleContent: previewOverrides,
      type: "cloudflare-apps:app-creator:set-style"
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
