import {parse} from "url"

const PARAM_PATTERN = /(\#|\?)/
const PATH_DELIMITER_PATTERN = /[^\w+]/
const PROTOCOL_PATTERN = /(^\S*:?)(\/\/)/
const DEFAULT_PROTOCOL_MATCH = [null, "//", ""]

export default function parseURL(string) {
  const [urlWithPath, paramDelimiter = "", paramString = ""] = string.split(PARAM_PATTERN) || []

  const parsed = parse(urlWithPath, false, true)
  const {host, pathname} = parsed
  const pathCharacters = pathname.split("")
  let url

  if (parsed.protocol) {
    url = [parsed.protocol, "//", host].join("")
  }
  else {
    const [, protocol, delimiter] = urlWithPath.match(PROTOCOL_PATTERN) || DEFAULT_PROTOCOL_MATCH

    url = [protocol, delimiter, host].join("")
  }

  const pathChunks = pathCharacters
    .reduce((accumulator, character) => {
      if (PATH_DELIMITER_PATTERN.test(character)) {
        accumulator.push({type: "delimiter", value: character}, {type: "path", value: ""})
      }
      else {
        accumulator[accumulator.length - 1].value += character
      }

      return accumulator
    }, [{type: "path", value: ""}])
    .filter(chunk => chunk.value.length !== 0)

  const params = paramString
    .split("&")
    .filter(chunk => chunk.length !== 0)
    .map(chunk => {
      const [key, value] = chunk.split("=")

      return {key, value}
    })

  return {paramDelimiter, params, pathChunks, url}
}
