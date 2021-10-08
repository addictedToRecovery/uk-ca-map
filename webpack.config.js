const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: [
    './src/index.ts'
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    publicPath: 'auto',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    symlinks: false,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          { 
            loader: 'file-loader',
          }
        ]
      },
      {
        test: /\.(geo)?json$/i,
        use: [
          { 
            loader: 'json-loader',
          }
        ]
      },
      {
        test: /\.svg/,
        type: 'asset/source'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      googleApiKey: process.env.GOOGLE_API_KEY,
      mapboxApiKey: process.env.MAPBOX_API_KEY,
    }),
    new MiniCssExtractPlugin(),
  ],
  devServer: {
    compress: true,
    host: '127.0.0.1',
    port: 9001,
    open: false,
    historyApiFallback: true,
  },
  devtool: 'source-map'
};
