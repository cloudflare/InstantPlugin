import "./application.styl"
import template from "./application.pug"

import BaseComponent from "components/base-component"

export default class Application extends BaseComponent {
  static template = template;

  constructor(mountPoint, options) {
    super(options)

    const element = this.compileTemplate()

    mountPoint.appendChild(element)
  }
}
