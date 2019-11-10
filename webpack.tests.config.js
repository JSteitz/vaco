const path = require('path')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const WebpackNotifierPlugin = require('webpack-notifier')
const NodeExternals = require('webpack-node-externals')

module.exports = {
    mode: 'development',
    target: 'node',
    context: path.resolve(__dirname, 'test'),
    devtool: 'eval-source-map',
    entry: './index.js',

    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.test.js'
    },

    module: {
        rules: [
            {
                test: /\.(js|ts)$/,
                exclude: ['/node_modules/', '/test/'],
                use: ['babel-loader']
            }
        ]
    },

    plugins: [
        new FriendlyErrorsWebpackPlugin({
            clearConsole: true
        }),
        new WebpackNotifierPlugin({
            title: 'Webpack',
            alwaysNotify: true
        })
    ],

    resolve: {
        extensions: ['.ts', '.js', '.json'],
        modules: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'test'),
            path.resolve(__dirname, 'node_modules')
        ]
    },

    externals: [NodeExternals()],

    stats: {
        children: false
    }
}
