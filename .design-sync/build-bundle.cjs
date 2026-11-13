// Builds components/bundle.js for the design-system artifact from components/src/<group>/<Name>.jsx.
// Same bundle format as the artifact expects (classic script, `/* @ds-bundle: {...} */` header,
// assigns window.<namespace>). Uses the Babel that ships with Next.js — no extra install.
//
// usage: node .design-sync/build-bundle.cjs [projectDir] [namespace]
//   projectDir defaults to .design-sync/artifact/project, namespace to DesignSystem_307f43
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO = path.resolve(__dirname, '..');
const NEXT_BABEL = path.join(REPO, 'node_modules/next/dist/compiled/babel');
const babel = require(path.join(NEXT_BABEL, 'core'));
const presetReact = require(path.join(NEXT_BABEL, 'preset-react'));

const root = path.resolve(process.argv[2] || path.join(__dirname, 'artifact/project'));
const namespace = process.argv[3] || 'DesignSystem_307f43';
const srcDir = path.join(root, 'components/src');
const out = path.join(root, 'components/bundle.js');

// collect components/src/<group>/<Name>.jsx
const files = [];
for (const group of fs.readdirSync(srcDir).sort()) {
  const gdir = path.join(srcDir, group);
  if (!fs.statSync(gdir).isDirectory()) continue;
  for (const f of fs.readdirSync(gdir).sort()) if (f.endsWith('.jsx')) files.push(`components/src/${group}/${f}`);
}

// imports (`import { A } from './X.jsx'`) and exports (`export function|const Name`)
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

// dependencies first
const order = [];
const seen = new Set();
function visit(rel, stack = []) {
  if (seen.has(rel)) return;
  if (stack.includes(rel)) throw new Error('import cycle: ' + [...stack, rel].join(' -> '));
  for (const d of info[rel].deps) {
    if (!info[d.target]) throw new Error(`${rel}: missing import ${d.target}`);
    visit(d.target, [...stack, rel]);
  }
  seen.add(rel);
  order.push(rel);
}
files.forEach((f) => visit(f));

// header lists only real components: exports that have a components/<Name>/ folder with a README
const isComponent = (name) => fs.existsSync(path.join(root, 'components', name, 'README.md'));
// display order on the Components page = header order; taken from config.json `componentOrder` when present
const cfgPath = path.join(__dirname, 'config.json');
const ORDER = fs.existsSync(cfgPath) ? (JSON.parse(fs.readFileSync(cfgPath, 'utf8')).componentOrder || []) : [];
const rank = (n) => (ORDER.includes(n) ? ORDER.indexOf(n) : ORDER.length);
const components = [];
const sourceHashes = {};
let body = `(() => {\n\nconst __ds_ns = (window.${namespace} = window.${namespace} || {});\n\nconst __ds_scope = {};\n\n(__ds_ns.__errors = __ds_ns.__errors || []);\n\n`;
const allExports = [];

for (const rel of order) {
  const { src, deps, exports } = info[rel];
  sourceHashes[rel] = crypto.createHash('sha256').update(src).digest('hex').slice(0, 12);
  const code = src
    .replace(/^import\s+React\s+from\s+'react';?\s*\n/m, '')
    .replace(/^import\s+\{[^}]+\}\s+from\s+'\.[^']+';?\s*\n/gm, '')
    .replace(/^export\s+(function|const)\s/gm, '$1 ');
  const compiled = babel.transformSync(code, {
    babelrc: false, configFile: false, presets: [[presetReact, { runtime: 'classic' }]],
  }).code;
  const imports = deps.map((d) => `const { ${d.names.join(', ')} } = __ds_scope;\n`).join('');
  body += `// ${rel}\ntry { (() => {\n${imports}${compiled}\nObject.assign(__ds_scope, { ${exports.join(', ')} });\n})(); } catch (e) { __ds_ns.__errors.push({ path: ${JSON.stringify(rel)}, error: String((e && e.message) || e) }); }\n\n`;
  for (const name of exports) {
    allExports.push(name);
    if (isComponent(name)) components.push({ name, sourcePath: rel });
  }
}
for (const name of allExports) body += `__ds_ns.${name} = __ds_scope.${name};\n\n`;
body += '})();\n';

components.sort((x, y) => rank(x.name) - rank(y.name));
const header = { format: 4, namespace, components, sourceHashes, inlinedExternals: [], unexposedExports: [] };
const text = `/* @ds-bundle: ${JSON.stringify(header).replace(/\*\//g, '*\\/')} */\n\n` + body;
if (/<\/script|<!--/i.test(text)) throw new Error('bundle contains </script or <!-- (breaks inline use)');
fs.writeFileSync(out, text);
console.log(`built ${order.length} files → ${path.relative(REPO, out)} (${components.length} components, ${allExports.length} exports)`);
