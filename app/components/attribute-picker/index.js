import "./attribute-picker.styl"
import template from "./attribute-picker.pug"

import autobind from "autobind-decorator"
import BaseComponent from "components/base-component"
import createElement from "lib/create-element"
import hljs from "highlight.js"
import KM from "lib/key-map"
import parseURL from "lib/parse-url"
import isURL from "is-url"
import $$ from "lib/constants"

// Actionscript is stubbed since HLJS miscategorizes small JavaScript embed codes.
hljs.registerLanguage("actionscript", () => ({}))

const getType = element => {
  const [, type] = element.className.match(/hljs-([\S]*)/)

  return type
}
const getDelimiter = (type, text) => type === "string" ? text[0] : ""
const normalize = (type, text) => getDelimiter(type, text) ? text.substring(1, text.length - 1) : text

export default class AttributePicker extends BaseComponent {
  static template = template;

  parseInput(value) {
    this.$root.entities = {}

    const {element} = this
    const serializer = createElement("div", {
      innerHTML: hljs.highlightAuto(value, ["html", "javascript"]).value
    })

    if (!serializer.querySelector($$.ENTITY_QUERY)) {
      element.classList.add("empty")
      element.innerHTML = `
        <p class="details">
          We couldn’t find any configurable strings or numbers in that embed code.
        </p>

        <p class="details">
          Press “Next” to continue.
        </p>
      `

      this.$root.syncButtonState()
      return
    }

    element.classList.remove("empty")
    element.innerHTML = serializer.innerHTML

    // Remove strings that object properties.
    Array
      .from(element.querySelectorAll($$.JAVASCRIPT_ENTITY_QUERY))
      .forEach(entityEl => {
        const {nextSibling} = entityEl

        if (!nextSibling || nextSibling.nodeType !== Node.TEXT_NODE) return
        if (!$$.JAVASCRIPT_PROPERTY_PATTERN.test(nextSibling.textContent)) return

        entityEl.classList.remove($$.STRING_CLASS)
        entityEl.classList.add("hljs-attr")
      })

    // Group HTML attributes with their values.
    Array
      .from(element.querySelectorAll(".hljs-tag .hljs-string"))
      .forEach(entityEl => {
        const normalized = encodeURI(normalize("string", entityEl.textContent))

        if (isURL(normalized)) return

        const collection = [entityEl]
        let sibling = entityEl

        const replaceWithGroup = () => {
          const entityGroup = createElement("span")

          entityGroup.setAttribute($$.CHUNK_TYPE, "attribute-group")

          collection.forEach(entry => {
            let cloneEl = entry.cloneNode(true)

            if (cloneEl.nodeType === Node.TEXT_NODE) {
              cloneEl = createElement("span", {
                className: "entity-text",
                textContent: cloneEl.textContent
              })
            }

            entityGroup.appendChild(cloneEl)
          })

          const attributeEl = entityGroup.querySelector(".hljs-attr")
          const identifier = attributeEl ? attributeEl.textContent : ""

          entityGroup.setAttribute($$.ENTITY_IDENTIFIER, identifier)

          entityEl.parentNode.insertBefore(entityGroup, entityEl)
          collection.forEach(entry => entry.parentNode.removeChild(entry))
        }

        // Walk the DOM until we find the attribute.
        while (sibling = sibling.previousSibling) { // eslint-disable-line no-cond-assign
          collection.unshift(sibling)

          const {className = ""} = sibling

          if (/hljs-attr/.test(className)) {
            replaceWithGroup()
            break
          }
        }
      })

    // Group JS entities with their assignment name.
    Array
      .from(element.querySelectorAll($$.JAVASCRIPT_ENTITY_QUERY))
      .forEach(entityEl => {
        const collection = [entityEl]
        let sibling = entityEl

        const replaceWithGroup = tokenName => {
          const entityGroup = createElement("span")
          const type = {
            attr: "property",
            keyword: "assignment"
          }[tokenName]

          entityGroup.setAttribute($$.CHUNK_TYPE, "entity-group")

          collection.forEach(entry => {
            let cloneEl = entry.cloneNode(true)

            if (cloneEl.nodeType === Node.TEXT_NODE) {
              cloneEl = createElement("span", {
                className: "entity-text",
                textContent: cloneEl.textContent
              })
            }

            entityGroup.appendChild(cloneEl)
          })

          let identifier = `Unknown ${type}`

          if (type === "property") {
            const propertyEl = entityGroup.querySelector(".hljs-attr")

            if (propertyEl) identifier = propertyEl.textContent
          }
          else {
            const identifierEl = entityGroup.querySelector(".entity-text")

            if (identifierEl) {
              [, identifier] = identifierEl.textContent.match($$.JAVASCRIPT_DECLARATION_PATTERN)

              if (identifier) {
                identifierEl.innerHTML = identifierEl.innerHTML.replace($$.JAVASCRIPT_DECLARATION_PATTERN,
                  "<span class='entity-identifier'>$1</span>")
              }
            }
          }

          entityGroup.setAttribute($$.ENTITY_IDENTIFIER, identifier)

          entityEl.parentNode.insertBefore(entityGroup, entityEl)
          collection.forEach(entry => entry.parentNode.removeChild(entry))
        }

        // Walk the DOM until we (hopefully) find the declaration.
        while (sibling = sibling.previousSibling) { // eslint-disable-line no-cond-assign
          collection.unshift(sibling)

          const {className = ""} = sibling
          const [, tokenName] = className.match($$.JAVASCRIPT_DECLARATION_CLASS_PATTERN) || []

          if (tokenName) {
            replaceWithGroup(tokenName)
            break
          }
        }
      })


    const getEntityElements = () => Array.from(element.querySelectorAll($$.ENTITY_QUERY))

    // Parse URL components into entities.
    getEntityElements()
      .map(element => {
        const type = getType(element)

        return {
          element,
          type,
          entityDelimiter: getDelimiter(type, element.textContent),
          normalized: normalize(type, element.textContent)
        }
      })
      .filter(({type, normalized}) => type === "string" && isURL(encodeURI(normalized)))
      .forEach(({element, entityDelimiter, normalized}) => {
        const groupFragment = document.createDocumentFragment()
        const chunks = [
          {type: "delimiter", value: entityDelimiter},
          ...parseURL(normalized),
          {type: "delimiter", value: entityDelimiter}
        ]

        function parseChunk(parentEl, {type, value}) {
          const chunkEl = createElement("span")

          chunkEl.setAttribute($$.CHUNK_TYPE, type)

          if (typeof value === "string") {
            chunkEl.textContent = value
            chunkEl.setAttribute($$.PRENORMALIZED, value)
          }

          if (type === "param-key") {
            parentEl.setAttribute($$.ENTITY_IDENTIFIER, value)
          }

          if (type === "param-group") {
            value.forEach(parseChunk.bind(null, chunkEl))
          }
          else if ($$.SELECTABLE_TYPES.includes(type)) {
            chunkEl.className = $$.STRING_CLASS
          }

          parentEl.appendChild(chunkEl)
        }

        chunks.forEach(parseChunk.bind(null, groupFragment))

        this.replaceElement(element, groupFragment)

        element.classList.remove($$.STRING_CLASS)
      })

    const entityElements = getEntityElements()
    const entityCount = entityElements.length

    // Offset the existing tabindexes given our entity count.
    Array
      .from(this.element.querySelectorAll("[tabindex]"))
      .forEach((tabableEl, index) => tabableEl.tabIndex = entityCount + index + 1)

    // Populate entities.
    entityElements.forEach((element, index) => {
      const text = element.textContent
      const id = `option_${index + 1}`
      const type = getType(element)
      const normalized = element.getAttribute($$.PRENORMALIZED) || normalize(type, text)
      let identifier = ""

      if (normalized.length === 0) {
        // Skip empty strings.
        element.classList.remove($$.STRING_CLASS)
        return
      }

      if ($$.GROUP_PATTERN.test(element.parentNode.getAttribute($$.CHUNK_TYPE))) {
        identifier = element.parentNode.getAttribute($$.ENTITY_IDENTIFIER)
      }

      this.$root.entities[id] = {
        delimiter: element.getAttribute($$.PRENORMALIZED) ? "" : getDelimiter(type, text),
        format: "plaintext",
        element,
        identifier,
        normalized,
        placeholder: normalized,
        order: index,
        original: text,
        tracked: false,
        type
      }

      if (index === 0) element.setAttribute("data-autofocus", "")

      element.tabIndex = index + 1
      element.setAttribute($$.ENTITY_ID, id)
      element.setAttribute($$.ENTITY_ORDER, index)
      element.addEventListener("click", this.toggleEntityTracking.bind(this, element))
    })

    element.addEventListener("keydown", this.handleAttributeKeyDown)

    // Embed codes that include non script tags like iframes use a special
    // option to let the plugin user choose the location.
    const includesHTMLTags = Array
      .from(element.querySelectorAll(".hljs-tag .hljs-name"))
      .map(element => element.textContent)
      .some(name => name !== "script")

    if (includesHTMLTags) {
      this.$root.entities.embedLocation = {
        format: "element",
        normalized: {selector: "body", method: "prepend"},
        order: entityCount,
        title: "Location",
        tracked: true,
        type: "object"
      }
    }

    this.$root.steps.schema.updateRender()
    this.$root.syncButtonState()
  }

  toggleEntityTracking(element) {
    const entity = this.$root.entities[element.getAttribute($$.ENTITY_ID)]

    entity.tracked = !entity.tracked
    const method = entity.tracked ? "add" : "remove"

    element.classList[method]("tracked")

    if ($$.GROUP_PATTERN.test(element.parentNode.getAttribute($$.CHUNK_TYPE))) {
      element.parentNode.classList[method]("tracked")
    }

    this.$root.steps.schema.updateRender()
    this.$root.syncButtonState()
  }


  @autobind
  handleAttributeKeyDown(event) {
    const entityEl = document.activeElement

    if (!entityEl || ![KM.enter, KM.spacebar].includes(event.keyCode)) return

    const {attributes} = this.steps
    const id = entityEl.getAttribute($$.ENTITY_ID)

    if (!attributes.contains(entityEl) || !id) return

    event.preventDefault()

    this.toggleEntityTracking(entityEl)
  }
}
