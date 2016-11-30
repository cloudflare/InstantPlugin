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

    this.$activeStep = "intro"

    this.replaceElement(mountPoint, element)
  }

  get $activeStep() {
    return this.element.dataset.activeStep
  }

  set $activeStep(value) {
    const previousStep = this.$activeStep
    const previousStepComponent = this.$activeStepComponent
    const {onEnter = () => {}} = this.steps[value]

    this.element.dataset.activeStep = value

    this.renderTitle()
    this.renderNavigation()

    requestAnimationFrame(() => onEnter(value))

    if (previousStepComponent) {
      const {onExit = () => {}} = previousStepComponent

      this.element.dataset.previousStep = previousStep
      requestAnimationFrame(() => onExit(value))

      setTimeout(() => {
        previousStepComponent.element.scrollTop = 0
      }, 350)
    }

    return this.element.dataset.activeStep
  }

  get $activeStepComponent() {
    return this.steps[this.$activeStep]
  }

  get $modeLabel() {
    return MODE_LABELS[this.mode]
  }

  get $embedCode() {
    const {attributePicker} = this.steps.schema

    return attributePicker.element
  }

  set $embedCode(value) {
    const {attributePicker} = this.steps.schema

    attributePicker.parseInput(value)
    this.steps.schema.updateRender()

    return attributePicker.element
  }

  get $installJSON() {
    const IDs = this.getTrackedEntityIDs()
    const embedCodeDOM = this.$embedCode.cloneNode(true)
    const properties = {}

    IDs.forEach((id, index) => {
      const current = embedCodeDOM.querySelector(`[${$$.ENTITY_ID}="${id}"]`)
      const {delimiter, identifier, format, normalized, placeholder, title, type} = this.entities[id]

      properties[id] = {
        format,
        order: index + 1,
        placeholder,
        default: normalized,
        title: title || identifier || `Option ${index + 1}`,
        type
      }

      if (id !== $$.EMBED_LOCATION) {
        current.textContent = `${delimiter}TRACKED_ENTITY[${id}]${delimiter}`
      }
    })

    const {schemaForm} = this.steps.schema.refs

    return createEagerSchema({
      options: formSerialize(schemaForm, {hash: true}),
      embedCode: embedCodeDOM.textContent,
      properties
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
    const {navigationButtons = []} = this.$activeStepComponent

    navigationContainer.innerHTML = ""

    navigationButtons.forEach(({className, label, handler, href}, index) => {
      const button = this.serialize(navigationButtonTemplate, {
        className,
        href,
        label,
        firstButton: index === 0,
        lastButton: index === navigationButtons.length - 1
      })

      if (handler) button.addEventListener("click", handler)

      navigationContainer.appendChild(button)
    })

    this.updateRefs()
  }

  renderTitle() {
    const {title} = this.refs

    if (this.$activeStepComponent.title) {
      title.textContent = this.$activeStepComponent.title
    }
    else {
      title.textContent = `Instant ${MODE_LABELS[this.mode]} Plugin`
    }
  }

  restart() {
    const {steps} = this

    steps.embedCode.refs.embedCodeInput.value = ""
    this.$embedCode = ""
    steps.schema.updateRender()
    this.$activeStep = "embedCode"
    steps.embedCode.syncButtonState()

    steps.details.resetFields()

    steps.preview.render()
  }
}
