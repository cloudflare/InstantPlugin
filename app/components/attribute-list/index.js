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
    const IDs = this.getTrackedEntityIDs()
    const entities = this.getEntities()
    const entityCount = Object.keys(entities).length

    this.element.innerHTML = "<div class=\"attribute-list-content box\"></div>"

    if (IDs.length) {
      this.element.innerHTML = `<p class="divider">
        Add labels for these dynamic options:
      </p>
      ${this.element.innerHTML}
      `
    }

    IDs.forEach((id, index) => {
      const entity = entities[id]
      const element = this.serialize(entityTemplate, {entity, entityCount, index})

      element
        .querySelector(".entity-name > input")
        .addEventListener("input", event => this.setEntityTitle(id, event))

      this.element.querySelector(".attribute-list-content").appendChild(element)
    })

    return this.element
  }
}
