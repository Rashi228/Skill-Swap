const tailwindcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    {
      // Only run Tailwind on your own CSS files, not node_modules
      postcssPlugin: 'internal-tailwindcss-filter',
      Once(root, { result }) {
        if (
          result.opts.from &&
          /node_modules/.test(result.opts.from)
        ) {
          // Remove Tailwind from the plugin list for node_modules
          result.processor.plugins = result.processor.plugins.filter(
            (plugin) => plugin.postcssPlugin !== 'tailwindcss'
          );
        }
      },
    },
    tailwindcss(),
    autoprefixer(),
  ],
}; 