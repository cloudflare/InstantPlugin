export default function createElement(type = "div", properties = {}) {
  const element = document.createElement(type)

  Object.assign(element, properties)

  return element
}
