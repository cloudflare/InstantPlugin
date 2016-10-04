export default function escapeTemplate(strings, ...values) {
  const escapeElement = document.createElement("textarea")
  const merged = strings.slice()
  let offset = 0

  function esc(content) {
    escapeElement.textContent = content

    return escapeElement.innerHTML
  }

  for (let i = 0; i < merged.length; i++) {
    if (i === values.length) break

    offset++

    merged.splice(i + offset, 0, esc(values[i]))
  }

  return merged.join("")
}
