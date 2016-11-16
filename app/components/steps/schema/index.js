import "./schema.styl"
import template from "./schema.pug"
import entityTemplate from "./entity.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"

export default class SchemaStep extends BaseComponent {
  static template = template;

  updateRender() {
    const {element} = this
    const IDs = this.$root.getTrackedEntityIDs()
    const {entities} = this.$root
    const entityCount = Object.keys(entities).length
    const {
      customLocationContainer,
      customLocationInput,
      locationSelect,
      propertyList,
      schemaForm,
      stepLabel
    } = this.refs

    if (IDs.length) {
      const tense = IDs.length === 1 ? "this dynamic option" : "these dynamic options"

      stepLabel.textContent = `Customize ${tense}.`
    }
    else {
      stepLabel.textContent = "Customize location."
    }

    schemaForm.addEventListener("submit", event => {
      event.preventDefault()
      this.$root.$activeStep = "preview"
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

    propertyList.innerHTML = ""

    IDs.forEach((id, index) => {
      const entity = entities[id]
      const entityEl = this.serialize(entityTemplate, {entity, entityCount, id, index})

      entityEl
        .querySelector("[name='schema-name']")
        .addEventListener("input", ({target: {value}}) => entities[id].title = value)

      const formatSelect = entityEl.querySelector("[name='schema-format']")

      formatSelect.value = entity.format
      formatSelect.addEventListener("change", ({target: {value}}) => entities[id].format = value)

      propertyList.appendChild(entityEl)
    })

    return element
  }

  get navigationButtons() {
    return [
      {label: "Back", handler: this.navigatePrevious},
      {label: "Preview Plugin", handler: this.navigateNext}
    ]
  }

  @autobind
  navigatePrevious() {
    this.$root.$activeStep = "embedCode"
  }

  @autobind
  navigateNext() {
    const {schemaFormSubmit} = this.refs

    schemaFormSubmit.click()
  }
}
