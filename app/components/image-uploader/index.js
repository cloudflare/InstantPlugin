import "./image-uploader.styl"
import template from "./image-uploader.pug"

import BaseComponent from "components/base-component"
import autobind from "autobind-decorator"
import filepicker from "filepicker-js"
import previewImageFile from "lib/preview-image-file"

const API_KEY = "AcwVASRX5QoO107ICFDDpz"
const DOMAIN = "eager-app-images.imgix.net"

export default class ImageUploader extends BaseComponent {
  static template = template;

  constructor() {
    super(...arguments)

    filepicker.setKey(API_KEY)

    Object.assign(this, {
      _imageURL: "",
      _uploading: false
    })
  }

  get imageURL() {
    return this._imageURL
  }

  set imageKey(key) {
    this._imageURL = key

    const {imageAnchor, previewImage} = this.refs
    const url = key ? `//${DOMAIN}/${key}` : ""

    imageAnchor.href = url
    previewImage.src = url

    this.element.setAttribute("data-state", key ? "uploaded" : "ready")

    return this._imageURL
  }

  get uploading() {
    return this._uploading
  }

  set uploading(value) {
    const {fileInputContainer} = this.refs
    const method = value ? "add" : "remove"

    this._uploading = value

    fileInputContainer.classList[method]("uploading")

    return this._uploading
  }

  @autobind
  handleChange() {
    const {fileInput, previewImage} = this.refs
    const [file] = fileInput.files

    if (this.uploading || !file) return

    this.reset()
    this.uploading = true

    const upload = filepicker.store.bind(
      filepicker,
      file,
      this.handleFile,
      this.handleError,
      this.handleProgress
    )

    previewImageFile(file, ({height, src}) => {
      Object.assign(previewImage, {height, src})

      upload()
    }, upload)
  }

  @autobind
  handleError() {
    const {fileInputContainer} = this.refs

    this.uploading = false
    fileInputContainer.classList.add("error")

    console.error("An error occurred uploading file", arguments)
  }

  @autobind
  handleFile({key}) {
    const {fileInputContainer} = this.refs

    fileInputContainer.classList.remove("error")
    fileInputContainer.removeAttribute("data-progress")

    this.uploading = false
    this.imageKey = key
  }

  @autobind
  handleProgress(percentage) {
    const {fileInputContainer} = this.refs

    fileInputContainer.setAttribute("data-progress", percentage)
  }

  @autobind
  handleDragUpload([file]) {
    const {fileInputContainer, previewImage} = this.refs

    previewImageFile(file, ({height, src}) => {
      Object.assign(previewImage, {height, src})
    })

    fileInputContainer.classList.remove("dragging", "error")
    fileInputContainer.removeAttribute("data-progress")
    this.uploading = true
  }

  render() {
    this.compileTemplate()

    const {fileInput, fileInputContainer, resetButton} = this.refs

    resetButton.addEventListener("click", this.reset)
    fileInput.addEventListener("change", this.handleChange)
    fileInput.addEventListener("dragenter", () => fileInputContainer.classList.add("dragging"))
    fileInput.addEventListener("dragleave", () => fileInputContainer.classList.remove("dragging"))
    fileInput.addEventListener("click", () => {
      if (this.imageURL) event.preventDefault()
    })

    const dropOptions = {
      access: "public",
      dragEnter: () => fileInputContainer.classList.add("dragging"),
      dragLeave: () => fileInputContainer.classList.remove("dragging"),
      mimetype: "image/*",
      multiple: false,
      onStart: this.handleDragUpload,
      onSuccess: ([file]) => this.handleFile(file),
      onProgress: this.handleProgress,
      onError: this.handleError
    }

    filepicker.makeDropPane(fileInputContainer, dropOptions)

    this.reset()

    // this.imageKey = "9uL93FaAQCu51HHRHOFA_Screen Shot 2016-10-04 at 11.02.47 PM.png"

    return this.element
  }

  @autobind
  reset() {
    const {fileInputContainer, previewImage} = this.refs

    this.imageKey = ""

    previewImage.removeAttribute("height")

    fileInputContainer.classList.remove("dragging", "error")
    fileInputContainer.removeAttribute("data-progress")
  }
}
