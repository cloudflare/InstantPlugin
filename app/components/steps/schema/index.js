import "./schema.styl"
import template from "./schema.pug"
import entityTemplate from "./entity.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import AttributePicker from "components/attribute-picker"

export default class SchemaStep extends BaseComponent {
  static template = template;

  render() {
    this.compileTemplate()

    const {attributePickerMount} = this.refs

    this.attributePicker = new AttributePicker({$root: this.$root})
    this.replaceElement(attributePickerMount, this.attributePicker.render())

    return this.element
  }

  get $customLocationVisible() {
    return this.refs.customLocationContainer.style.display === ""
  }

  set $customLocationVisible(value) {
    const {customLocationContainer, customLocationInput} = this.refs

    if (value) {
      customLocationContainer.style.display = ""
      customLocationInput.required = true
    }
    else {
      customLocationContainer.style.display = "none"
      customLocationInput.required = false
    }
  }

  updateRender() {
    const {element} = this
    const IDs = this.$root.getTrackedEntityIDs()
    const {entities} = this.$root
    const includesLocationEntity = !!entities.embedLocation
    const entityCount = Object.keys(entities).length
    const {
      embedCodeLocationContainer,
      locationSelect,
      propertyList,
      schemaForm,
      stepLabel
    } = this.refs

    embedCodeLocationContainer.style.display = includesLocationEntity ? "none" : ""

    const visibleOptionCount = IDs.length + (includesLocationEntity ? 0 : 1)
    const tense = visibleOptionCount === 1 ? "this dynamic option" : "these dynamic options"

    stepLabel.textContent = `Customize ${tense}.`

    schemaForm.addEventListener("submit", event => {
      event.preventDefault()
      this.$root.$activeStep = "preview"
    })

    locationSelect.addEventListener("change", ({target: {value}}) => {
      this.$customLocationVisible = value === "custom"
    })

    propertyList.innerHTML = ""

    IDs.forEach((id, index) => {
      const entity = entities[id]
      const entityEl = this.serialize(entityTemplate, {entity, entityCount, id, index})

      entityEl
        .querySelector("[name='schema-name']")
        .addEventListener("input", ({target: {value}}) => entities[id].title = value)

      const formatSelect = entityEl.querySelector("[name='schema-format']")

      if (formatSelect) {
        formatSelect.value = entity.format
        formatSelect.addEventListener("change", ({target: {value}}) => entities[id].format = value)
      }

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
