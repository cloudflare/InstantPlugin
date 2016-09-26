const INJECTION_PATTERN = "\"{{EMBED_CODE_INJECTION}}\""

export default function createEagerSchema({embedCode, properties}) {
  embedCode = JSON
    .stringify(embedCode)
    .replace("</script>", '</scr" + "ipt>" + "') // eslint-disable-line quotes

  const initializeApp = function initializeApp() {
    if (!window.addEventListener) return // Check for IE9+

    const TRACKED_ENTITY_PATTERN = /TRACKED_ENTITY\[(\S+)\]/g
    const options = INSTALL_OPTIONS

    const insertOption = (match, key) => options[key]

    function insertEmbedCode() {
      let embedCodeInjection = "{{EMBED_CODE_INJECTION}}"

      embedCodeInjection = embedCodeInjection.replace(TRACKED_ENTITY_PATTERN, insertOption)

      document.head.innerHTML += embedCodeInjection

      eval(document.head.lastChild.textContent) // eslint-disable-line no-eval
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", insertEmbedCode)
    }
    else {
      insertEmbedCode()
    }
  }.toString().replace(INJECTION_PATTERN, embedCode)

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
