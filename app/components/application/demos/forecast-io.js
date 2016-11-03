import autosize from "autosize"

const script = String.raw`<iframe id="forecast_embed" type="text/html" frameborder="0" height="245" width="100%" src="//forecast.io/embed/#lat=42.3583&lon=-71.0603&name=Downtown Boston">
</iframe>`

export default function runDemo(app) {
  const {attributePicker} = app
  const {embedCodeInput, pluginDetailsForm} = app.refs
  const {locationSelect} = attributePicker.refs

  embedCodeInput.autofocus = false
  embedCodeInput.value = script
  autosize.update(embedCodeInput)
  attributePicker.parseInput()

  locationSelect.value = "body"

  const {option_7, option_8, option_9} = app.entities

  option_7.title = "Latitude"
  option_8.title = "Longitude"
  option_9.title = "Description"

  attributePicker.toggleEntityTracking(option_7.element)
  attributePicker.toggleEntityTracking(option_8.element)
  attributePicker.toggleEntityTracking(option_9.element)

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
