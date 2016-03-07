var webpack = require('webpack');

module.exports = {
    context: __dirname,
    entry: './src/app.jsx',
    output: {
        filename: './dist/bundle.js'
    },
    devtool: 'cheap-source-map',
    module: {
        noParse: [
            /sql.js$/
        ],
        loaders: [
            {
                test: /.jsx?$/,
                loader: 'babel-loader',
                include: __dirname + '/src',
                query: {
                    presets: ['es2015', 'stage-0', 'react']
                }
            },
            {test: /\.css$/, include: /css/, loader: 'style-loader!css-loader'},
            {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file'},
            {test: /\.(woff|woff2)$/, loader:'url?prefix=font/&limit=5000'},
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=10000&mimetype=application/octet-stream'
            },
            {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=image/svg+xml'}
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('development')
            }
        }),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}})
    ],
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx']
    },
    eslintConfig: {
        env: {
            browser: true
        }
    },
    scripts: {
        lint: 'eslint src'
    }
};
