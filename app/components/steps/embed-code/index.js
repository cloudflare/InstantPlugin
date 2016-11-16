import "./embed-code.styl"
import template from "./embed-code.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import AttributePicker from "./attribute-picker"
import * as demos from "../../application2/demos"

export default class EmbedCodeStep extends BaseComponent {
  static template = template;

  render() {
    const element = this.compileTemplate()
    const {attributePickerMount, embedCodeInput, demoButtons} = this.refs

    demoButtons.forEach(demoButton => demoButton.addEventListener("click", this.navigateDemo))

    this.attributePicker = new AttributePicker({$root: this.$root})
    this.replaceElement(attributePickerMount, this.attributePicker.render())

    embedCodeInput.addEventListener("input", ({target: {value}}) => {
      this.attributePicker.parseInput(value)
    })

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

  @autobind
  navigateDemo({target}) {
    demos[target.dataset.demo](this.$root)
  }
}
