export default function createEagerSchema({embedCode, properties}) {
  embedCode = JSON.stringify(embedCode)

  const initializeApp = function initializeApp(embedCodeInjection) {
    if (!window.addEventListener) return // Check for IE9+

    const TRACKED_ENTITY_PATTERN = /TRACKED_ENTITY\[(\S+)\]/g
    const options = INSTALL_OPTIONS

    const insertOption = (match, key) => options[key]

    function insertEmbedCode() {
      const serializer = document.createElement("div")

      serializer.innerHTML = embedCodeInjection.replace(TRACKED_ENTITY_PATTERN, insertOption)

      Array.prototype.forEach.call(serializer.children, element => {
        document.body.appendChild(element)

        if (element.nodeName === "SCRIPT") {
          eval(element.textContent) // eslint-disable-line no-eval
        }
      })
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
      body: [
        {
          type: "script",
          contents: `(${initializeApp}(${embedCode}))`
        }
      ]
    },

    options: {properties}
  }

  return installJSON
}
