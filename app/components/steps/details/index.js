import "./details.styl"
import template from "./details.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"

export default class DetailsStep extends BaseComponent {
  static template = template;

  render() {
    const element = this.compileTemplate()

    return element
  }

  get navigationButtons() {
    return [
      {label: "Back", handler: this.navigatePrevious},
      {label: "Download Plugin", handler: this.navigateNext}
    ]
  }

  @autobind
  navigatePrevious() {
    this.$root.$activeStep = "preview"
  }

  @autobind
  navigateNext() {
    this.$root.$activeStep = "creating"
  }
}
