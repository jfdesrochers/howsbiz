const webpack = require('webpack')
const path = require('path')

module.exports = {
    entry: './assets/js/app.js',
    output: {
        path: path.resolve(__dirname, 'assets', 'js'),
        publicPath: '/assets/js/',
        filename: 'appbundle.min.js'
    },
    module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['env']
              }
            }
          }
        ]
      },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
            },
            output: {
                comments: false,
            },
        })
    ],
    devServer: {
        proxy: {
            '/': 'http://localhost:8080'
        },
        port: 3000,
        host: '0.0.0.0'
    }
}