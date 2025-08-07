const fs = require('fs');
const { createHash } = require('crypto');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) acc[m[1]] = m[2];
  return acc;
}, {});
const emailHash = createHash('sha256').update(env.EMAIL || '').digest('hex');
const passwordHash = createHash('sha256').update(env.PASSWORD || '').digest('hex');
const content = `window.CREDENTIALS = { email: '${emailHash}', password: '${passwordHash}' };\n`;
fs.writeFileSync('credentials.js', content);
console.log('credentials.js updated');
