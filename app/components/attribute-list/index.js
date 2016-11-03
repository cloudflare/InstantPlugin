import "./attribute-list.styl"
import template from "./attribute-list.pug"
import entityTemplate from "./entity.pug"

import BaseComponent from "components/base-component"
export default class AttributeList extends BaseComponent {
  static template = template;

  constructor() {
    super(...arguments)

    this.compileTemplate()
  }

  render() {
    const IDs = this.$root.getTrackedEntityIDs()
    const {entities} = this.$root
    const entityCount = Object.keys(entities).length

    this.element.innerHTML = "<div class='attribute-list-content box'></div>"

    if (IDs.length) {
      const tense = IDs.length === 1 ? "this dynamic option" : "these dynamic options"

      this.element.innerHTML = `<p class="divider">
        Customize ${tense}:
      </p>
      ${this.element.innerHTML}
      `
    }

    const listContent = this.element.querySelector(".attribute-list-content")

    IDs.forEach((id, index) => {
      const entity = entities[id]
      const entityEl = this.serialize(entityTemplate, {entity, entityCount, id, index})

      entityEl
        .querySelector("[name='schema-name']")
        .addEventListener("input", ({target: {value}}) => entities[id].title = value)

      const formatSelect = entityEl.querySelector("[name='schema-format']")

      formatSelect.value = entity.format
      formatSelect.addEventListener("change", ({target: {value}}) => entities[id].format = value)

      listContent.appendChild(entityEl)
    })

    return this.element
  }
}
