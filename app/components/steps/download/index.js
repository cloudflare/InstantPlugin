import "./download.styl"
import template from "./download.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"

export default class DownloadStep extends BaseComponent {
  static template = template;

  render() {
    const element = this.compileTemplate()

    return element
  }

  get navigationButtons() {
    return [
      {label: "Create another plugin", handler: this.navigateNext}
    ]
  }

  @autobind
  navigateNext() {
    this.$root.$activeStep = "embedCode"
  }
}
