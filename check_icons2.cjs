const p = require('./node_modules/@phosphor-icons/react/dist/index.cjs.js');
const fs = require('fs');
const keys = Object.keys(p);
const logos = keys.filter(k => /Logo/.test(k));
const social = keys.filter(k => /[Tt]witter|[Ff]acebook|[Ii]nstagram|[Ll]inkedin|[Ww]hatsapp/.test(k));
const result = {
  total: keys.length,
  logos: logos,
  social: social
};
fs.writeFileSync('C:\\Antigravity\\horamed\\horamed\\icon_result.json', JSON.stringify(result, null, 2));
process.exit(0);
