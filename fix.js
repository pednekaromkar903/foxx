const fs = require('fs');
const file = 'packages/database/seed.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\\\$\{/g, '${');
fs.writeFileSync(file, content);
console.log('Fixed seed.ts template literals');
