const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) throw new Error('NODE_ENV not defined');
if (NODE_ENV !== 'production' && NODE_ENV !== 'development')
  throw new Error('NODE_ENV invalid: "production" or "development" only');

const production = NODE_ENV === 'production';

module.exports = {
  mode: NODE_ENV,
  entry: [
    './src/index.ts'
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    symlinks: false,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          { 
            loader: 'babel-loader',
          }
        ]
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          { 
            loader: 'babel-loader',
          },
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
    }),
    new MiniCssExtractPlugin(),
 ],
  
  devServer: production ? undefined : {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    host: '127.0.0.1',
    port: 9001,
    open: false,
    // noInfo: true,
    // serve index.html in place of 404 responses to allow HTML5 history
    historyApiFallback: true,
    disableHostCheck: true
  },
  devtool: production ? undefined : 'source-map'
};
