import autosize from "autosize"

// Ends with brackets e.g. [data-ref="foo[]"]
const ARRAY_REF_PATTERN = /([a-zA-Z\d]*)(\[?\]?)/

export default class BaseComponent {
  static template = null;
  static store = null;

  constructor(spec = {}) {
    Object.assign(this, {
      element: null,
      refs: {}
    }, spec)
  }

  autofocus(element) {
    element = element || this.element

    const focusElement = element.querySelector("[autofocus], [data-autofocus]")

    if (focusElement) focusElement.focus()
  }

  // NOTE: Calling `updateRefs` multiple times from different tree depths may
  // allow parents to inherit a grandchild.
  updateRefs() {
    const {refs} = this

    Array
      .from(this.element.querySelectorAll("[data-ref]"))
      .forEach(element => {
        const attribute = element.getAttribute("data-ref")
        const [, key, arrayKey] = attribute.match(ARRAY_REF_PATTERN)

        if (arrayKey) {
          // Multiple elements
          if (!Array.isArray(refs[key])) refs[key] = []

          refs[key].push(element)
        }
        else {
          // Single element
          refs[key] = element
        }

        element.removeAttribute("data-ref")
      })
  }

  serialize(template, templateVars = {}) {
    // `document` is used instead of iframe's document to prevent `instanceof` reference errors.
    const serializer = document.createElement("div")

    if (typeof template === "function") {
      serializer.innerHTML = template.call(this, {
        config: this.store,
        ...templateVars
      })
    }
    else {
      serializer.innerHTML = template
    }

    return serializer.firstChild
  }

  compileTemplate(templateVars = {}) {
    const {template} = this.constructor

    this.element = this.serialize(template, templateVars)
    this.updateRefs()

    autosize(this.element.querySelectorAll("textarea:not(.fixed-height)"))

    return this.element
  }

  insertBefore(sibling, element) {
    element.parentNode.insertBefore(sibling, element)
  }

  removeElement(element) {
    if (!element || !element.parentNode) return null

    return element.parentNode.removeChild(element)
  }

  render() {
    return this.compileTemplate()
  }

  replaceElement(current, next) {
    current.parentNode.insertBefore(next, current)
    current.parentNode.removeChild(current)

    if (current.getAttribute("tabindex")) {
      next.tabIndex = current.tabIndex
    }

    this.updateRefs()
  }
}
