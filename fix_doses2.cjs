const fs = require('fs');
const path = require('path');

function walk(dir, call) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const p = path.resolve(dir, file);
    const stat = fs.statSync(p);
    if (stat && stat.isDirectory()) {
      walk(p, call);
    } else {
      call(p);
    }
  }
}

let c = 0;
walk(path.resolve('./src'), (file) => {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Pattern: any string template \`users/${uidVar}/doses\`
  // or \`users/${userId}/profiles/${profileId}/doses\`
  const regexLiteral = /`users\/\$\{.*?\}(?:\/profiles\/\$\{.*?\})?\/doses`/g;
  
  content = content.replace(regexLiteral, (match) => {
    return '"dose_instances"';
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
    c++;
  }
});

console.log('Modified', c, 'files');
