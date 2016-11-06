import "./schema.styl"
import template from "./schema.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"

export default class SchemaStep extends BaseComponent {
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
    this.$root.$activeStep = "embedCode"
  }

  @autobind
  navigateNext() {
    this.$root.$activeStep = "details"
  }
}
