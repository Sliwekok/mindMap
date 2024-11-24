import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import * as path from "path";

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: {
    main: './src/index.ts',
    preload: './src/preload.ts',
  },
  output: {
    path: path.resolve(__dirname, '.webpack/main'),
    filename: '[name].js',  // This will generate 'main.js' and 'preload.js'
  },
  target: 'electron-preload',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json', '.ico'],
  },
};
