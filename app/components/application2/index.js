import "./application.styl"
import template from "./application.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"

const MODE_LABELS = {
  wordpress: "WordPress"
}

export default class Application extends BaseComponent {
  static template = template;

  constructor(mountPoint, options) {
    super(options)

    Object.assign(this, {
      mode: "wordpress",
      steps: {}
    })

    const element = this.compileTemplate()

    mountPoint.appendChild(element)
  }

  get $modeLabel() {
    return MODE_LABELS[this.mode]
  }
}
