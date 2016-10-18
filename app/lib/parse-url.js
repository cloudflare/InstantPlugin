const PARAM_PATTERN = /(\#|\?)/

export default function parseURL(string) {
  const [urlBase, paramDelimiter = "", paramString = ""] = string.split(PARAM_PATTERN) || []

  const params = paramString
    .split("&")
    .map(chunk => {
      const [key, value] = chunk.split("=")

      return {key, value}
    })

  return {paramDelimiter, params, urlBase}
}
