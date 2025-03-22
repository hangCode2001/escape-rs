const { escapeTextForBrowser:escapeHtml } = require('./index.node');

function escapeTextForBrowser(text) {
  if (
    typeof text === 'boolean' ||
    typeof text === 'number' ||
    typeof text === 'bigint'
  ) {
    // this shortcircuit helps perf for types that we know will never have
    // special characters, especially given that this function is used often
    // for numeric dom ids.
    return '' + text;
  }
  return escapeHtml(text);
}

module.exports = {
  escapeTextForBrowser
};