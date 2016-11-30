import "./intro.styl"
import template from "./intro.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"

export default class IntroStep extends BaseComponent {
  static template = template;

  render() {
    this.compileTemplate()

    const {startButton} = this.refs

    startButton.addEventListener("click", () => this.$root.$activeStep = "embedCode")

    return this.element
  }

  @autobind
  onEnter() {
    const {appHeader, appHeaderContent, appLogo} = this.$root.refs
    const translation = (appHeader.clientWidth - appHeaderContent.clientWidth - appLogo.clientWidth) / 2

    appHeaderContent.style.transform = `translate3d(${translation}px, 0, 0)`
  }

  @autobind
  onExit() {
    const {appHeaderContent} = this.$root.refs

    appHeaderContent.style.transform = ""
  }

  @autobind
  navigateNext() {
    this.$root.$activeStep = "embedCode"
  }
}
