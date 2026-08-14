const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadCurrentFrontendData(projectRoot) {
  const context = { window: {} };
  vm.createContext(context);
  ['workbook-source.js', 'source-standards.js', 'data.js'].forEach((file) => {
    const source = fs.readFileSync(path.join(projectRoot, 'frontend', file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  });
  return context.window.CogMockData;
}

module.exports = { loadCurrentFrontendData };
