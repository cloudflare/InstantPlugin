import "./embed-code.styl"
import template from "./embed-code.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"

export default class EmbedCodeStep extends BaseComponent {
  static template = template;

  render() {
    const element = this.compileTemplate()

    return element
  }

  get navigationButtons() {
    return [
      {label: "Back", handler: this.navigatePrevious},
      {label: "Next", handler: this.navigateNext}
    ]
  }

  @autobind
  navigatePrevious() {
    this.$root.$activeStep = "intro"
  }

  @autobind
  navigateNext() {
    this.$root.$activeStep = "schema"
  }
}
