import {parse} from "url"

const PARAM_PATTERN = /(\#|\?)/
const PATH_DELIMITER_PATTERN = /[^\w+]/
const PROTOCOL_PATTERN = /(^\S*:?)(\/\/)/
const DEFAULT_PROTOCOL_MATCH = [null, "//", ""]

const chunkIsPresent = chunk => chunk.value.length !== 0

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
    .filter(chunkIsPresent)

  const paramChunks = []

  paramString.split("&").forEach((param, index, paramArray) => {
    const [key, value] = param.split("=")

    paramChunks.push(
      {type: "param-group", value: [
        {type: "param-key", value: key},
        {type: "delimiter", value: "="},
        {type: "param-value", value}
      ]}
    )

    if (index !== paramArray.length - 1) {
      paramChunks.push({type: "delimiter", value: "&"})
    }
  })

  if (paramChunks.length) {
    paramChunks.unshift({type: "delimiter", value: paramDelimiter})
  }

  return [
    {type: "url", value: url},
    ...pathChunks,
    ...paramChunks
  ]
}
