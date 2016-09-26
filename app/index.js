import "./index.styl"

import Application from "components/application"

// TODO: remove me after testing
document.cookie = "sentry-close-timestamp=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
window.INSTALL_OPTIONS = {option_1: "@NectarNinjaDemo"}

document.addEventListener("DOMContentLoaded", () => {
  const application = new Application(document.getElementById("app"))

  if (process.env.NODE_ENV !== "production") {
    window.application = application
  }
})
