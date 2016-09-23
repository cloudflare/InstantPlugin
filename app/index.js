import "./index.styl"

import Application from "components/application"

// TODO: remove me after testing
window.INSTALL_OPTIONS = {option_1: "eagerio"}

document.addEventListener("DOMContentLoaded", () => {
  console.log("hello world")

  const application = new Application(document.getElementById("app"))

  if (process.env.NODE_ENV !== "production") {
    window.application = application
  }
})
