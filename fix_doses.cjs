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

  // Pattern 1: replace fetchCollection(\`users/\${uidVar}/doses\`, [ ... ])
  const regex1 = /fetchCollection(?:<[^>]+>)?\(\s*\`users\/\$\{(user\.uid|userId|user\?\.uid|uid)\}\/doses\`\s*,\s*\[/g;
  content = content.replace(regex1, (match, uidVar) => {
    // Note: match looks like: fetchCollection<any>(`users/${user.uid}/doses`, [
    // We want to replace the `users/${...}/doses` with "dose_instances"
    // and insert where('userId', '==', uidVar),
    return match.replace(/`users\/\$\{.*?\}(\/profiles\/\$\{.*?\})?\/doses`/, '"dose_instances"').replace('[', `[where("userId", "==", ${uidVar}), `);
  });

  // Pattern 2: updateDocument(\`users/\${uidVar}/doses\`, ... )
  const regex2 = /updateDocument\(\s*\`users\/\$\{(user\.uid|userId|user\?\.uid|uid)\}\/doses\`\s*,/g;
  content = content.replace(regex2, (match, uidVar) => {
    // Note: updateDocument doesn't take constraints, so we just replace the collection path
    return match.replace(/`users\/\$\{.*?\}(\/profiles\/\$\{.*?\})?\/doses`/, '"dose_instances"');
  });

  // Pattern 3: deleteDocument(\`users/\${uidVar}/doses\`, ... )
  const regex3 = /deleteDocument\(\s*\`users\/\$\{(user\.uid|userId|user\?\.uid|uid)\}\/doses\`\s*,/g;
  content = content.replace(regex3, (match, uidVar) => {
    return match.replace(/`users\/\$\{.*?\}(\/profiles\/\$\{.*?\})?\/doses`/, '"dose_instances"');
  });

  // Pattern 4: addDocument(\`users/\${uidVar}/doses\`, ... )
  // Wait, addDocument needs careful handling because we must inject userId if it's not present in the inner object...
  // Usually addDocument looks like: addDocument(`users/${user.uid}/doses`, doseData)
  // Let's just fix the path. The caller might need to add userId to doseData. 
  const regex4 = /addDocument\(\s*\`users\/\$\{(user\.uid|userId|user\?\.uid|uid)\}\/doses\`\s*,/g;
  content = content.replace(regex4, (match, uidVar) => {
    return match.replace(/`users\/\$\{.*?\}(\/profiles\/\$\{.*?\})?\/doses`/, '"dose_instances"');
  });

  // Pattern 5: fetchDocument(\`users/\${uidVar}/doses\`, ... )
  const regex5 = /fetchDocument(?:<[^>]+>)?\(\s*\`users\/\$\{(user\.uid|userId|user\?\.uid|uid)\}\/doses\`\s*,/g;
  content = content.replace(regex5, (match, uidVar) => {
    return match.replace(/`users\/\$\{.*?\}(\/profiles\/\$\{.*?\})?\/doses`/, '"dose_instances"');
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
    c++;
  }
});

console.log('Modified', c, 'files');
