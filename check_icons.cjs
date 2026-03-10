const p = require('./node_modules/@phosphor-icons/react/dist/index.cjs.js');
const keys = Object.keys(p);
const logos = keys.filter(k => /Logo$|Twitter|Facebook/.test(k));
const fs = require('fs');
fs.writeFileSync('icon_check_result.txt', 'Total: ' + keys.length + '\nLogos: ' + logos.join(', ') + '\n');
