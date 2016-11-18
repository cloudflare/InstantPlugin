import "./download.styl"
import template from "./download.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import createElement from "lib/create-element"

export default class DownloadStep extends BaseComponent {
  static template = template;

  @autobind
  onActive() {
    const {downloadURL} = this.$root
    const {downloadLink} = this.refs

    downloadLink.href = downloadURL

    const downloadIframe = createElement("iframe", {
      className: "download-iframe",
      src: downloadURL
    })

    document.body.appendChild(downloadIframe)
  }

  get navigationButtons() {
    return [
      {label: "Create another plugin", handler: this.navigateNext}
    ]
  }

  @autobind
  navigateNext() {
    this.$root.restart()
  }
}
