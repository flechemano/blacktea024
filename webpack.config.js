const path = require('path');

module.exports = {
  // Set the mode for development or production
  mode: 'development',

  // Define the entry point for your application
  entry: './src/index.js', // Assuming your main entry point is in src/index.js

  // Define the output directory and filename for the bundled code
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'), // Path to your output directory
  },

  // Define loaders to handle different file types
  module: {
    rules: [
      {
        test: /\.js$/, // Target all JavaScript files
        exclude: /node_modules/, // Exclude node_modules folder
        use: {
          loader: 'babel-loader', // Use Babel loader for JavaScript transpilation (if needed)
          options: {
            // Add your Babel presets and plugins here (optional)
          }
        }
      },
      {
        test: /\.css$/, // Target all CSS files (optional)
        use: ['style-loader', 'css-loader'] // Use style-loader and css-loader for CSS processing
      }
      // You can add loaders for other file types like images, fonts, etc.
    ]
  }
};

