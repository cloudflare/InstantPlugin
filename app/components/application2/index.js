import "./application.styl"
import template from "./application.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import * as stepComponents from "components/steps"
import $$ from "lib/constants"
import createElement from "lib/create-element"

const MODE_LABELS = {
  drupal: "Drupal",
  joomla: "Joomla",
  wordpress: "WordPress"
}

const STEPS_PROGRESSION = [
  "intro",
  "embedCode",
  "schema"
]

export default class Application extends BaseComponent {
  static template = template;

  constructor(mountPoint, options) {
    super(options)

    Object.assign(this, {
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
    this.element.dataset.activeStep = value

    this.renderNavigation()

    return this.element.dataset.activeStep
  }

  get $modeLabel() {
    return MODE_LABELS[this.mode]
  }

  renderNavigation() {
    const {navigationContainer} = this.refs
    const {navigationButtons = []} = this.steps[this.$activeStep]

    navigationContainer.innerHTML = ""

    navigationButtons.forEach(({label, handler}, index) => {
      const button = createElement("button", {
        textContent: label,
        className: `button ${index === navigationButtons.length - 1 ? "primary" : "secondary"}`
      })

      button.addEventListener("click", handler)

      navigationContainer.appendChild(button)
    })
  }
}
