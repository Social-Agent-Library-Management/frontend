// Builds _ds_bundle.js (format 4, same shape as the existing project bundle)
// from components/<group>/<Name>.jsx inside the given root dir.
// usage: node build-bundle.cjs <root> <namespace> <out>
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const NEXT = '/Users/chanyoung/Desktop/Code/Library/frontend/node_modules/next/dist/compiled/babel';
const babel = require(NEXT + '/core');
const presetReact = require(NEXT + '/preset-react');

const [root, namespace, out] = process.argv.slice(2);
const compDir = path.join(root, 'components');

// collect files
const files = [];
for (const group of fs.readdirSync(compDir).sort()) {
  const gdir = path.join(compDir, group);
  if (!fs.statSync(gdir).isDirectory()) continue;
  for (const f of fs.readdirSync(gdir).sort()) if (f.endsWith('.jsx')) files.push(`components/${group}/${f}`);
}

// parse imports/exports
const info = {};
for (const rel of files) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  const deps = [];
  const importRe = /^import\s+\{([^}]+)\}\s+from\s+'(\.[^']+)';?\s*$/gm;
  let m;
  while ((m = importRe.exec(src))) {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[2]));
    deps.push({ names: m[1].split(',').map((s) => s.trim()).filter(Boolean), target });
  }
  const exports = [...src.matchAll(/^export\s+(?:function|const)\s+([A-Za-z_$][\w$]*)/gm)].map((x) => x[1]);
  info[rel] = { src, deps, exports };
}

// topological order (deps first), stable by original group order
const order = [];
const seen = new Set();
function visit(rel, stack = []) {
  if (seen.has(rel)) return;
  if (stack.includes(rel)) throw new Error('cycle: ' + [...stack, rel].join(' -> '));
  for (const d of info[rel].deps) {
    if (!info[d.target]) throw new Error(`${rel}: missing import ${d.target}`);
    visit(d.target, [...stack, rel]);
  }
  seen.add(rel);
  order.push(rel);
}
files.forEach((f) => visit(f));

const components = [];
const sourceHashes = {};
let body = `(() => {\n\nconst __ds_ns = (window.${namespace} = window.${namespace} || {});\n\nconst __ds_scope = {};\n\n(__ds_ns.__errors = __ds_ns.__errors || []);\n\n`;

for (const rel of order) {
  const { src, deps, exports } = info[rel];
  sourceHashes[rel] = crypto.createHash('sha256').update(src).digest('hex').slice(0, 12);
  let code = src
    .replace(/^import\s+React\s+from\s+'react';?\s*\n/m, '')
    .replace(/^import\s+\{[^}]+\}\s+from\s+'\.[^']+';?\s*\n/gm, '')
    .replace(/^export\s+(function|const)\s/gm, '$1 ');
  const out = babel.transformSync(code, {
    babelrc: false, configFile: false, compact: false, retainLines: false,
    presets: [[presetReact, { runtime: 'classic' }]],
  }).code;
  const imports = deps.map((d) => `const { ${d.names.join(', ')} } = __ds_scope;\n`).join('');
  body += `// ${rel}\ntry { (() => {\n${imports}${out}\nObject.assign(__ds_scope, { ${exports.join(', ')} });\n})(); } catch (e) { __ds_ns.__errors.push({ path: ${JSON.stringify(rel)}, error: String((e && e.message) || e) }); }\n\n`;
  for (const name of exports) components.push({ name, sourcePath: rel });
}
for (const c of components) body += `__ds_ns.${c.name} = __ds_scope.${c.name};\n\n`;
body += '})();\n';

const header = { format: 4, namespace, components, sourceHashes, inlinedExternals: [], unexposedExports: [] };
fs.writeFileSync(out, `/* @ds-bundle: ${JSON.stringify(header).replace(/\*\//g, '*\\/')} */\n\n` + body);
console.log(`built ${order.length} files, ${components.length} exports -> ${out}`);
console.log('order:', order.join(', '));
