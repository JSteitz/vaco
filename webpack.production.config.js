// eslint-disable import/no-extraneous-dependencies
const path = require('path')
const webpack = require('webpack')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const WebpackNotifierPlugin = require('webpack-notifier')
const TerserWebpackPlugin = require('terser-webpack-plugin')

module.exports = {
    mode: 'production',
    target: 'web',
    context: path.resolve(__dirname, 'src'),
    entry: './index.ts',

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.min.js'
    },

    module: {
        rules: [
            {
                test: /\.(js|ts)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            }
        ]
    },

    plugins: [
        new webpack.HashedModuleIdsPlugin(),
        new FriendlyErrorsWebpackPlugin({
            clearConsole: true
        }),
        new WebpackNotifierPlugin({
            title: 'Webpack',
            alwaysNotify: true
        })
    ],

    optimization: {
        minimizer: [
            new TerserWebpackPlugin({
                terserOptions: {
                    cache: true,
                    parallel: true
                }
            })
        ]
    },

    resolve: {
        extensions: ['.ts', '.js', '.json'],
        modules: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'node_modules')
        ]
    },

    stats: {
        children: false
    }
}
