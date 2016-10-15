import autosize from "autosize"

const script = String.raw`<script>
(function(){
  var handle = "@placeholder";
  var script = document.createElement("script");
  var source = document.getElementsByTagName("script")[0];

  script.async = 1;
  script.src = "https://nectar.ninja/api/v1/" + handle.replace(/^@/, "");

  source.parentNode.insertBefore(script, source);

  // Reset demo.
  document.cookie = 'sentry-close-timestamp=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
})();
</script>`

export default function runDemo(app) {
  const {embedCodeInput, pluginDetailsForm} = app.refs

  embedCodeInput.autofocus = false
  embedCodeInput.value = script
  autosize.update(embedCodeInput)
  app.parseInput()

  const {option_1} = app.entities

  option_1.title = "Twitter username"
  app.toggleEntityTracking(option_1.element)

  const fields = {
    "[name='email']": "demo@instantwordpressplugin.com",
    "[name='app[title]']": "Nectar Ninja",
    "[name='app[description]']": "Send website notifications via Twitter!",
    "[name='app[metadata][description]']": `Let users know of new features, deals or downtimes.
Dead-simple, no signup required. Yes, it's free.`
  }

  Object
    .keys(fields)
    .forEach(name => pluginDetailsForm.querySelector(name).value = fields[name])

  app.imageUploader.imageURL = "/external-assets/bee.png"
}
