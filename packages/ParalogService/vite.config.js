const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'index.js'),
      name: 'paralogservice',
      fileName: (format) => `paralogservice.${format}.js`
    }
  }
});
