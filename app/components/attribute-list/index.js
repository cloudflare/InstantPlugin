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

    this.element.innerHTML = ""

    IDs.forEach((id, order) => {
      const entity = this.entities[id]
      const element = createElement("div", {
        className: "entity"
      })

      element.innerHTML = escapeTemplate`
        <label class="entity-label">
          <div class="label-content">Label for ${entity.original}</div>

          <div class="entity-name">
            <input type="text" placeholder="Option ${order + 1}"/>
          </div>
        </label>
      `
      element
        .querySelector(".entity-name > input")
        .addEventListener("input", event => this.setEntityTitle(id, event))

      this.element.appendChild(element)
    })

    return this.element
  }
}
