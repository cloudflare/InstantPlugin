import "./application.styl"
import template from "./application.pug"
import navigationButtonTemplate from "./navigation-button.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import * as stepComponents from "components/steps"
import formSerialize from "form-serialize"
import createEagerSchema from "lib/create-eager-schema"
import $$ from "lib/constants"

const MODE_LABELS = {
  drupal: "Drupal",
  joomla: "Joomla",
  wordpress: "WordPress"
}

const STEPS_PROGRESSION = [
  "intro",
  "embedCode",
  "schema",
  "preview",
  "details",
  "creating",
  "download"
]

export default class Application extends BaseComponent {
  static template = template;

  constructor(mountPoint, options) {
    super(options)

    Object.assign(this, {
      _embedCode: "",
      entities: {},
      mode: "wordpress",
      steps: {}
    })

    const element = this.compileTemplate()
    const {stepsContainer} = this.refs

    STEPS_PROGRESSION.forEach(stepID => {
      const step = new stepComponents[stepID]({$root: this})

      this.steps[stepID] = step

      stepsContainer.appendChild(step.render())
    })

    // this.$activeStep = "intro"
    this.$activeStep = "schema"
    element.querySelector("[data-demo='emojiReact']").click()

    this.replaceElement(mountPoint, element)
  }

  get $activeStep() {
    return this.element.dataset.activeStep
  }

  set $activeStep(value) {
    const previousStepEl = this.$activeStepEl
    const {onActive = () => {}} = this.steps[value]

    onActive(value)

    this.element.dataset.activeStep = value
    this.renderNavigation()

    if (previousStepEl) {
      setTimeout(() => {
        previousStepEl.element.scrollTop = 0
      }, 350)
    }

    return this.element.dataset.activeStep
  }

  get $activeStepEl() {
    return this.steps[this.$activeStep]
  }

  get $modeLabel() {
    return MODE_LABELS[this.mode]
  }

  get $embedCode() {
    const {attributePicker} = this.steps.schema

    return attributePicker.refs.picker
  }

  set $embedCode(value) {
    const {attributePicker} = this.steps.schema

    attributePicker.parseInput(value)

    return attributePicker.refs.picker
  }

  get $installJSON() {
    const IDs = this.getTrackedEntityIDs()
    const embedCodeDOM = this.$embedCode.cloneNode(true)
    const properties = {}

    IDs.forEach((id, index) => {
      const {delimiter, identifier, format, normalized, placeholder, title, type} = this.entities[id]
      const current = embedCodeDOM.querySelector(`[${$$.ENTITY_ID}="${id}"]`)

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

    const {attributesForm} = this.attributePicker.refs

    return createEagerSchema({
      options: formSerialize(attributesForm, {hash: true}),
      embedCode: embedCodeDOM.textContent,
      properties: this.$properties
    })
  }

  @autobind
  getTrackedEntityIDs() {
    const $ = this.entities

    return Object.keys($)
      .filter(key => $[key].tracked)
      .sort((keyA, keyB) => $[keyA].order - $[keyB].order)
  }

  renderNavigation() {
    const {navigationContainer} = this.refs
    const {navigationButtons = []} = this.$activeStepEl

    navigationContainer.innerHTML = ""

    navigationButtons.forEach(({label, handler}, index) => {
      const button = this.serialize(navigationButtonTemplate, {
        label,
        firstButton: index === 0,
        lastButton: index === navigationButtons.length - 1
      })

      button.addEventListener("click", handler)

      navigationContainer.appendChild(button)
    })
  }

  syncButtonState() {
    // TODO: flesh out
  }
}
