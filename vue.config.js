/* eslint-disable */
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const webpack = require('webpack')

module.exports = {
  baseUrl: '/',
  configureWebpack: {
    node: {
      process: 'mock'
    },
    plugins: [
      new MonacoWebpackPlugin(),
      new webpack.DefinePlugin({
        'process.platform': 0 // bypass process check by Monaco
      })
    ]
  },
  chainWebpack: config => {
    config.module
      .rule('raw')
      .test(/\.md$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()
  }
}
