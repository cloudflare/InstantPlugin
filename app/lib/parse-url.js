const PARAM_PATTERN = /(\#|\?)/

export default function parseURL(string) {
  const [urlBase, paramDelimiter = "", paramString = ""] = string.split(PARAM_PATTERN) || []

  const params = paramString
    .split("&")
    .filter(chunk => chunk.length !== 0)
    .map(chunk => {
      const [key, value] = chunk.split("=")

      return {key, value}
    })

  return {paramDelimiter, params, urlBase}
}
