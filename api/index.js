// @ts-nocheck
const bundle = require('./_bundle.cjs');
module.exports = typeof bundle?.default === 'function' ? bundle.default : bundle;
