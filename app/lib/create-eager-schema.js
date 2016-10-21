export default function createEagerSchema({options, embedCode, properties}) {
  embedCode = JSON.stringify(embedCode)

  let insertSelector = options.location
  let resourceLocation = options.location

  if (options.location === "custom") {
    resourceLocation = "body"
    insertSelector = options.customLocation
  }

  const initializeApp = function initializeApp(insertSelector, embedCodeInjection) {
    if (!window.addEventListener) return // Check for IE9+

    const TRACKED_ENTITY_PATTERN = /TRACKED_ENTITY\[([^\]]+)\]/g
    const options = INSTALL_OPTIONS

    const insertOption = (match, key) => options[key]

    function insertEmbedCode() {
      const mountPoint = Eager.createElement({selector: insertSelector, method: "prepend"})
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

    if (document.readyState === "loading") {
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
          contents: `(${initializeApp}(${JSON.stringify(insertSelector)}, ${embedCode}))`
        }
      ]
    },

    options: {properties}
  }

  return installJSON
}
