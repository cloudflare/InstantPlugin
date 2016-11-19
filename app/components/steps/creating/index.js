import "./creating.styl"
import template from "./creating.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import formSerialize from "form-serialize"
import {postJson} from "simple-fetch"
import $$ from "lib/constants"

export default class CreatingStep extends BaseComponent {
  static template = template;

  @autobind
  onEnter() {
    const {$root} = this
    const onComplete = ({downloadURL}) => {
      $root.downloadURL = downloadURL
      $root.$activeStep = "download"
    }

    const {detailsForm} = $root.steps.details.refs
    const pluginDetails = formSerialize(detailsForm, {hash: true})

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
