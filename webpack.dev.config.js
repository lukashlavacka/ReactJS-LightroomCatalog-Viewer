var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var path = require('path');

module.exports = {
    context: __dirname,
    entry: path.resolve(__dirname, './src/app.jsx'),
    output: {
        filename: path.resolve(__dirname, './dist/js/bundle.js')
    },
    devtool: 'eval-cheap-module-source-map',
    module: {
        noParse: [
            /sql.js$/
        ],
        loaders: [
            {
                test: /.jsx?$/,
                loader: 'babel-loader',
                include: path.resolve(__dirname, './src'),
                query: {
                    presets: ['es2015', 'stage-0', 'react']
                }
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
                loader: 'url-loader',
                query: {
                    limit: 30000,
                    name: './dist/resources/[name]-[hash].[ext]'
                }
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('development')
            }
        })
    ],
    resolve: {
        extensions: [
            '',
            '.webpack.js',
            '.web.js',
            '.js',
            '.jsx'
        ],
        unsafeCache: true
    }
};