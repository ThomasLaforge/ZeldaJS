const loaders = require('./loaders');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const StringReplacePlugin = require('string-replace-webpack-plugin');
const webpack = require('webpack');

// Loaders specific to compiling
loaders.push({
    test: /\.tsx?$/,
    enforce: 'pre',
    loader: 'tslint-loader',
    exclude: /node_modules/,
    options: {
        typeCheck: true
    }
});

module.exports = [
    {
        entry: {
            //app: path.resolve('./src/app/zelda.ts'),
            // TODO: Figure out how to split editor's node_module stuff into a separate chunk
            editor: [ path.resolve('./src/app/zelda/editor/editor-main.ts'),
                // // TODO: Figure out a way to pull in these dependencies without referencing the entire libs!
                // path.resolve('./node_modules/angular-ui-bootstrap/index.js'),
                // path.resolve('./node_modules/angular-sanitize/index.js')
            ]
        },
        output: {
            path: path.resolve('./build/web/'),
            filename: '[name].js',
            //publicPath: 'build/web/'
        },
        resolve: {
            extensions: ['.js', '.ts', '.tsx'],
            modules: ['src/app', 'src/html', 'src/css', 'node_modules']
        },
        module: {
            loaders: loaders
        },
        plugins: [
//            new webpack.optimize.CommonsChunkPlugin({ names: [ 'editorVendor', 'manifest' ] }),
            // Simply copies the files over
            new CopyWebpackPlugin([
                { from: 'src/res', to: 'res' },
                { from: 'src/img', to: 'img' },
                { from: '**/*.html', context: 'src/app' }
, { from: '*.html', context: 'src/html' }
            ]),
            new StringReplacePlugin(),
            new webpack.ProvidePlugin({
                'window.$': 'jquery',
                'window.jQuery': 'jquery',
                $: 'jquery',
                jQuery: 'jquery'
            })
        ],
        // Create Sourcemaps for the bundle
        devtool: 'source-map',
        devServer: {
            contentBase: './build/web'
        }
    }
];
