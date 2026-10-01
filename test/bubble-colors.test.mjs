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

// luminance / contraste
assert.equal(t.relLuminance('#000000'), 0);
assert.ok(Math.abs(t.relLuminance('#ffffff') - 1) < 1e-9);
assert.equal(t.contrastText(['#0a84ff', '#a334fa']), '#ffffff');
assert.equal(t.contrastText(['#ffffff', '#f5f7fa']), '#111111');
assert.equal(t.contrastText(['#fff3a8', '#ffc2e2', '#a6d4ff']), '#111111');
assert.equal(t.contrastText(['#0b0f3b', '#2c3e91']), '#ffffff');
assert.equal(t.contrastText([]), '#ffffff');
assert.equal(t.contrastText(['#ffd700', '#fff1a8']), '#111111');

// génération de dégradés
assert.equal(t.buildGradientCss({ type: 'linear', angle: 90, stops: ['#ff0000', '#0000ff'] }),
  'linear-gradient(90deg, rgba(255, 0, 0, 1), rgba(0, 0, 255, 1))');
assert.equal(t.buildGradientCss({ type: 'linear', angle: 90, stops: ['#ff0000', '#0000ff'] }, 50, true),
  'linear-gradient(90deg, rgba(0, 0, 255, 0.5), rgba(255, 0, 0, 0.5))');
assert.ok(t.buildGradientCss({ type: 'radial', at: '30% 25%', stops: ['#fff', '#000'] }).startsWith('radial-gradient(circle at 30% 25%,'));
assert.ok(t.buildGradientCss({ type: 'radial', at: 'red);}body{', stops: ['#fff', '#000'] }).includes('circle at 50% 50%'));
assert.ok(/^conic-gradient\(from 0deg at 50% 50%, .*rgba\(255, 59, 48, 1\)\)$/.test(t.buildGradientCss(t.GRADIENT_PRESETS['arc-en-ciel'])));
assert.equal(t.buildGradientCss({ type: 'linear', angle: 999, stops: ['#fff'] }), 'linear-gradient(360deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 1))');
assert.equal(Object.keys(t.GRADIENT_PRESETS).length, 24);
for (const [id, g] of Object.entries(t.GRADIENT_PRESETS)) {
  assert.ok(g.label && g.stops.length >= 2 && g.stops.every(c => t.normalizeHex(c) === c), id);
  assert.ok(/-gradient\(/.test(t.buildGradientCss(g)), id);
}
assert.deepEqual(t.customToGradient({ type: 'x', angle: 10, c1: '#111', c2: '#222', c3: '#333', useC3: false }), { type: 'linear', angle: 10, stops: ['#111111', '#222222'] });
assert.equal(t.customToGradient({ type: 'conic', angle: 10, c1: '#111', c2: '#222', c3: '#333', useC3: true }).stops.length, 3);

// tranche continue
assert.deepEqual(t.computeSlice({ left: 30, top: 250.4 }, { left: 10, top: 100 }, 390.2, 700), { x: 20, y: 150, w: 390, h: 700 });

// defaults merge + migration depuis 1.x
globalThis.__settings['bubble-colors'] = { userBg: '#123456', radius: 999, botBg: 'nope!' };
let s = t.getSettings();
assert.equal(s.userBg, '#123456'); assert.equal(s.radius, 40); assert.equal(s.botBg, '#3a3a3c');
assert.equal(s.enabled, true); assert.deepEqual(s.characters, {});
assert.equal(s.paintTarget, 'mes_text'); assert.equal(s.userBgType, 'solid'); assert.equal(s.schema, 2);
globalThis.__settings['bubble-colors'] = { paintTarget: 'mes_block', radius: 18, characters: { 'a.png': { name: 'A', bg: '#ff0000', fg: null } } };
s = t.getSettings();
assert.equal(s.paintTarget, 'mes_text'); assert.equal(s.radius, 19); assert.equal(s.characters['a.png'].bg, '#ff0000');
// choix 2.x conservés
globalThis.__settings['bubble-colors'] = { schema: 2, paintTarget: 'mes_block', radius: 18, userBgType: 'gradient', userGrad: 'inconnu' };
s = t.getSettings();
assert.equal(s.paintTarget, 'mes_block'); assert.equal(s.radius, 18); assert.equal(s.userBgType, 'gradient'); assert.equal(s.userGrad, 'bleu-violet');

// CSS uni (défaut)
const base = { ...t.defaultSettings, characters: {} };
let css = t.buildCss(base);
assert.ok(t.braceBalance(css), 'braces');
assert.ok(css.includes('rgba(10, 132, 255, 1)'));
assert.ok(css.includes('border-radius: var(--bc-radius)'));
assert.ok(css.includes('.mes:not([is_system="true"])'));
assert.ok(/html body #chat \.mes:not\(\[is_system="true"\]\)\[is_user="true"\] \.mes_text \{/.test(css), 'cible .mes_text par défaut');
assert.ok(/\.mes_block,\nhtml body #chat \.mes:not\(\[is_system="true"\]\) \.mes \{\n  background-color: transparent/.test(css), 'block et mes transparents');
for (const line of css.split('\n')) if (/^\s+[a-z-]+:/.test(line)) assert.ok(line.includes('!important'), line);
assert.ok(!css.includes('.mes_text em'));
assert.ok(!css.includes('linear-gradient'));
let css2 = t.buildCss({ ...base, paintTarget: 'mes' });
assert.ok(t.braceBalance(css2));
assert.ok(/\[is_user="true"\] \.mes \{/.test(css2));
assert.ok(css2.includes('.mes_text,\nhtml body #chat .mes:not([is_system="true"]) .mes_block {\n  background-color: transparent'));

// CSS dégradé : bulle .mes_text, background-image, auto-contraste, em/strong suivent le texte
const g = { ...base, userBgType: 'gradient', userGrad: 'bleu-violet', botBgType: 'gradient', botGrad: 'pastel' };
let cg = t.buildCss(g);
assert.ok(t.braceBalance(cg));
assert.ok(/\[is_user="true"\] \.mes_text \{[^}]*background-image: linear-gradient\(135deg, rgba\(10, 132, 255, 1\), rgba\(163, 52, 250, 1\)\) !important;/.test(cg));
assert.ok(/:not\(\[is_user="true"\]\) \.mes_text \{[^}]*background-color: transparent !important/.test(cg));
assert.ok(cg.includes('--bc-fg: #ffffff !important') && cg.includes('--bc-fg: #111111 !important'));
assert.ok(/:not\(\[is_user="true"\]\) \.mes_text em,\nhtml body #chat \.mes:not\(\[is_system="true"\]\):not\(\[is_user="true"\]\) \.mes_text i \{\n  color: rgba\(17, 17, 17, 0\.85\) !important/.test(cg), 'em lisible sur pastel');
// texte manuel si auto désactivé
let cm = t.buildCss({ ...g, userAutoFg: false, userFg: '#ffee00' });
assert.ok(cm.includes('--bc-fg: #ffee00 !important'));
// continu / brillance / lueur / bordure
let cf = t.buildCss({ ...g, continuous: true, gloss: true, glow: true, gradBorder: true });
assert.ok(t.braceBalance(cf));
assert.ok(cf.includes('background-size: 100% 100%, var(--bc-w, 100%) var(--bc-h, 100%), var(--bc-w, 100%) var(--bc-h, 100%) !important'));
assert.ok(cf.includes('calc(var(--bc-x, 0px) * -1) calc(var(--bc-y, 0px) * -1)'));
assert.ok(cf.includes('box-shadow: 0 3px 16px -3px rgba(10, 132, 255, 0.6) !important'));
assert.ok(cf.includes('border: 2px solid transparent !important') && cf.includes('background-clip: padding-box, padding-box, border-box'));
assert.ok(!cf.includes('background-attachment: fixed'));
assert.ok(!/::before|::after/.test(cf));
let cn = t.buildCss(g);
assert.ok(!cn.includes('--bc-w') && !cn.includes('border: 2px') && !cn.includes('box-shadow: 0 3px'));
// needsSlices
assert.equal(t.needsSlices({ ...g, continuous: true }), true);
assert.equal(t.needsSlices({ ...g, continuous: false }), false);
assert.equal(t.needsSlices({ ...base, continuous: true }), false);
assert.equal(t.needsSlices({ ...g, continuous: true, enabled: false }), false);

// extras uni + perso
let css3 = t.buildCss({ ...base, emEnabled: true, strongEnabled: true, quoteEnabled: true, userOpacity: 50,
  characters: { 'bob.png': { name: 'Bob "B"', avatar: 'bob.png', bg: '#ff0000', fg: null }, x: { bg: null, fg: null } } });
assert.ok(t.braceBalance(css3));
assert.ok(css3.includes('.mes_text em') && css3.includes('.mes_text strong') && css3.includes('.mes_text q'));
assert.ok(css3.includes('rgba(10, 132, 255, 0.5)'));
assert.ok(css3.includes('[ch_name="Bob \\"B\\""]') && css3.includes('[data-avatar="bob.png"]'));
assert.ok(css3.includes('rgba(255, 0, 0, 1)'));
// perso avec dégradé
let cc = t.buildCss({ ...base, characters: { 'alice.png': { name: 'Alice', avatar: 'alice.png', bg: null, fg: null, grad: 'lave' }, z: { grad: 'nope' } } });
assert.ok(t.braceBalance(cc));
assert.ok(/\[ch_name="Alice"\] \.mes_text \{[^}]*linear-gradient\(160deg, rgba\(122, 0, 0, 1\)/.test(cc));
assert.ok(!cc.includes('nope'));
// injection impossible via valeurs
let css4 = t.buildCss({ ...base, userBg: '#fff;}body{display:none', characters: { a: { name: 'x"]{}', bg: '#00ff00' } },
  userBgType: 'gradient', userGrad: 'custom', userCustom: { type: 'linear', angle: 1, c1: 'red;}x{', c2: '#000', c3: '#000', useC3: true } });
assert.ok(t.braceBalance(css4)); assert.ok(!css4.includes('display:none')); assert.ok(!css4.includes('x{'));
// présets
for (const [id, p] of Object.entries(t.PRESETS)) {
  const c = t.buildCss({ ...base, ...p });
  assert.ok(t.braceBalance(c), id);
}
for (const id of Object.keys(t.GRADIENT_PRESETS)) {
  assert.ok(t.braceBalance(t.buildCss({ ...g, userGrad: id, botGrad: id, continuous: true, gloss: true })), id);
}
// personnages du groupe
assert.deepEqual(t.getChatCharacters().map(c => c.key), ['alice.png', 'bob.png']);
globalThis.__ctx = { characters: [{ name: 'Solo', avatar: 's.png' }], characterId: 0 };
assert.deepEqual(t.getChatCharacters().map(c => c.name), ['Solo']);
console.log('OK - tous les tests passent');
// référence stable de userCustom (l'UI la mute)
{
  globalThis.__settings['bubble-colors'] = {};
  const a = t.getSettings(); const ref = a.userCustom; ref.angle = 45; ref.c1 = '#ff0000';
  const b = t.getSettings();
  assert.equal(b.userCustom, ref); assert.equal(b.userCustom.angle, 45);
  b.userGrad = 'custom'; b.userBgType = 'gradient';
  assert.ok(t.buildCss(b).includes('linear-gradient(45deg, rgba(255, 0, 0, 1)'));
}
console.log('OK - référence stable');
