import "./creating.styl"
import template from "./creating.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import formSerialize from "form-serialize"
import {postJson} from "simple-fetch"
import $$ from "lib/constants"

const MINIMUM_TRANSITION_DELAY = 2000

export default class CreatingStep extends BaseComponent {
  static template = template;

  @autobind
  onEnter() {
    const {$root} = this
    const {detailsForm} = $root.steps.details.refs
    const pluginDetails = formSerialize(detailsForm, {hash: true})
    const startTime = Date.now()

    const onComplete = ({downloadURL}) => {
      // Delay the transition slightly to smooth out the animation.
      const delay = Math.max(MINIMUM_TRANSITION_DELAY - (Date.now() - startTime), 0)

      setTimeout(() => {
        $root.downloadURL = downloadURL
        $root.$activeStep = "download"
      }, delay)
    }

    pluginDetails.app.icon = pluginDetails.app.icon || $$.DEFAULT_PLUGIN_ICON

    const payload = {
      cmsName: "wordpress",
      installJSON: $root.$installJSON,
      ...pluginDetails
    }

    postJson(`${API_BASE}/create/instant`, payload)
      .then(onComplete)
      .catch(error => console.error(error))
  }
}
