import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

export default {
    mode: 'production',
    entry: {
        background: './src/background.js',
        options: './src/options.js',
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/options.html',
            filename: 'options.html',
            chunks: ['options'],
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: './src/manifest.json' }],
        }),
    ],
    devtool: 'source-map',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../dist'),
        clean: true,
    },
};
