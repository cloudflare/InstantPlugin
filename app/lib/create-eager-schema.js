const encode = string => window.btoa(unescape(encodeURIComponent(string)))

export default function createEagerSchema({embedCode, properties}) {
  const initializeApp = function initializeApp(encodedEmbedCode) {
    if (!window.addEventListener) return // Check for IE9+

    const TRACKED_ENTITY_PATTERN = /TRACKED_ENTITY\[(\S+)\]/g
    const options = INSTALL_OPTIONS

    const insertOption = (match, key) => options[key]
    const decode = string => decodeURIComponent(escape(window.atob(string)))

    function insertEmbedCode() {
      const embedCode = decode(encodedEmbedCode).replace(TRACKED_ENTITY_PATTERN, insertOption)

      document.head.innerHTML += embedCode

      eval(document.head.lastChild.textContent) // eslint-disable-line no-eval
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", insertEmbedCode)
    }
    else {
      insertEmbedCode()
    }
  }.toString().replace(/\\n/g, "\\\\n")

  const installJSON = {
    resources: {
      body: [
        {
          type: "script",
          contents: `(${initializeApp}("${encode(embedCode)}"))`
        }
      ]
    },

    options: {properties}
  }

  return installJSON
}
