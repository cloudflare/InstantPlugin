export default function createEagerSchema({embedCode, properties}) {
  embedCode = JSON.stringify(embedCode)

  const initializeApp = function initializeApp(embedCodeInjection) {
    if (!window.addEventListener) return // Check for IE9+

    const TRACKED_ENTITY_PATTERN = /TRACKED_ENTITY\[(\S+)\]/g
    const options = INSTALL_OPTIONS

    const insertOption = (match, key) => options[key]

    function insertEmbedCode() {
      embedCodeInjection = JSON
        .parse(embedCodeInjection)
        .replace(TRACKED_ENTITY_PATTERN, insertOption)

      document.head.innerHTML += embedCodeInjection

      eval(document.head.lastChild.textContent) // eslint-disable-line no-eval
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
          contents: `(${initializeApp}(${JSON.stringify(embedCode)}))`
        }
      ]
    },

    options: {properties}
  }

  return installJSON
}
