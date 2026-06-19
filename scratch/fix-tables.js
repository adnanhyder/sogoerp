const fs = require('fs');
const files = [
  'app/_components/installed-devices-table.tsx',
  'app/_components/paid-commissions-table.tsx',
  'app/_components/technician-record-actions.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<th className="/g, '<th className="whitespace-nowrap ');
  content = content.replace(/<td className="/g, '<td className="whitespace-nowrap ');
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}
