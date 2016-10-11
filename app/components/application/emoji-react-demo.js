const script = String.raw`<script type="text/javascript">
  var emojis = "tada, fire, grinning"
  var selector = "body"
  var url = window.location.href.replace(/(http:\/\/|https:\/\/)/gi, '').replace(/^\/|\/$/g, '');

  var iframe = document.createElement("iframe")
  iframe.src = "https://emojireact.com/embed?emojis=" + emojis.replace(/\s/g, "") + "&url=" + url
  iframe.scrolling = "no"
  iframe.frameBorder = "0"
  iframe.style = "border:none; overflow:hidden; height:35px;"

  var container = document.querySelector(selector)

  container.insertBefore(iframe, container.firstChild || container)
</script>`

export default function runDemo(app) {
  const {embedCodeInput} = app.refs

  embedCodeInput.autofocus = false
  embedCodeInput.value = script
  app.parseInput()

  const {option_2} = app.entities

  option_2.title = "Comma separated list of emoji names"
  app.toggleEntityTracking(option_2.element)
  app.route = "embed-code"
}
