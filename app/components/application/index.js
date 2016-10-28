import "./application.styl"
import template from "./application.pug"
import previewOverrides from "inline-assets/preview-overrides.styl"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import AttributeList from "components/attribute-list"
import ImageUploader from "components/image-uploader"
import {highlight} from "highlight.js"
import createElement from "lib/create-element"
import parseURL from "lib/parse-url"
import createEagerSchema from "lib/create-eager-schema"
import KM from "lib/key-map"
import {postJson} from "simple-fetch"
import autosize from "autosize"
import isURL from "is-url"
import formSerialize from "form-serialize"
import * as demos from "./demos"

const DEFAULT_PLUGIN_ICON = `${ASSET_BASE}/default-plugin-logo.png`
const ACTIVE_STEP = "data-active-step"
const CHUNK_TYPE = "data-chunk-type"
const ENTITY_ID = "data-entity-id"
const ENTITY_IDENTIFIER = "data-identifier"
const ENTITY_ORDER = "data-entity-order"
const STRING_CLASS = "hljs-string"
const PRENORMALIZED = "data-prenormalized"
const ENTITY_QUERY = `.${STRING_CLASS}, .hljs-number`
const TRANSITION_DELAY = 700
const SELECTABLE_TYPES = ["path", "param-value"]
const GROUP_PATTERN = /-group$/
const JAVASCRIPT_ENTITY_QUERY = ".javascript .hljs-string, .javascript .hljs-number"
const JAVASCRIPT_PROPERTY_PATTERN = /:/
const JAVASCRIPT_DECLARATION_PATTERN = /([\$_A-Za-z]+)/
const JAVASCRIPT_DECLARATION_CLASS_PATTERN = /hljs-(keyword|attr)/
const previewURL = [
  EAGER_BASE,
  "/developer/app-tester?remoteInstall&embed&cmsName=appTester&initialUrl=typical.design"
].join("")

const getType = element => {
  const [, type] = element.className.match(/hljs-([\S]*)/)

  return type
}
const getDelimiter = (type, text) => type === "string" ? text[0] : ""
const normalize = (type, text) => getDelimiter(type, text) ? text.substring(1, text.length - 1) : text

export default class Application extends BaseComponent {
  static template = template;

  constructor(mountPoint, options) {
    super(options)

    Object.assign(this, {
      awaitingPreview: false,
      entities: {},
      installJSON: null,
      steps: {},
      previewURL
    })

    window.addEventListener("message", ({data}) => {
      if (data.type !== "eager:app-tester:upload-listener-ready") return

      if (this.deferredIframeCallback) {
        this.deferredIframeCallback()
        this.deferredIframeCallback = null
      }
    })

    const element = this.compileTemplate()
    const {
      attributesForm,
      attributeListMount,
      customLocationContainer,
      customLocationInput,
      embedCodeInput,
      imageUploadMount,
      locationSelect,
      navigationButtons,
      pluginDetailsForm,
      steps
    } = this.refs

    autosize(this.element.querySelectorAll("textarea"))

    embedCodeInput.addEventListener("input", this.handleEntry)

    attributesForm.addEventListener("submit", event => {
      event.preventDefault()
      this.navigateToPreview()
    })

    locationSelect.addEventListener("change", ({target: {value}}) => {
      if (value === "custom") {
        customLocationContainer.style.display = ""
        customLocationInput.required = true
      }
      else {
        customLocationContainer.style.display = "none"
        customLocationInput.required = false
      }
    })

    pluginDetailsForm.addEventListener("submit", event => {
      event.preventDefault()
      this.navigateToCreating()
    })

    steps.forEach(stepEl => this.steps[stepEl.getAttribute("data-step")] = stepEl)

    const stepHandlers = {
      demo: this.navigateToDemo,
      intro: this.navigateToIntro,
      embedCode: this.navigateToEmbedCode,
      attributes: this.navigateToAttributes,
      preview: this.navigateToPreview,
      details: this.navigateToDetails,
      creating: this.navigateToCreating,
      download: this.navigateToDownload,
      reset: () => window.location.reload() // TODO: Reset more elegantly.
    }

    navigationButtons.forEach(buttonEl => {
      const step = buttonEl.getAttribute("data-step")

      buttonEl.addEventListener("click", stepHandlers[step])
    })

    this.attributeList = new AttributeList({
      getEntities: () => this.entities,
      getTrackedEntityIDs: this.getTrackedEntityIDs
    })

    this.replaceElement(attributeListMount, this.attributeList.render())

    this.imageUploader = new ImageUploader({name: "app[icon]"})
    this.replaceElement(imageUploadMount, this.imageUploader.render())
    this.imageUploader.imageURL = DEFAULT_PLUGIN_ICON

    mountPoint.appendChild(element)

    this.navigateToIntro()
  }

  @autobind
  getTrackedEntityIDs() {
    const $ = this.entities

    return Object.keys($)
      .filter(key => $[key].tracked)
      .sort((keyA, keyB) => $[keyA].order - $[keyB].order)
  }

  get activeStep() {
    return this.element.getAttribute(ACTIVE_STEP)
  }

  set activeStep(value) {
    const {steps, stepsContainer} = this.refs
    const containerStyle = stepsContainer.style

    this.element.setAttribute(ACTIVE_STEP, value)

    if (this.activeStep !== "intro") {
      containerStyle.height = `${stepsContainer.clientHeight}px`
    }

    requestAnimationFrame(() => {
      steps.forEach(stepEl => {
        const active = stepEl.getAttribute("data-step") === value
        const method = active ? "add" : "remove"

        stepEl.classList[method]("active")

        if (active) {
          requestAnimationFrame(() => {
            containerStyle.height = `${stepEl.clientHeight + 16}px`

            // HACK: Chrome seems to be selective in calling transitionend if an
            // element is hidden or already in another transition.
            // The timeout is set slightly past the height transition to reset the property.
            setTimeout(() => containerStyle.height = "auto", TRANSITION_DELAY)
          })

          this.autofocus(stepEl)
        }
      })

      this.syncButtonState()
      window.scrollTo(0, 0)
    })

    return value
  }

  @autobind
  createPreviewIframe(next = () => {}) {
    this.deferredIframeCallback = next

    const {previewContainer} = this.refs
    const previewIframe = createElement("iframe", {
      sandbox: "allow-scripts allow-same-origin allow-popups",
      src: this.previewURL
    })

    this.refs.previewIframe = previewIframe

    previewContainer.innerHTML = ""
    previewContainer.appendChild(previewIframe)
  }

  @autobind
  navigateToIntro() {
    this.activeStep = "intro"
  }

  @autobind
  navigateToDemo({target}) {
    demos[target.getAttribute("data-demo")](this)
  }

  @autobind
  navigateToEmbedCode() {
    this.activeStep = "embedCode"
  }

  @autobind
  navigateToAttributes() {
    this.activeStep = "attributes"
    this.attributeList.render()
    this.syncButtonState()
  }

  @autobind
  navigateToPreview() {
    const IDs = this.getTrackedEntityIDs()
    const embedCodeDOM = this.refs.attributePicker.cloneNode(true)
    const properties = {}

    IDs.forEach((id, index) => {
      const {delimiter, identifier, format, normalized, placeholder, title, type} = this.entities[id]
      const current = embedCodeDOM.querySelector(`[${ENTITY_ID}="${id}"]`)

      properties[id] = {
        format,
        order: index + 1,
        placeholder,
        default: normalized,
        title: title || identifier || `Option ${index + 1}`,
        type
      }

      current.textContent = `${delimiter}TRACKED_ENTITY[${id}]${delimiter}`
    })

    if (this.includesHTMLTags) {
      properties.embedLocation = {
        default: {selector: "body", method: "prepend"},
        format: "element",
        title: "Location",
        order: 0,
        type: "object"
      }
    }

    const {attributesForm} = this.refs

    this.installJSON = createEagerSchema({
      options: formSerialize(attributesForm, {hash: true}),
      embedCode: embedCodeDOM.textContent,
      properties
    })

    this.activeStep = "preview"

    this.createPreviewIframe(() => {
      this.sendPreviewStyleOverrides()
      this.sendPreviewPayload()
    })
  }

  @autobind
  navigateToDetails() {
    this.activeStep = "details"
  }

  @autobind
  navigateToCreating() {
    this.activeStep = "creating"

    const onComplete = ({downloadURL}) => {
      this.downloadURL = downloadURL
      this.navigateToDownload()
    }

    const {pluginDetailsForm} = this.refs
    const pluginDetails = formSerialize(pluginDetailsForm, {hash: true})

    pluginDetails.app.icon = pluginDetails.app.icon || DEFAULT_PLUGIN_ICON

    const payload = {
      cmsName: "wordpress",
      installJSON: this.installJSON,
      ...pluginDetails
    }

    console.log(payload)

    postJson(`${API_BASE}/create/instant`, payload)
      .then(onComplete)
      .catch(error => console.error(error))
  }

  @autobind
  navigateToDownload() {
    this.activeStep = "download"

    const {downloadLink} = this.refs

    downloadLink.href = this.downloadURL

    const downloadIframe = createElement("iframe", {
      className: "download-iframe",
      src: this.downloadURL
    })

    document.body.appendChild(downloadIframe)
  }

  parseInput() {
    this.entities = {}

    const {attributePicker, embedCodeInput, embedCodeLocationContainer} = this.refs
    const serializer = createElement("div", {
      innerHTML: highlight("html", embedCodeInput.value).value
    })

    if (!serializer.querySelector(ENTITY_QUERY)) {
      attributePicker.classList.add("empty")
      attributePicker.innerHTML = `
        <p class="details">
          We couldn’t find any configurable strings or numbers in that embed code.
        </p>

        <p class="details">
          Press “Back” to edit the embed code or “Preview Plugin” to continue.
        </p>
      `

      this.syncButtonState()
      return
    }

    attributePicker.classList.remove("empty")
    attributePicker.innerHTML = serializer.innerHTML

    // Remove strings that object properties.
    Array
      .from(attributePicker.querySelectorAll(JAVASCRIPT_ENTITY_QUERY))
      .forEach(entityEl => {
        const {nextSibling} = entityEl

        if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE) return
        if (!JAVASCRIPT_PROPERTY_PATTERN.test(nextSibling.textContent)) return

        entityEl.classList.remove(STRING_CLASS)
        entityEl.classList.add("hljs-attr")
      })

    // Group HTML attributes with their values.
    Array
      .from(attributePicker.querySelectorAll(".hljs-tag .hljs-string"))
      .forEach(entityEl => {
        const normalized = encodeURI(normalize("string", entityEl.textContent))

        if (isURL(normalized)) return

        const collection = [entityEl]
        let sibling = entityEl

        const replaceWithGroup = () => {
          const entityGroup = createElement("span")

          entityGroup.setAttribute(CHUNK_TYPE, "attribute-group")

          collection.forEach(entry => {
            let cloneEl = entry.cloneNode(true)

            if (cloneEl.nodeType === Node.TEXT_NODE) {
              cloneEl = createElement("span", {
                className: "entity-text",
                textContent: cloneEl.textContent
              })
            }

            entityGroup.appendChild(cloneEl)
          })

          const attributeEl = entityGroup.querySelector(".hljs-attr")
          const identifier = attributeEl ? attributeEl.textContent : ""

          entityGroup.setAttribute(ENTITY_IDENTIFIER, identifier)

          entityEl.parentNode.insertBefore(entityGroup, entityEl)
          collection.forEach(entry => entry.parentNode.removeChild(entry))
        }

        // Walk the DOM until we find the attribute.
        while (sibling = sibling.previousSibling) { // eslint-disable-line no-cond-assign
          collection.unshift(sibling)

          const {className = ""} = sibling

          if (/hljs-attr/.test(className)) {
            replaceWithGroup()
            break
          }
        }
      })

    // Group JS entities with their assignment name.
    Array
      .from(attributePicker.querySelectorAll(JAVASCRIPT_ENTITY_QUERY))
      .forEach(entityEl => {
        const collection = [entityEl]
        let sibling = entityEl

        const replaceWithGroup = tokenName => {
          const entityGroup = createElement("span")
          const type = {
            attr: "property",
            keyword: "assignment"
          }[tokenName]

          entityGroup.setAttribute(CHUNK_TYPE, "entity-group")

          collection.forEach(entry => {
            let cloneEl = entry.cloneNode(true)

            if (cloneEl.nodeType === Node.TEXT_NODE) {
              cloneEl = createElement("span", {
                className: "entity-text",
                textContent: cloneEl.textContent
              })
            }

            entityGroup.appendChild(cloneEl)
          })

          let identifier = `Unknown ${type}`

          if (type === "property") {
            const propertyEl = entityGroup.querySelector(".hljs-attr")

            if (propertyEl) identifier = propertyEl.textContent
          }
          else {
            const identifierEl = entityGroup.querySelector(".entity-text")

            if (identifierEl) {
              [, identifier] = identifierEl.textContent.match(JAVASCRIPT_DECLARATION_PATTERN)

              if (identifier) {
                identifierEl.innerHTML = identifierEl.innerHTML.replace(JAVASCRIPT_DECLARATION_PATTERN,
                  "<span class='entity-identifier'>$1</span>")
              }
            }
          }

          entityGroup.setAttribute(ENTITY_IDENTIFIER, identifier)

          entityEl.parentNode.insertBefore(entityGroup, entityEl)
          collection.forEach(entry => entry.parentNode.removeChild(entry))
        }

        // Walk the DOM until we (hopefully) find the declaration.
        while (sibling = sibling.previousSibling) { // eslint-disable-line no-cond-assign
          collection.unshift(sibling)

          const {className = ""} = sibling
          const [, tokenName] = className.match(JAVASCRIPT_DECLARATION_CLASS_PATTERN) || []

          if (tokenName) {
            replaceWithGroup(tokenName)
            break
          }
        }
      })


    const getEntityElements = () => Array.from(attributePicker.querySelectorAll(ENTITY_QUERY))

    // Parse URL components into entities.
    getEntityElements()
      .map(element => {
        const type = getType(element)

        return {
          element,
          type,
          entityDelimiter: getDelimiter(type, element.textContent),
          normalized: normalize(type, element.textContent)
        }
      })
      .filter(({type, normalized}) => type === "string" && isURL(encodeURI(normalized)))
      .forEach(({element, entityDelimiter, normalized}) => {
        const groupFragment = document.createDocumentFragment()
        const chunks = [
          {type: "delimiter", value: entityDelimiter},
          ...parseURL(normalized),
          {type: "delimiter", value: entityDelimiter}
        ]

        function parseChunk(parentEl, {type, value}) {
          const chunkEl = createElement("span")

          chunkEl.setAttribute(CHUNK_TYPE, type)

          if (typeof value === "string") {
            chunkEl.textContent = value
            chunkEl.setAttribute(PRENORMALIZED, value)
          }

          if (type === "param-key") {
            parentEl.setAttribute(ENTITY_IDENTIFIER, value)
          }

          if (type === "param-group") {
            value.forEach(parseChunk.bind(null, chunkEl))
          }
          else if (SELECTABLE_TYPES.includes(type)) {
            chunkEl.className = STRING_CLASS
          }

          parentEl.appendChild(chunkEl)
        }

        chunks.forEach(parseChunk.bind(null, groupFragment))

        this.replaceElement(element, groupFragment)

        element.classList.remove(STRING_CLASS)
      })

    const entityElements = getEntityElements()
    const entityCount = entityElements.length

    // Offset the existing tabindexes given our entity count.
    Array
      .from(this.steps.attributes.querySelectorAll("[tabindex]"))
      .forEach((tabableEl, index) => tabableEl.tabIndex = entityCount + index + 1)

    // Embed codes that include non script tags like iframes use a special
    // option to let the plugin user choose the location.
    this.includesHTMLTags = Array
      .from(attributePicker.querySelectorAll(".hljs-tag .hljs-name"))
      .map(element => element.textContent)
      .some(name => name !== "script")

    embedCodeLocationContainer.style.display = this.includesHTMLTags ? "none" : ""

    // Populate entities.
    entityElements.forEach((element, index) => {
      const text = element.textContent
      const id = `option_${index + 1}`
      const type = getType(element)
      const normalized = element.getAttribute(PRENORMALIZED) || normalize(type, text)
      let identifier = ""

      if (normalized.length === 0) {
        // Skip empty strings.
        element.classList.remove(STRING_CLASS)
        return
      }

      if (GROUP_PATTERN.test(element.parentNode.getAttribute(CHUNK_TYPE))) {
        identifier = element.parentNode.getAttribute(ENTITY_IDENTIFIER)
      }

      this.entities[id] = {
        delimiter: element.getAttribute(PRENORMALIZED) ? "" : getDelimiter(type, text),
        format: "plaintext",
        element,
        identifier,
        normalized,
        placeholder: normalized,
        order: index,
        original: text,
        tracked: false,
        type
      }

      if (index === 0) element.setAttribute("data-autofocus", "")

      element.tabIndex = index + 1
      element.setAttribute(ENTITY_ID, id)
      element.setAttribute(ENTITY_ORDER, index)
      element.addEventListener("click", this.toggleEntityTracking.bind(this, element))
    })

    attributePicker.addEventListener("keydown", this.handleAttributeKeyDown)

    this.attributeList.render()
    this.syncButtonState()
  }

  toggleEntityTracking(element) {
    const entity = this.entities[element.getAttribute(ENTITY_ID)]

    entity.tracked = !entity.tracked
    const method = entity.tracked ? "add" : "remove"

    element.classList[method]("tracked")

    if (GROUP_PATTERN.test(element.parentNode.getAttribute(CHUNK_TYPE))) {
      element.parentNode.classList[method]("tracked")
    }

    this.attributeList.render()
    this.syncButtonState()
  }

  syncButtonState() {
    const {embedCodeInput, stepsContainer} = this.refs
    const embedCodeStep = stepsContainer.querySelector(".step[data-step='embedCode']")
    const navigateToAttributesButton = embedCodeStep.querySelector("button[data-step='attributes']")

    navigateToAttributesButton.disabled = embedCodeInput.value.length === 0
  }

  @autobind
  handleAttributeKeyDown(event) {
    const entityEl = document.activeElement

    if (!entityEl || ![KM.enter, KM.spacebar].includes(event.keyCode)) return

    const {attributes} = this.steps
    const id = entityEl.getAttribute(ENTITY_ID)

    if (!attributes.contains(entityEl) || !id) return

    event.preventDefault()

    this.toggleEntityTracking(entityEl)
  }

  @autobind
  sendPreviewPayload() {
    const {previewIframe} = this.refs

    previewIframe.contentWindow.postMessage({
      installJSON: this.installJSON,
      type: "eager:app-tester:upload-app"
    }, "*")
  }

  sendPreviewStyleOverrides() {
    const {previewIframe} = this.refs

    previewIframe.contentWindow.postMessage({
      styleContent: previewOverrides,
      type: "eager:app-tester:set-style"
    }, "*")
  }

  @autobind
  handleEntry() {
    this.parseInput()
  }
}
