import "./schema.styl"
import template from "./schema.pug"
import entityTemplate from "./entity.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"

export default class SchemaStep extends BaseComponent {
  static template = template;

  updateRender() {
    const {element} = this
    const {propertyList} = this.refs
    const IDs = this.$root.getTrackedEntityIDs()
    const {entities} = this.$root
    const entityCount = Object.keys(entities).length

    // if (IDs.length) {
    //   const tense = IDs.length === 1 ? "this dynamic option" : "these dynamic options"

    //   element.innerHTML = `<p class="divider">
    //     Customize ${tense}:
    //   </p>
    //   ${element.innerHTML}
    //   `
    // }
    //
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
      {label: "Next", handler: this.navigateNext}
    ]
  }

  @autobind
  navigatePrevious() {
    this.$root.$activeStep = "embedCode"
  }

  @autobind
  navigateNext() {
    this.$root.$activeStep = "preview"
  }
}
