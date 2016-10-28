const {stringify} = JSON

export default function createEagerSchema({options, embedCode, properties}) {
  let resourceLocation
  let mountOptions

  if (properties.embedLocation) {
    // Embed code contains DOM elements.
    // mountOptions is decided by the user at runtime.
    resourceLocation = "body"
  }
  else if (options.location === "custom") {
    // The embed code developer requires that the embed be inserted in a specific place.
    resourceLocation = "body"
    mountOptions = {selector: options.customLocation || "body", method: "after"}
  }
  else {
    resourceLocation = options.location
    mountOptions = {selector: options.location, method: "append"}
  }

  const initializeApp = function initializeApp({mountOptions, embedCodeInjection, resourceLocation}) {
    if (!window.addEventListener) return // Check for IE9+

    const TRACKED_ENTITY_PATTERN = /TRACKED_ENTITY\[([^\]]+)\]/g
    const options = INSTALL_OPTIONS

    if (options.embedLocation) {
      mountOptions = options.embedLocation
    }

    const insertOption = (match, key) => options[key]

    function insertEmbedCode() {
      const mountPoint = Eager.createElement(mountOptions)
      const mountParent = mountPoint.parentNode

      mountPoint.style.display = "none !important"

      const serializer = document.createElement("div")

      serializer.innerHTML = embedCodeInjection.replace(TRACKED_ENTITY_PATTERN, insertOption)

      Array.prototype.forEach.call(serializer.children, element => {
        mountParent.insertBefore(element, mountPoint)

        if (element.nodeName === "SCRIPT" && !element.src) {
          eval(element.textContent) // eslint-disable-line no-eval
        }
      })

      mountPoint.parentNode.removeChild(mountPoint)
    }

    if (resourceLocation === "body" && document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", insertEmbedCode)
    }
    else {
      insertEmbedCode()
    }
  }.toString()

  const installJSON = {
    resources: {
      [resourceLocation]: [
        {
          type: "script",
          contents: `(${initializeApp}({mountOptions: ${stringify(mountOptions)}, embedCodeInjection: ${stringify(embedCode)}, resourceLocation: ${stringify(resourceLocation)}}))`
        }
      ]
    },

    options: {properties}
  }

  return installJSON
}
