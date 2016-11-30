import autosize from "autosize"

const script = String.raw`<iframe id="forecast_embed" type="text/html" frameborder="0" height="245" width="100%" src="//forecast.io/embed/#lat=42.3583&lon=-71.0603&name=Downtown Boston">
</iframe>`

export default function runDemo(app) {
  const {steps} = app
  const {attributePicker} = steps.schema
  const {locationSelect} = steps.schema.refs
  const {embedCodeInput} = steps.embedCode.refs
  const {detailsForm} = steps.details.refs

  embedCodeInput.autofocus = false
  embedCodeInput.value = script
  app.$embedCode = embedCodeInput.value
  autosize.update(embedCodeInput)
  steps.embedCode.syncButtonState()

  locationSelect.value = "body"

  const {option_7, option_8, option_9} = app.entities

  option_7.title = "Latitude"
  attributePicker.toggleEntityTracking(option_7.element)

  option_8.title = "Longitude"
  attributePicker.toggleEntityTracking(option_8.element)

  option_9.title = "Description"
  attributePicker.toggleEntityTracking(option_9.element)

  const fields = {
    "[name='app[title]']": "Forecast.io",
    "[name='app[description]']": "Display local weather information on your website.",
    "[name='email']": "demo@instantwordpressplugin.com"
  }

  Object
    .keys(fields)
    .forEach(name => detailsForm.querySelector(name).value = fields[name])

  steps.details.imageUploader.imageURL = `${ASSET_BASE}/forecast.png`
}
