import "./application.styl"
import template from "./application.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import {highlight} from "highlight.js"
import createEagerSchema from "lib/create-eager-schema"
import {postJson} from "simple-fetch"

const ENTITY_ID = "data-entity-id"
const ENTITY_ORDER = "data-entity-order"
const TYPE_PATTERN = /hljs-([\S]*)/

export default class Application extends BaseComponent {
  static template = template;

  constructor(mountPoint, options) {
    super(options)

    Object.assign(this, {
      entities: null,
      parsedEmbedCode: null
    })

    const element = this.compileTemplate()
    const {stepsContainer, embedCodeInput, createPluginButton, nextButton, previousButton} = this.refs

    embedCodeInput.addEventListener("input", this.handleEntry)
    mountPoint.appendChild(element)

    // TODO: Remove after testing is done.
    embedCodeInput.value = `<script>
  (function(){
  var handle = '@placeholder';
  var a = document.createElement('script');
  var m = document.getElementsByTagName('script')[0];
  a.async = 1;
  a.src = 'https://nectar.ninja/api/v1/' + handle.slice(1);
  m.parentNode.insertBefore(a, m);
  })();
</script>`
    // embedCodeInput.value = ""
    this.parseInput()

    createPluginButton.addEventListener("click", this.createPlugin)
    nextButton.addEventListener("click", () => stepsContainer.setAttribute("data-active-step", "attribute"))
    previousButton.addEventListener("click", () => {
      stepsContainer.setAttribute("data-active-step", "embed-code")
      embedCodeInput.focus()
    })
  }

  @autobind
  createPlugin() {
    const trackedIDs = this.getTrackedEntitiesIDs()
    const embedCodeDOM = this.refs.attributePicker.cloneNode(true)
    const properties = {}

    trackedIDs.forEach((id, order) => {
      const entity = this.entities[id]

      properties[id] = {
        title: entity.title,
        order,
        type: entity.type
      }


      const current = embedCodeDOM.querySelector(`[${ENTITY_ID}="${id}"]`)
      const entityDelimiter = entity.type === "string" ? current.textContent[0] : ""

      current.textContent = `${entityDelimiter}TRACKED_ENTITY[${id}]${entityDelimiter}`
    })

    const appSchema = createEagerSchema({
      embedCode: embedCodeDOM.textContent,
      properties
    })

    console.log(appSchema.resources.body[0].contents)

    // TODO: Remove after testing.
    eval(appSchema.resources.body[0].contents) // eslint-disable-line no-eval

    // TODO: flesh out
    if (!document) {
      postJson(`${API_BASE}/instant-plugin`, {appSchema})
        .then(response => console.log(response))
        .catch(error => console.error(error))
    }
  }

  getTrackedEntitiesIDs() {
    const $ = this.entities

    return Object.keys($)
      .filter(key => $[key].tracked)
      .sort((keyA, keyB) => $[keyA].order - $[keyB].order)
  }

  parseInput() {
    const {attributePicker, embedCodeInput} = this.refs

    this.entities = {}

    attributePicker.innerHTML = highlight("html", embedCodeInput.value).value

    Array
      .from(attributePicker.querySelectorAll(".hljs-string, .hljs-number"))
      .forEach((element, order) => {
        const id = `option_${order + 1}`
        const title = `Option ${order + 1}`
        const [, type] = element.className.match(TYPE_PATTERN)

        this.entities[id] = {order, title, tracked: false, type}

        element.setAttribute(ENTITY_ID, id)
        element.setAttribute(ENTITY_ORDER, order)
        element.addEventListener("click", this.toggleEntityTracking.bind(this, element))
      })

    this.syncButtonState()
  }

  toggleEntityTracking(element) {
    const entity = this.entities[element.getAttribute(ENTITY_ID)]

    if (entity.tracked) {
      entity.tracked = false
      element.classList.remove("tracked")
    }
    else {
      entity.tracked = true
      element.classList.add("tracked")
    }

    this.syncButtonState()
  }

  syncButtonState() {
    const {embedCodeInput, createPluginButton, nextButton} = this.refs

    nextButton.disabled = embedCodeInput.value.length === 0
    createPluginButton.disabled = this.getTrackedEntitiesIDs().length === 0
  }

  @autobind
  handleEntry() {
    this.parseInput()
  }
}
