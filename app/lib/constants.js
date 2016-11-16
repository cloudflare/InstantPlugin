const STRING_CLASS = "hljs-string"

export default {
  // ACTIVE_STEP: "data-active-step",
  CHUNK_TYPE: "data-chunk-type",
  DEFAULT_PLUGIN_ICON: `${ASSET_BASE}/default-plugin-logo.png`,
  ENTITY_ID: "data-entity-id",
  ENTITY_IDENTIFIER: "data-identifier",
  ENTITY_ORDER: "data-entity-order",
  ENTITY_QUERY: `.${STRING_CLASS}, .hljs-number`,
  GROUP_PATTERN: /-group$/,
  JAVASCRIPT_DECLARATION_CLASS_PATTERN: /hljs-(keyword|attr)/,
  JAVASCRIPT_DECLARATION_PATTERN: /([\$_A-Za-z]+)/,
  JAVASCRIPT_ENTITY_QUERY: ".javascript .hljs-string, .javascript .hljs-number",
  JAVASCRIPT_PROPERTY_PATTERN: /:/,
  PRENORMALIZED: "data-prenormalized",
  SELECTABLE_TYPES: ["path", "param-value"],
  STRING_CLASS,
  TRANSITION_DELAY: 700
}
