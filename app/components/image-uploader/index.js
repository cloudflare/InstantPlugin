import "./image-uploader.styl"
import template from "./image-uploader.pug"

import BaseComponent from "components/base-component"
import autobind from "autobind-decorator"

export default class ImageUploader extends BaseComponent {
  static template = template;

  handleError() {
    const {fileInput} = this.refs

    fileInput.classList.remove("uploading")
    fileInput.classList.add("error")

    console.error("An error occurred uploading file", arguments)
  }

  @autobind
  handleChange() {
    const {fileInput} = this.refs

    if (fileInput.value === "") return

    this.reset()
    fileInput.classList.add("uploading")
  }

  handleProgress(percentage) {
    this.refs.fileInput.setAttribute("data-progress", percentage)
  }

  handleFile() {
    const {imagePreviewContainer} = this.refs

    // imagePreviewContainer.
  }

  render() {
    this.compileTemplate()

    const {fileInput} = this.refs

    fileInput.addEventListener("change", this.handleChange)
    fileInput.addEventListener("dragenter", () => fileInput.classList.add("dragging"))
    fileInput.addEventListener("dragleave", () => fileInput.classList.remove("dragging"))

    return this.element
  }

  reset() {
    const {fileInput} = this.refs

    this.element.setAttribute("data-state", "empty")

    fileInput.classList.remove(["dragging", "error"])
    fileInput.removeAttribute("data-progress")
  }
}
