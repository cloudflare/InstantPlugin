/* eslint-env node */
"use strict"

const ENVIRONMENT = process.env.NODE_ENV || "development"
const {resolve} = require("path")
const {description, version} = require("./package.json")
const routes = require("./routes.json")
const api = routes.api[ENVIRONMENT]
const views = routes.views[ENVIRONMENT]
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const marked = require("marked")
const autoprefixer = require("autoprefixer")

const API_BASE = `${api.protocol}://${api.hostname}${api.port ? ":" + api.port : ""}`
const exclude = /node_modules/

const renderer = new marked.Renderer()
const $ = {}

$.buildDirectory = "site-deploy"

$.devtool = "source-map"

$.entry = {
  site: "./app/index.js"
  // segment: "./app/segment.js" TODO get account key
}

$.markdownLoader = {renderer}

$.output = {
  filename: "[name].js",
  sourceMapFilename: "[name].map"
}

$.plugins = [
  new webpack.NoErrorsPlugin(),
  new webpack.DefinePlugin({
    API_BASE: JSON.stringify(API_BASE),
    VERSION: JSON.stringify(version),
    "process.env.NODE_ENV": JSON.stringify(ENVIRONMENT)
  }),
  new HtmlWebpackPlugin({
    title: "Instant Plugin",
    description,
    template: "app/index.pug"
  })
]

$.resolve = {
  extensions: ["", ".js", ".json"],
  modules: [resolve(__dirname, "app"), "node_modules"]
}

$.postcss = () => [autoprefixer({remove: false, browsers: ["last 2 versions", "ie 10"]})]

const minimizeParam = ENVIRONMENT === "development" ? "-minimize" : "minimize"

$.module = {
  loaders: [
    {test: /\.pug$/, loader: "pug", exclude},
    {test: /\.png|jpe?g|gif$/i, loader: "url?limit=0", exclude},
    {test: /\.js$/, loader: "babel", exclude},
    {test: /\.svg$/, loader: "svg-inline", exclude},
    {test: /\.styl$/, loader: `style!css?${minimizeParam}!postcss!stylus?paths=app`}
  ],
  noParse: /\.min\.js/
}

if (ENVIRONMENT === "development") {
  $.devtool = "eval"

  $.module.preLoaders = [{
    exclude,
    loader: "eslint-loader",
    test: /\.js$/
  }]

  const devServerClient = `webpack-dev-server/client?http://0.0.0.0:${views.port}`

  if (Array.isArray($.entry)) {
    $.entry.unshift(devServerClient)
  }
  else {
    $.entry["dev-server-client"] = devServerClient
  }
}

module.exports = $
