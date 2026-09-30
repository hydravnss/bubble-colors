// Test Node (sans SillyTavern) : node test/bubble-colors.test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-test-'));
const extDir = path.join(root, 'scripts/extensions/third-party/bubble-colors');
fs.mkdirSync(extDir, { recursive: true });
fs.copyFileSync(path.join(here, '../index.js'), path.join(extDir, 'index.js'));
fs.writeFileSync(path.join(root, 'script.js'), `
export const eventSource = { on: () => {} };
export const event_types = { CHAT_CHANGED: 'cc' };
export const saveSettingsDebounced = () => {};
`);
fs.writeFileSync(path.join(root, 'scripts/extensions.js'), `
export const extension_settings = globalThis.__settings;
export const getContext = () => globalThis.__ctx;
`);
globalThis.__settings = {};
globalThis.__ctx = { characters: [{ name: 'Alice', avatar: 'alice.png' }, { name: 'Bob "B"', avatar: 'bob.png' }], groupId: 'g1', groups: [{ id: 'g1', members: ['alice.png', 'bob.png'] }] };

const { __test: t } = await import(pathToFileURL(path.join(extDir, 'index.js')).href);

// hex -> rgba
assert.equal(t.normalizeHex('#ABC'), '#aabbcc');
assert.equal(t.normalizeHex('0a84ff'), '#0a84ff');
assert.equal(t.normalizeHex('zzz'), null);
assert.equal(t.normalizeHex(null), null);
assert.equal(t.hexToRgba('#0a84ff', 100), 'rgba(10, 132, 255, 1)');
assert.equal(t.hexToRgba('#000000', 50), 'rgba(0, 0, 0, 0.5)');
assert.equal(t.hexToRgba('#ffffff', 0), 'rgba(255, 255, 255, 0)');
assert.equal(t.hexToRgba('#ffffff', 33), 'rgba(255, 255, 255, 0.33)');
assert.equal(t.hexToRgba('nope', 100, '#ff0000'), 'rgba(255, 0, 0, 1)');
assert.equal(t.hexToRgba('#fff', 500), 'rgba(255, 255, 255, 1)');
assert.equal(t.cssAttr('a"b\\c'), 'a\\"b\\\\c');

// defaults merge
globalThis.__settings['bubble-colors'] = { userBg: '#123456', radius: 999, botBg: 'nope!' };
const s = t.getSettings();
assert.equal(s.userBg, '#123456'); assert.equal(s.radius, 40); assert.equal(s.botBg, '#3a3a3c');
assert.equal(s.enabled, true); assert.deepEqual(s.characters, {});

// CSS
const base = { ...t.defaultSettings, characters: {} };
let css = t.buildCss(base);
assert.ok(t.braceBalance(css), 'braces');
assert.ok(css.includes('rgba(10, 132, 255, 1)'));
assert.ok(css.includes('border-radius: var(--bc-radius)'));
assert.ok(css.includes('.mes:not([is_system="true"])'));
assert.ok(!/\.mes\[is_system="true"\][^)]*\{/.test(css.replace(/:not\(\[is_system="true"\]\)/g, '')));
for (const line of css.split('\n')) if (/^\s+[a-z-]+:/.test(line)) assert.ok(line.includes('!important'), line);
assert.ok(!css.includes('.mes_text em'));
// chaque déclaration a !important, peinture unique
assert.ok(/\.mes_block \{\n  background-color: var\(--bc-bg\)/.test(css));
assert.ok(/\.mes:not\(\[is_system="true"\]\) \.mes \{|\.mes \{\n  background-color: transparent/.test(css) || css.includes('.mes {\n  background-color: transparent'));
let css2 = t.buildCss({ ...base, paintTarget: 'mes' });
assert.ok(t.braceBalance(css2));
assert.ok(css2.includes('.mes {\n  background-color: var(--bc-bg)'));
assert.ok(css2.includes('.mes_block {\n  background-color: transparent'));
// extras + perso
let css3 = t.buildCss({ ...base, emEnabled: true, strongEnabled: true, quoteEnabled: true, userOpacity: 50,
  characters: { 'bob.png': { name: 'Bob "B"', avatar: 'bob.png', bg: '#ff0000', fg: null }, x: { bg: null, fg: null } } });
assert.ok(t.braceBalance(css3));
assert.ok(css3.includes('.mes_text em') && css3.includes('.mes_text strong') && css3.includes('.mes_text q'));
assert.ok(css3.includes('rgba(10, 132, 255, 0.5)'));
assert.ok(css3.includes('[ch_name="Bob \\"B\\""]') && css3.includes('[data-avatar="bob.png"]'));
assert.ok(css3.includes('rgba(255, 0, 0, 1)'));
// injection impossible via valeurs
let css4 = t.buildCss({ ...base, userBg: '#fff;}body{display:none', characters: { a: { name: 'x"]{}', bg: '#00ff00' } } });
assert.ok(t.braceBalance(css4)); assert.ok(!css4.includes('display:none'));
// présets
for (const [id, p] of Object.entries(t.PRESETS)) {
  const c = t.buildCss({ ...base, ...p });
  assert.ok(t.braceBalance(c), id);
}
// personnages du groupe
assert.deepEqual(t.getChatCharacters().map(c => c.key), ['alice.png', 'bob.png']);
globalThis.__ctx = { characters: [{ name: 'Solo', avatar: 's.png' }], characterId: 0 };
assert.deepEqual(t.getChatCharacters().map(c => c.name), ['Solo']);
console.log('OK - tous les tests passent');
