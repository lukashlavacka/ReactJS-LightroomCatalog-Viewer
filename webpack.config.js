var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var path = require('path');

module.exports = {
    context: __dirname,
    entry: path.resolve(__dirname, './src/app.jsx'),
    output: {
        filename: path.resolve(__dirname, './dist/js/bundle.js')
    },
    devtool: 'source-map',
    module: {
        noParse: [
            /sql.js$/
        ],
        preLoaders: [
            {
                test: /\.jsx?$/,
                loader: 'eslint-loader',
                include: path.resolve(__dirname, './src')
            }
        ],
        loaders: [
            {
                test: /.jsx?$/,
                loader: 'babel-loader',
                include: path.resolve(__dirname, './src'),
                query: {
                    presets: ['react', 'es2015', 'stage-0' ]
                }
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader")
            },
            {
                test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
                loader: 'url-loader',
                query: {
                    limit: 30000,
                    name: 'dist/resources/[name]-[hash].[ext]'
                }
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        }),
        new ExtractTextPlugin('./dist/css/bundle.css', {
            allChunks: true
        }),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}})
    ],
    resolve: {
        extensions: [
            '',
            '.webpack.js',
            '.web.js',
            '.js',
            '.jsx'
        ]
    },
    scripts: {
        lint: 'eslint src'
    }
};
