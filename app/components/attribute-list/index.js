import "./attribute-list.styl"
import template from "./attribute-list.pug"

import BaseComponent from "components/base-component"
import createElement from "lib/create-element"
import escapeTemplate from "lib/escape-template"

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
      this.element.innerHTML = "<p>Add labels for these dynamic options:</p>" + this.element.innerHTML
    }

    IDs.forEach((id, index) => {
      const entity = entities[id]
      const element = createElement("div", {
        className: "entity"
      })

      element.innerHTML = escapeTemplate`
        <div class="original-entity">
          <code>${entity.original}</code>
        </div>
        <label class="entity-label">
          <div class="label-content">Label for this dynamic option</div>
          <div class="entity-name">
            <input
              class="standard"
              placeholder="Option ${index + 1}"
              tabindex="${entityCount + index + 1}"
              type="text"
              value="${entity.title}"/>
          </div>
        </label>
      `
      element
        .querySelector(".entity-name > input")
        .addEventListener("input", event => this.setEntityTitle(id, event))

      this.element.querySelector(".attribute-list-content").appendChild(element)
    })

    return this.element
  }
}
