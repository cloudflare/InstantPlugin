import "./details.styl"
import template from "./details.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import ImageUploader from "components/image-uploader"
import $$ from "lib/constants"

export default class DetailsStep extends BaseComponent {
  static template = template;

  render() {
    const element = this.compileTemplate()
    const {detailsForm, imageUploadMount} = this.refs

    this.imageUploader = new ImageUploader({name: "app[icon]"})
    this.replaceElement(imageUploadMount, this.imageUploader.render())

    detailsForm.addEventListener("submit", event => {
      event.preventDefault()
      this.$root.$activeStep = "creating"
    })

    this.resetFields()

    return element
  }

  get navigationButtons() {
    return [
      {label: "Back", handler: this.navigatePrevious},
      {label: "Download", handler: this.navigateNext}
    ]
  }

  @autobind
  navigatePrevious() {
    this.$root.$activeStep = "preview"
  }

  @autobind
  navigateNext() {
    const {detailsFormSubmit} = this.refs

    detailsFormSubmit.click()
  }

  resetFields() {
    const {detailsForm} = this.refs

    detailsForm.reset()
    this.imageUploader.imageURL = $$.DEFAULT_PLUGIN_ICON
  }
}
