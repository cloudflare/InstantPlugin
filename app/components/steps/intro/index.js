import "./intro.styl"
import template from "./intro.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"

export default class IntroStep extends BaseComponent {
  static template = template;

  render() {
    const element = this.compileTemplate()

    return element
  }

  get navigationButtons() {
    return [
      {label: "Start", handler: this.navigateNext}
    ]
  }

  @autobind
  navigateNext() {
    this.$root.$activeStep = "embedCode"
  }
}
