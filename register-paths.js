const tsConfigPaths = require('tsconfig-paths');
const tsConfig = require('./tsconfig.json');
const path = require('path');

tsConfigPaths.register({
  baseUrl: path.join(__dirname, 'dist'),
  paths: tsConfig.compilerOptions.paths,
});
