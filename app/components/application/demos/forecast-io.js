import autosize from "autosize"

const script = String.raw`<iframe id="forecast_embed" type="text/html" frameborder="0" height="245" width="100%" src="//forecast.io/embed/#lat=42.3583&lon=-71.0603&name=Downtown Boston">
</iframe>`

export default function runDemo(app) {
  const {embedCodeInput, pluginDetailsForm} = app.refs

  embedCodeInput.autofocus = false
  embedCodeInput.value = script
  autosize.update(embedCodeInput)
  app.parseInput()

  const {option_6, option_7, option_8} = app.entities

  option_6.title = "Latitude"
  option_7.title = "Longitude"
  option_8.title = "Location Name"

  app.toggleEntityTracking(option_6.element)
  app.toggleEntityTracking(option_7.element)
  app.toggleEntityTracking(option_8.element)

  const fields = {
    "[name='app[title]']": "Forecast.io",
    "[name='app[description]']": "Display local weather information on your website.",
    "[name='email']": "demo@instantwordpressplugin.com"
  }

  Object
    .keys(fields)
    .forEach(name => pluginDetailsForm.querySelector(name).value = fields[name])

  app.imageUploader.imageURL = `${ASSET_BASE}/forecast.png`
}
