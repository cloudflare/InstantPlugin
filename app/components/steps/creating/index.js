import "./creating.styl"
import template from "./creating.pug"

import BaseComponent from "components/base-component"

export default class CreatingStep extends BaseComponent {
  static template = template;

  render() {
    const element = this.compileTemplate()

    return element
  }
}
