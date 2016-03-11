var webpack = require('webpack');
var path = require('path');

module.exports = {
    context: __dirname,
    entry: path.resolve(__dirname, './src/app'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/js/',
        filename: 'bundle.js'
    },
    devtool: 'eval-cheap-module-source-map',
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
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.(eot|woff|woff2|ttf|svg|png|jpg)$/,
                loader: 'url-loader',
                query: {
                    limit: 30000,
                    name: './resources/[name]-[hash].[ext]'
                }
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('development')
            }
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, [/moment$/])
    ],
    resolve: {
        extensions: [
            '',
            '.webpack.js',
            '.web.js',
            '.js',
            '.jsx'
        ],
        alias: {
            'moment$': path.resolve(__dirname, './node_modules/moment/min/moment-with-locales.min.js')
        }
    }
};
