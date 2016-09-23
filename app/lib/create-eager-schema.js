export default function createEagerSchema({embedCode, properties}) {
  embedCode = embedCode
    .replace(/\n/g, ";") // Newlines
    .replace(/"/g, "\\\"") // Inner quotes

  const initializeApp = function initializeApp() {
    if (!window.addEventListener) return // Check for IE9+

    const OPTIONS_PATTERN = /INSTALL_OPTIONS\["(\S+)"\]/g
    const options = INSTALL_OPTIONS

    const insertOption = (match, key) => {
      const option = options[key]

      return typeof option === "string" ? `"${option}"` : option
    }

    function insertEmbedCode() {
      let inlineEmbedCode = "{{EMBED_CODE}}"

      inlineEmbedCode = inlineEmbedCode.replace(OPTIONS_PATTERN, insertOption)

      document.head.innerHTML += inlineEmbedCode
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", insertEmbedCode)
    }
    else {
      insertEmbedCode()
    }
  }.toString().replace(/{{EMBED_CODE}}/, embedCode)

  return {
    resources: {
      body: [
        {
          type: "script",
          contents: `(${initializeApp}())`
        }
      ]
    },

    options: {properties}
  }
}
