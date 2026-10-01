/**
 * Bubble Colors 2.0.0 - extension SillyTavern
 * Personnalise les couleurs des bulles de chat (utilisateur / bots / personnages de groupe),
 * avec fonds unis ou DÉGRADÉS façon thèmes Messenger, effets (brillance, lueur, bordure),
 * l'opacité, l'arrondi et les couleurs de l'italique / gras / citations.
 *
 * Les règles sont injectées dans <style id="bubble-colors-style"> (toujours en dernier dans <head>)
 * avec !important et des sélecteurs très spécifiques pour l'emporter sur un thème CSS personnalisé.
 * Par défaut le fond est peint sur `.mes_text` (la vraie bulle dans « iMessage Dark » et la plupart des thèmes).
 *
 * Vanilla ES module, aucune étape de build.
 * Chemin attendu : /scripts/extensions/third-party/bubble-colors/index.js
 */

// Import en namespace : si un export manque dans une version de ST, l'extension ne plante pas au chargement.
import * as stScript from '../../../../script.js';
import * as stExtensions from '../../../extensions.js';

const MODULE_NAME = 'bubble-colors';
const LOG = '[Bubble Colors]';
const STYLE_ID = 'bubble-colors-style';
const SCHEMA = 2;

// ---------------------------------------------------------------------------
// Dégradés prédéfinis (stockés par id dans les réglages)
// type : linear | radial | conic ; angle en degrés (linear / conic) ; at : centre du radial
// ---------------------------------------------------------------------------
const GRADIENT_PRESETS = Object.freeze({
    'bleu-violet': { label: 'Bleu → Violet', type: 'linear', angle: 135, stops: ['#0a84ff', '#a334fa'] },
    'rose-orange': { label: 'Rose → Orange', type: 'linear', angle: 135, stops: ['#ff4fa3', '#ff9a3c'] },
    'cyan-bleu-royal': { label: 'Cyan → Bleu royal', type: 'linear', angle: 135, stops: ['#00d2ff', '#3a47d5'] },
    'pastel': { label: 'Pastel (bleu clair / rose / jaune)', type: 'linear', angle: 135, stops: ['#a6d4ff', '#ffc2e2', '#fff3a8'] },
    'violet-rose': { label: 'Violet → Rose', type: 'linear', angle: 135, stops: ['#6a11cb', '#ff4fa3'] },
    'vert-turquoise': { label: 'Vert → Turquoise', type: 'linear', angle: 135, stops: ['#3ddc84', '#00bfa5'] },
    'rouge-orange': { label: 'Rouge → Orange', type: 'linear', angle: 135, stops: ['#ff2d55', '#ff9500'] },
    'coucher-soleil': { label: 'Coucher de soleil', type: 'linear', angle: 135, stops: ['#ff9a44', '#fc4a7a', '#7b4fd6'] },
    'ocean': { label: 'Océan', type: 'linear', angle: 160, stops: ['#36d1dc', '#5b86e5'] },
    'aurore': { label: 'Aurore', type: 'linear', angle: 160, stops: ['#00c9a7', '#845ec2', '#ff6f91'] },
    'bonbon': { label: 'Bonbon', type: 'linear', angle: 135, stops: ['#ff6fb5', '#6fd3ff'] },
    'minuit': { label: 'Minuit', type: 'linear', angle: 160, stops: ['#0b0f3b', '#2c3e91'] },
    'lavande': { label: 'Lavande', type: 'linear', angle: 135, stops: ['#b79cff', '#e8d5ff'] },
    'menthe': { label: 'Menthe', type: 'linear', angle: 135, stops: ['#a8ff78', '#78ffd6'] },
    'peche': { label: 'Pêche', type: 'linear', angle: 135, stops: ['#ffcba4', '#ff8a8a'] },
    'messenger-classique': { label: 'Messenger classique (vertical)', type: 'linear', angle: 180, stops: ['#0084ff', '#a334fa', '#ff6968'] },
    'arc-en-ciel': { label: 'Arc-en-ciel (conique)', type: 'conic', angle: 0, stops: ['#ff3b30', '#ffcc00', '#34c759', '#00c7ff', '#5856d6', '#ff2d95'] },
    'cible': { label: 'Cible (radial rouge → orange → jaune → vert)', type: 'radial', at: '50% 50%', stops: ['#ff3b30', '#ff9500', '#ffd60a', '#34c759'] },
    'rose-magenta': { label: 'Rose → Magenta (radial)', type: 'radial', at: '30% 25%', stops: ['#ff9ad5', '#d100d1'] },
    'or': { label: 'Or', type: 'linear', angle: 135, stops: ['#b8860b', '#ffd700', '#fff1a8', '#d4a017'] },
    'argent': { label: 'Argent', type: 'linear', angle: 135, stops: ['#b8c0c8', '#f5f7fa', '#9aa5b1'] },
    'neon': { label: 'Néon', type: 'linear', angle: 135, stops: ['#ff2bd6', '#00f0ff'] },
    'lave': { label: 'Lave', type: 'linear', angle: 160, stops: ['#7a0000', '#ff2d00', '#ff9d00'] },
    'glace': { label: 'Glace', type: 'linear', angle: 135, stops: ['#e6f9ff', '#7ccbff'] },
});
const CUSTOM_ID = 'custom';
const GRADIENT_TYPES = ['linear', 'radial', 'conic'];

const defaultCustomUser = Object.freeze({ type: 'linear', angle: 135, c1: '#0a84ff', c2: '#a334fa', c3: '#ff6968', useC3: false });
const defaultCustomBot = Object.freeze({ type: 'linear', angle: 135, c1: '#3a3a3c', c2: '#6e6e73', c3: '#a0a0a8', useC3: false });

const defaultSettings = Object.freeze({
    schema: SCHEMA,
    enabled: true,
    // Élément qui reçoit le fond : 'mes_text' (défaut, la bulle réelle), 'mes_block' ou 'mes'. Les autres sont mis en transparent.
    paintTarget: 'mes_text',
    userBgType: 'solid', // 'solid' | 'gradient'
    userBg: '#0a84ff',
    userGrad: 'bleu-violet', // id de GRADIENT_PRESETS ou 'custom'
    userCustom: defaultCustomUser,
    userFg: '#ffffff',
    userAutoFg: true, // texte noir/blanc automatique sur dégradé
    userOpacity: 100,
    botBgType: 'solid',
    botBg: '#3a3a3c',
    botGrad: 'minuit',
    botCustom: defaultCustomBot,
    botFg: '#ffffff',
    botAutoFg: true,
    botOpacity: 100,
    radius: 19, // px, 0-40
    continuous: false, // dégradé continu sur l'écran (effet Messenger)
    gloss: false, // brillance
    glow: false, // ombre / lueur
    gradBorder: false, // bordure dégradée
    emEnabled: false, // *actions* (italique)
    emColor: '#b0b0b8',
    strongEnabled: false, // **dialogue** (gras)
    strongColor: '#ffffff',
    quoteEnabled: false, // "citations" (balise q)
    quoteColor: '#ffd60a',
    // { [clé avatar/nom]: { name, avatar, bg: '#rrggbb'|null, fg: '#rrggbb'|null, grad: id|null } }
    characters: {},
});

const PRESETS = Object.freeze({
    imessage: { label: 'iMessage bleu/gris', userBg: '#0a84ff', userFg: '#ffffff', botBg: '#3a3a3c', botFg: '#ffffff', radius: 19 },
    whatsapp: { label: 'Vert WhatsApp', userBg: '#005c4b', userFg: '#e9edef', botBg: '#202c33', botFg: '#e9edef', radius: 12 },
    violet: { label: 'Violet', userBg: '#7c3aed', userFg: '#ffffff', botBg: '#2e2a45', botFg: '#f3eefe', radius: 18 },
    rose: { label: 'Rose', userBg: '#ec4899', userFg: '#ffffff', botBg: '#3b2a33', botFg: '#ffeaf3', radius: 20 },
    rouge: { label: 'Mode sombre rouge', userBg: '#991b1b', userFg: '#f5f5f5', botBg: '#1c1c1e', botFg: '#f5f5f5', radius: 14, emEnabled: true, emColor: '#f87171' },
    messenger: { label: 'Messenger (dégradés)', userBgType: 'gradient', userGrad: 'messenger-classique', botBgType: 'solid', botBg: '#3a3a3c', botFg: '#ffffff', radius: 19, continuous: true },
});

// ---------------------------------------------------------------------------
// Fonctions pures (testées sous Node)
// ---------------------------------------------------------------------------

function clampNumber(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
}

/** Renvoie '#rrggbb' (minuscules) ou null si la valeur n'est pas une couleur hexadécimale valide. */
function normalizeHex(value) {
    if (typeof value !== 'string') return null;
    let h = value.trim().toLowerCase();
    if (h[0] === '#') h = h.slice(1);
    if (/^[0-9a-f]{3}$/.test(h)) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9a-f]{6}$/.test(h)) return null;
    return `#${h}`;
}

/** hex + opacité (0-100) -> 'rgba(r, g, b, a)'. Couleur invalide -> repli (ou noir). */
function hexToRgba(hex, opacity = 100, fallback = '#000000') {
    const h = normalizeHex(hex) || normalizeHex(fallback) || '#000000';
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    const a = Math.round(clampNumber(opacity, 100, 0, 100) * 10) / 1000;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Luminance relative WCAG (0 = noir, 1 = blanc) d'une couleur hex. */
function relLuminance(hex) {
    const h = normalizeHex(hex) || '#000000';
    const lin = (i) => {
        const v = parseInt(h.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(1) + 0.7152 * lin(3) + 0.0722 * lin(5);
}

/** Luminance moyenne d'une liste de couleurs. */
function avgLuminance(stops) {
    const list = (Array.isArray(stops) ? stops : []).map(normalizeHex).filter(Boolean);
    if (!list.length) return 0;
    return list.reduce((a, c) => a + relLuminance(c), 0) / list.length;
}

/** Texte blanc ou quasi-noir selon la luminance moyenne des stops (seuil biaisé vers le blanc, comme iMessage / Messenger). */
function contrastText(stops) {
    return avgLuminance(stops) > 0.4 ? '#111111' : '#ffffff';
}

/** Échappe une valeur pour l'utiliser dans un sélecteur d'attribut entre guillemets. */
function cssAttr(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\a ').replace(/\r/g, '');
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Génère `linear-gradient(...)` / `radial-gradient(...)` / `conic-gradient(...)` à partir de {type, angle, at, stops}. */
function buildGradientCss(g, opacity = 100, reverse = false) {
    let stops = (g.stops || []).map(normalizeHex).filter(Boolean);
    if (stops.length < 2) stops = [stops[0] || '#000000', stops[0] || '#000000'];
    if (reverse) stops = stops.slice().reverse();
    const cols = stops.map(c => hexToRgba(c, opacity));
    const angle = clampNumber(g.angle, 135, 0, 360);
    if (g.type === 'radial') {
        const at = /^[0-9. %a-z-]{1,24}$/i.test(g.at || '') ? g.at : '50% 50%';
        return `radial-gradient(circle at ${at}, ${cols.join(', ')})`;
    }
    if (g.type === 'conic') {
        return `conic-gradient(from ${angle}deg at 50% 50%, ${cols.concat(cols[0]).join(', ')})`;
    }
    return `linear-gradient(${angle}deg, ${cols.join(', ')})`;
}

/** Dégradé personnalisé -> objet gradient. */
function customToGradient(c) {
    const stops = [c.c1, c.c2];
    if (c.useC3) stops.push(c.c3);
    return { type: GRADIENT_TYPES.includes(c.type) ? c.type : 'linear', angle: c.angle, stops: stops.map(normalizeHex).filter(Boolean) };
}

/** id (preset ou 'custom') -> objet gradient, ou null si inconnu. */
function resolveGradient(id, custom) {
    if (id === CUSTOM_ID) return custom ? customToGradient(custom) : null;
    return Object.prototype.hasOwnProperty.call(GRADIENT_PRESETS, id) ? GRADIENT_PRESETS[id] : null;
}

const GLOSS_LAYER = 'linear-gradient(180deg, rgba(255, 255, 255, 0.30) 0%, rgba(255, 255, 255, 0.10) 45%, rgba(255, 255, 255, 0) 52%)';

/**
 * spec : { kind: 'solid', hex, opacity } | { kind: 'gradient', gradient, opacity }
 * fx   : { continuous, gloss, glow, border }
 * Renvoie une liste [propriété, valeur] (sans !important), utilisée pour le CSS et pour l'aperçu.
 * On n'utilise pas de pseudo-élément (.mes_text est inline-block) : brillance = couche de fond semi-transparente.
 */
function paintDecls(spec, fx) {
    const decls = [];
    const grad = spec.kind === 'gradient';
    const layers = [];
    const sizes = [];
    const positions = [];
    const origins = [];
    const clips = [];
    const sliceSize = 'var(--bc-w, 100%) var(--bc-h, 100%)';
    const slicePos = 'calc(var(--bc-x, 0px) * -1) calc(var(--bc-y, 0px) * -1)';
    const border = !!(fx.border && grad);
    if (fx.gloss) { layers.push(GLOSS_LAYER); sizes.push('100% 100%'); positions.push('0 0'); origins.push('padding-box'); clips.push('padding-box'); }
    if (grad) {
        layers.push(buildGradientCss(spec.gradient, spec.opacity));
        sizes.push(fx.continuous ? sliceSize : '100% 100%');
        positions.push(fx.continuous ? slicePos : '0 0');
        origins.push('padding-box'); clips.push('padding-box');
        if (border) {
            layers.push(buildGradientCss(spec.gradient, spec.opacity, true));
            sizes.push(fx.continuous ? sliceSize : '100% 100%');
            positions.push(fx.continuous ? slicePos : '0 0');
            origins.push('border-box'); clips.push('border-box');
        }
        decls.push(['background-color', 'transparent']);
    } else {
        decls.push(['background-color', hexToRgba(spec.hex, spec.opacity)]);
    }
    decls.push(['background-image', layers.length ? layers.join(', ') : 'none']);
    if (layers.length) {
        decls.push(['background-size', sizes.join(', ')]);
        decls.push(['background-position', positions.join(', ')]);
        decls.push(['background-repeat', 'no-repeat']);
        decls.push(['background-attachment', 'scroll']);
        if (border) {
            decls.push(['background-origin', origins.join(', ')]);
            decls.push(['background-clip', clips.join(', ')]);
            decls.push(['border', '2px solid transparent']);
        }
    }
    if (fx.glow) {
        const first = grad ? (spec.gradient.stops || [])[0] : spec.hex;
        decls.push(['box-shadow', `0 3px 16px -3px ${hexToRgba(first, 60)}`]);
    }
    decls.push(['border-radius', 'var(--bc-radius)']);
    return decls;
}

/** Couleurs de texte résolues pour une face (user/bot), éventuellement avec surcharge de personnage. */
function resolveSide(s, P, ov) {
    const d = defaultSettings;
    ov = ov || {};
    const opacity = clampNumber(s[`${P}Opacity`], 100, 0, 100);
    const gradId = ov.grad && resolveGradient(ov.grad) ? ov.grad : null;
    let spec;
    if (gradId) spec = { kind: 'gradient', gradient: resolveGradient(gradId), opacity };
    else if (normalizeHex(ov.bg)) spec = { kind: 'solid', hex: normalizeHex(ov.bg), opacity };
    else if (s[`${P}BgType`] === 'gradient' && resolveGradient(s[`${P}Grad`], s[`${P}Custom`])) {
        spec = { kind: 'gradient', gradient: resolveGradient(s[`${P}Grad`], s[`${P}Custom`]), opacity };
    } else spec = { kind: 'solid', hex: normalizeHex(s[`${P}Bg`]) || d[`${P}Bg`], opacity };

    const isGrad = spec.kind === 'gradient';
    const ovFg = normalizeHex(ov.fg);
    const manualFg = normalizeHex(s[`${P}Fg`]) || d[`${P}Fg`];
    const auto = isGrad && s[`${P}AutoFg`] !== false && !ovFg;
    const fg = ovFg || (auto ? contrastText(spec.gradient.stops) : manualFg);
    const pick = (enabledKey, colorKey) => {
        const custom = normalizeHex(s[colorKey]) || d[colorKey];
        if (isGrad) return (s[enabledKey] && !auto) ? custom : null;
        return s[enabledKey] ? custom : null;
    };
    return {
        spec,
        fg,
        // sur dégradé, em/strong/q suivent toujours le texte (lisibles) sauf couleur manuelle explicite
        em: isGrad ? (pick('emEnabled', 'emColor') || hexToRgba(fg, 85)) : pick('emEnabled', 'emColor'),
        strong: isGrad ? (pick('strongEnabled', 'strongColor') || fg) : pick('strongEnabled', 'strongColor'),
        quote: isGrad ? (pick('quoteEnabled', 'quoteColor') || fg) : pick('quoteEnabled', 'quoteColor'),
    };
}

function fxOf(s) {
    return { continuous: !!s.continuous, gloss: !!s.gloss, glow: !!s.glow, border: !!s.gradBorder };
}

/** Un dégradé « continu » est-il utile (au moins une face en dégradé) ? */
function needsSlices(s) {
    if (!s.enabled || !s.continuous) return false;
    if (s.userBgType === 'gradient' || s.botBgType === 'gradient') return true;
    return Object.values(s.characters || {}).some(e => e && e.grad && resolveGradient(e.grad));
}

function emRules(prefix, r) {
    const out = [];
    const rule = (tags, color) => {
        if (!color) return;
        out.push(`${tags.map(t => `${prefix} .mes_text ${t}`).join(',\n')} {\n  color: ${color} !important;\n}`);
    };
    rule(['em', 'i'], r.em);
    rule(['strong', 'b'], r.strong);
    rule(['q'], r.quote);
    return out;
}

/**
 * Génère tout le CSS. Choix de peinture :
 *  - paintTarget 'mes_text' (défaut) : le fond va sur `.mes_text`, `.mes_block` et `.mes` deviennent transparents.
 *  - 'mes_block' / 'mes'            : idem avec cet élément.
 * Un seul élément est peint (pas de double peinture, l'opacité ne se cumule pas).
 * Les messages système (`is_system="true"`) sont exclus de tous les sélecteurs.
 */
function buildCss(s) {
    const d = defaultSettings;
    const radius = clampNumber(s.radius, d.radius, 0, 40);
    const target = ['mes_text', 'mes_block', 'mes'].includes(s.paintTarget) ? s.paintTarget : 'mes_text';
    const paint = `.${target}`;
    const others = ['.mes_text', '.mes_block', '.mes'].filter(x => x !== paint);
    const fx = fxOf(s);

    const R = 'html body #chat';
    const M = '.mes:not([is_system="true"])';
    const USER = `${M}[is_user="true"]`;
    const BOT = `${M}:not([is_user="true"])`;
    const out = [];
    const decl = (list) => list.map(([p, v]) => `  ${p}: ${v} !important;`).join('\n');

    out.push(`${R} {\n  --bc-radius: ${radius}px !important;\n}`);

    const sides = [['user', USER, 'SmartThemeUserMesBlurTintColor'], ['bot', BOT, 'SmartThemeBotMesBlurTintColor']];
    for (const [P, SEL, tintVar] of sides) {
        const r = resolveSide(s, P);
        const first = r.spec.kind === 'gradient' ? r.spec.gradient.stops[0] : r.spec.hex;
        out.push(`${R} ${SEL} {\n  --bc-fg: ${r.fg} !important;\n  --${tintVar}: ${hexToRgba(first, r.spec.opacity)} !important;\n}`);
        out.push(`${R} ${SEL} ${paint} {\n${decl(paintDecls(r.spec, fx))}\n}`);
        out.push(...emRules(`${R} ${SEL}`, r));
    }

    // Surcharges par personnage (bots / groupes uniquement)
    const chars = s.characters && typeof s.characters === 'object' ? s.characters : {};
    for (const entry of Object.values(chars)) {
        if (!entry || typeof entry !== 'object') continue;
        const bg = normalizeHex(entry.bg);
        const fg = normalizeHex(entry.fg);
        const grad = entry.grad && resolveGradient(entry.grad) ? entry.grad : null;
        if (!bg && !fg && !grad) continue;
        const r = resolveSide(s, 'bot', { bg, fg, grad });
        const sels = [];
        if (entry.name) sels.push(`${R} ${BOT}[ch_name="${cssAttr(entry.name)}"]`);
        if (entry.avatar) {
            sels.push(`${R} ${BOT}[data-avatar="${cssAttr(entry.avatar)}"]`);
            sels.push(`${R} ${BOT}:has(.avatar img[src*="${cssAttr(encodeURIComponent(entry.avatar))}"])`);
        }
        // Une règle par sélecteur : un sélecteur non reconnu n'invalide pas les autres.
        for (const sel of sels) {
            out.push(`${sel} {\n  --bc-fg: ${r.fg} !important;\n}`);
            if (bg || grad) out.push(`${sel} ${paint} {\n${decl(paintDecls(r.spec, fx))}\n}`);
            out.push(...emRules(sel, r).filter(() => bg || grad || fg));
        }
    }

    // Les autres éléments restent transparents (pas de double fond)
    out.push(`${R} ${M} ${others.join(`,\n${R} ${M} `)} {\n  background-color: transparent !important;\n  background-image: none !important;${fx.glow ? '\n  box-shadow: none !important;' : ''}\n}`);
    if (target === 'mes_block') {
        out.push(`${R} ${M} {\n  border-radius: var(--bc-radius) !important;\n}`);
    }

    // Couleur du texte
    out.push(`${R} ${M} .mes_block .mes_text,\n${R} ${M} .mes_text,\n${R} ${M} .mes_text p,\n${R} ${M} .mes_text li,\n${R} ${M} .name_text,\n${R} ${M} .mes_block .name_text {\n  color: var(--bc-fg) !important;\n}`);
    return out.join('\n');
}

function braceBalance(css) {
    let depth = 0;
    for (const ch of css) {
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth < 0) return false; }
    }
    return depth === 0;
}

/** Position d'un élément dans son conteneur -> variables du dégradé continu (px). */
function computeSlice(elRect, boxRect, boxW, boxH) {
    return {
        x: Math.round(elRect.left - boxRect.left),
        y: Math.round(elRect.top - boxRect.top),
        w: Math.round(boxW),
        h: Math.round(boxH),
    };
}

// ---------------------------------------------------------------------------
// Réglages
// ---------------------------------------------------------------------------

function sanitizeCustom(c, def) {
    const out = (c && typeof c === 'object') ? c : {};
    return {
        type: GRADIENT_TYPES.includes(out.type) ? out.type : def.type,
        angle: clampNumber(out.angle, def.angle, 0, 360),
        c1: normalizeHex(out.c1) || def.c1,
        c2: normalizeHex(out.c2) || def.c2,
        c3: normalizeHex(out.c3) || def.c3,
        useC3: !!out.useC3,
    };
}

/** Fusionne les valeurs par défaut dans un objet de réglages (migration depuis la 1.x incluse). */
function normalizeSettings(s) {
    const oldSchema = Number(s.schema) || 1;
    for (const [key, value] of Object.entries(defaultSettings)) {
        if (s[key] === undefined) s[key] = (value && typeof value === 'object') ? JSON.parse(JSON.stringify(value)) : value;
    }
    if (oldSchema < 2) {
        // 1.x peignait .mes_block par défaut et arrondissait à 18 px : la 2.0 cible .mes_text (la vraie bulle) et 19 px.
        if (s.paintTarget === 'mes_block') s.paintTarget = 'mes_text';
        if (s.radius === 18) s.radius = 19;
    }
    s.schema = SCHEMA;
    for (const k of ['userBg', 'userFg', 'botBg', 'botFg', 'emColor', 'strongColor', 'quoteColor']) {
        s[k] = normalizeHex(s[k]) || defaultSettings[k];
    }
    s.userOpacity = clampNumber(s.userOpacity, 100, 0, 100);
    s.botOpacity = clampNumber(s.botOpacity, 100, 0, 100);
    s.radius = clampNumber(s.radius, defaultSettings.radius, 0, 40);
    if (!['mes_text', 'mes_block', 'mes'].includes(s.paintTarget)) s.paintTarget = 'mes_text';
    for (const P of ['user', 'bot']) {
        if (s[`${P}BgType`] !== 'gradient') s[`${P}BgType`] = 'solid';
        // mutation en place : l'interface garde une référence vers cet objet
        const clean = sanitizeCustom(s[`${P}Custom`], P === 'user' ? defaultCustomUser : defaultCustomBot);
        if (s[`${P}Custom`] && typeof s[`${P}Custom`] === 'object') Object.assign(s[`${P}Custom`], clean);
        else s[`${P}Custom`] = clean;
        if (s[`${P}Grad`] !== CUSTOM_ID && !GRADIENT_PRESETS[s[`${P}Grad`]]) s[`${P}Grad`] = defaultSettings[`${P}Grad`];
        s[`${P}AutoFg`] = s[`${P}AutoFg`] !== false;
    }
    for (const k of ['enabled', 'continuous', 'gloss', 'glow', 'gradBorder']) s[k] = !!s[k];
    if (!s.characters || typeof s.characters !== 'object' || Array.isArray(s.characters)) s.characters = {};
    return s;
}

function getSettings() {
    const store = stExtensions.extension_settings;
    if (!store[MODULE_NAME] || typeof store[MODULE_NAME] !== 'object') {
        store[MODULE_NAME] = {};
    }
    return normalizeSettings(store[MODULE_NAME]);
}

function saveSettings() {
    try {
        stScript.saveSettingsDebounced();
    } catch (e) {
        console.warn(LOG, 'saveSettingsDebounced a échoué', e);
    }
}

// ---------------------------------------------------------------------------
// Injection du <style>
// ---------------------------------------------------------------------------

let styleObserver = null;
let lastReappend = 0;
let reappendTimer = null;

function ensureStyleEl() {
    if (typeof document === 'undefined') return null;
    let el = document.getElementById(STYLE_ID);
    if (!el) {
        el = document.createElement('style');
        el.id = STYLE_ID;
    }
    // Toujours en dernier dans <head> pour gagner à spécificité égale.
    if (document.head && document.head.lastElementChild !== el) document.head.appendChild(el);
    return el;
}

function applyStyle() {
    try {
        const s = getSettings();
        const el = ensureStyleEl();
        if (!el) return;
        el.textContent = s.enabled ? buildCss(s) : '';
        updatePreview();
        syncSlices();
    } catch (e) {
        console.error(LOG, 'applyStyle a échoué', e);
    }
}

function watchHead() {
    try {
        if (styleObserver || typeof MutationObserver === 'undefined' || typeof document === 'undefined' || !document.head) return;
        const reappend = () => {
            reappendTimer = null;
            const el = document.getElementById(STYLE_ID);
            if (!el || document.head.lastElementChild === el) return;
            lastReappend = Date.now();
            document.head.appendChild(el);
        };
        styleObserver = new MutationObserver(() => {
            try {
                const el = document.getElementById(STYLE_ID);
                if (!el || document.head.lastElementChild === el) return;
                const wait = 300 - (Date.now() - lastReappend); // garde-fou anti-boucle avec d'autres scripts
                if (wait <= 0) reappend();
                else if (!reappendTimer) reappendTimer = setTimeout(reappend, wait); // rattrapage différé
            } catch { /* ignore */ }
        });
        styleObserver.observe(document.head, { childList: true });
    } catch (e) {
        console.warn(LOG, 'Observation de <head> impossible', e);
    }
}

// ---------------------------------------------------------------------------
// Dégradé continu (effet Messenger) : variables --bc-x/--bc-y/--bc-w/--bc-h par message
// (aucun background-attachment: fixed, peu fiable sur iOS Safari).
// Coût : une lecture groupée des rectangles des messages proches de l'écran, puis des écritures
// seulement si la valeur change, au plus une fois par frame (rAF).
// ---------------------------------------------------------------------------

const sliceState = { active: false, raf: 0, chat: null, ro: null, mo: null, cache: new WeakMap(), onScroll: null, onResize: null };

function paintElOf(mes, target) {
    if (target === 'mes') return mes;
    return mes.querySelector(target === 'mes_block' ? '.mes_block' : '.mes_text') || mes;
}

function updateSlices() {
    sliceState.raf = 0;
    try {
        const chat = sliceState.chat;
        if (!chat || !sliceState.active) return;
        const s = getSettings();
        const box = chat.getBoundingClientRect();
        const w = chat.clientWidth || box.width;
        const h = chat.clientHeight || box.height;
        const margin = h * 0.5; // on ne met à jour que les messages proches de l'écran
        const jobs = [];
        for (const mes of chat.querySelectorAll('.mes:not([is_system="true"])')) {
            const r = mes.getBoundingClientRect();
            if (r.bottom < box.top - margin || r.top > box.bottom + margin) continue;
            jobs.push([mes, computeSlice((paintElOf(mes, s.paintTarget) === mes) ? r : paintElOf(mes, s.paintTarget).getBoundingClientRect(), box, w, h)]);
        }
        for (const [mes, v] of jobs) {
            const key = `${v.x}|${v.y}|${v.w}|${v.h}`;
            if (sliceState.cache.get(mes) === key) continue;
            sliceState.cache.set(mes, key);
            mes.style.setProperty('--bc-x', `${v.x}px`);
            mes.style.setProperty('--bc-y', `${v.y}px`);
            mes.style.setProperty('--bc-w', `${v.w}px`);
            mes.style.setProperty('--bc-h', `${v.h}px`);
        }
    } catch (e) {
        console.warn(LOG, 'updateSlices a échoué', e);
    }
}

function scheduleSlices() {
    if (!sliceState.active || sliceState.raf) return;
    sliceState.raf = requestAnimationFrame(updateSlices);
}

function clearSlices() {
    const chat = sliceState.chat || document.getElementById('chat');
    if (!chat) return;
    for (const mes of chat.querySelectorAll('.mes')) {
        for (const p of ['--bc-x', '--bc-y', '--bc-w', '--bc-h']) mes.style.removeProperty(p);
    }
    sliceState.cache = new WeakMap();
}

function stopSlices() {
    if (!sliceState.active) return;
    sliceState.active = false;
    if (sliceState.raf) cancelAnimationFrame(sliceState.raf);
    sliceState.raf = 0;
    sliceState.chat?.removeEventListener('scroll', sliceState.onScroll);
    window.removeEventListener('resize', sliceState.onResize);
    window.visualViewport?.removeEventListener('resize', sliceState.onResize);
    sliceState.ro?.disconnect();
    sliceState.mo?.disconnect();
    clearSlices();
    sliceState.chat = null;
}

function startSlices() {
    const chat = document.getElementById('chat');
    if (!chat) return;
    if (sliceState.active && sliceState.chat === chat) { scheduleSlices(); return; }
    stopSlices();
    sliceState.active = true;
    sliceState.chat = chat;
    sliceState.onScroll = () => scheduleSlices();
    sliceState.onResize = () => scheduleSlices();
    chat.addEventListener('scroll', sliceState.onScroll, { passive: true });
    window.addEventListener('resize', sliceState.onResize, { passive: true });
    window.visualViewport?.addEventListener('resize', sliceState.onResize, { passive: true });
    if (typeof ResizeObserver !== 'undefined') { sliceState.ro = new ResizeObserver(() => scheduleSlices()); sliceState.ro.observe(chat); }
    if (typeof MutationObserver !== 'undefined') { sliceState.mo = new MutationObserver(() => scheduleSlices()); sliceState.mo.observe(chat, { childList: true }); }
    scheduleSlices();
}

function syncSlices() {
    try {
        if (typeof document === 'undefined') return;
        if (needsSlices(getSettings())) {
            if (sliceState.active) { sliceState.cache = new WeakMap(); scheduleSlices(); } else startSlices();
        } else stopSlices();
    } catch (e) {
        console.warn(LOG, 'syncSlices a échoué', e);
    }
}

// ---------------------------------------------------------------------------
// Personnages du chat courant
// ---------------------------------------------------------------------------

function getChatCharacters() {
    try {
        const ctx = stExtensions.getContext();
        const chars = Array.isArray(ctx.characters) ? ctx.characters : [];
        const list = [];
        const add = (c) => {
            if (!c || !c.name) return;
            const key = c.avatar || c.name;
            if (!list.some(x => x.key === key)) list.push({ key, name: c.name, avatar: c.avatar || '' });
        };
        if (ctx.groupId) {
            const group = (ctx.groups || []).find(g => String(g.id) === String(ctx.groupId));
            for (const av of (group?.members || [])) {
                add(chars.find(c => c.avatar === av) || { name: String(av).replace(/\.[a-z0-9]+$/i, ''), avatar: av });
            }
        } else if (ctx.characterId !== undefined && ctx.characterId !== null && chars[ctx.characterId]) {
            add(chars[ctx.characterId]);
        }
        return list;
    } catch (e) {
        console.warn(LOG, 'Lecture des personnages impossible', e);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

function colorRow(id, label) {
    return `<div class="bc-row"><label for="bc_${id}">${label}</label><input type="color" id="bc_${id}"></div>`;
}
function opacityRow(id) {
    return `<div class="bc-row"><label for="bc_${id}">Opacité</label><input type="range" id="bc_${id}" min="0" max="100" step="1"><span id="bc_${id}_value" class="bc-val"></span></div>`;
}
function extraRow(id, label) {
    return `<div class="bc-row"><label class="checkbox_label"><input type="checkbox" id="bc_${id}Enabled"><span>${label}</span></label><input type="color" id="bc_${id}Color"></div>`;
}

function swatchesHtml(P) {
    const items = Object.entries(GRADIENT_PRESETS).map(([id, g]) =>
        `<button type="button" class="bc-swatch" data-side="${P}" data-grad="${id}" title="${escapeHtml(g.label)}" aria-label="${escapeHtml(g.label)}" style="background:${buildGradientCss(g)}"></button>`);
    items.push(`<button type="button" class="bc-swatch bc-swatch-custom" data-side="${P}" data-grad="${CUSTOM_ID}" title="Personnalisé" aria-label="Personnalisé"><i class="fa-solid fa-sliders"></i></button>`);
    return items.join('');
}

function sideHtml(P, title) {
    return `
      <div class="bc-block bc-side" data-side="${P}"><b>${title}</b>
        <div class="bc-row"><label for="bc_${P}BgType">Type de fond</label>
          <select id="bc_${P}BgType" class="text_pole"><option value="solid">Uni</option><option value="gradient">Dégradé</option></select>
        </div>
        <div class="bc-solid-only">${colorRow(`${P}Bg`, 'Fond')}</div>
        <div class="bc-grad-only">
          <div class="bc-swatches" id="bc_${P}Grid" role="listbox" aria-label="Thèmes dégradés">${swatchesHtml(P)}</div>
          <div class="bc-hint" id="bc_${P}GradName"></div>
          <div class="bc-custom" id="bc_${P}CustomBox">
            <div class="bc-row"><label for="bc_${P}CType">Type</label>
              <select id="bc_${P}CType" class="text_pole"><option value="linear">Linéaire</option><option value="radial">Radial</option><option value="conic">Conique</option></select></div>
            <div class="bc-row"><label for="bc_${P}CAngle">Angle</label><input type="range" id="bc_${P}CAngle" min="0" max="360" step="1"><span id="bc_${P}CAngle_value" class="bc-val"></span></div>
            <div class="bc-row"><label>Couleurs</label><input type="color" id="bc_${P}C1"><input type="color" id="bc_${P}C2"><input type="color" id="bc_${P}C3"></div>
            <div class="bc-row"><label class="checkbox_label"><input type="checkbox" id="bc_${P}UseC3"><span>Utiliser la 3<sup>e</sup> couleur</span></label></div>
          </div>
          <div class="bc-row"><label class="checkbox_label"><input type="checkbox" id="bc_${P}AutoFg"><span>Contraste automatique du texte (blanc / noir)</span></label></div>
        </div>
        <div class="bc-row" id="bc_${P}FgRow"><label for="bc_${P}Fg">Texte</label><input type="color" id="bc_${P}Fg"></div>
        ${opacityRow(`${P}Opacity`)}
      </div>`;
}

function buildSettingsHtml() {
    const presetButtons = Object.entries(PRESETS)
        .map(([id, p]) => `<div class="menu_button bc-preset" data-preset="${id}">${escapeHtml(p.label)}</div>`)
        .join('');
    return `
<div id="bubble_colors_settings" class="extension_container">
  <div class="inline-drawer">
    <div class="inline-drawer-toggle inline-drawer-header">
      <b>Bubble Colors</b>
      <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>
    <div class="inline-drawer-content">
      <div class="bc-block">
        <label class="checkbox_label"><input type="checkbox" id="bc_enabled"><span>Activer Bubble Colors</span></label>
        <div class="bc-hint">Les couleurs s'appliquent avec !important : elles priment sur votre thème CSS personnalisé.</div>
      </div>
      <div class="bc-block"><b>Aperçu</b>
        <div id="bc_preview" class="bc-preview">
          <div class="bc-bubble bc-bubble-bot" id="bc_prev_bot"><span class="bc-prev-name">Bot</span><br>Salut ! <em>*sourit*</em> <strong>Comment ça va ?</strong> <q>« Bien »</q></div>
          <div class="bc-bubble bc-bubble-user" id="bc_prev_user"><span class="bc-prev-name">Vous</span><br>Très bien, merci !</div>
        </div>
      </div>
      <hr>
      ${sideHtml('user', 'Bulle « Vous »')}
      ${sideHtml('bot', 'Bulle « Bots »')}
      <hr>
      <div class="bc-block"><b>Effets</b>
        <div class="bc-row"><label class="checkbox_label"><input type="checkbox" id="bc_continuous"><span>Dégradé continu sur l'écran (effet Messenger)</span></label></div>
        <div class="bc-hint">Chaque bulle montre la tranche du dégradé correspondant à sa position à l'écran (calculée en JS, fiable sur iOS).</div>
        <div class="bc-row"><label class="checkbox_label"><input type="checkbox" id="bc_gloss"><span>Brillance</span></label></div>
        <div class="bc-row"><label class="checkbox_label"><input type="checkbox" id="bc_glow"><span>Ombre / lueur</span></label></div>
        <div class="bc-row"><label class="checkbox_label"><input type="checkbox" id="bc_gradBorder"><span>Bordure dégradée</span></label></div>
      </div>
      <div class="bc-block"><b>Forme</b>
        <div class="bc-row"><label for="bc_radius">Arrondi</label><input type="range" id="bc_radius" min="0" max="40" step="1"><span id="bc_radius_value" class="bc-val"></span></div>
        <div class="bc-row"><label for="bc_paintTarget">Élément coloré</label>
          <select id="bc_paintTarget" class="text_pole">
            <option value="mes_text">.mes_text (défaut, la vraie bulle)</option>
            <option value="mes_block">.mes_block</option>
            <option value="mes">.mes (si votre thème dessine la bulle ici)</option>
          </select>
        </div>
        <div class="bc-hint">Un seul élément est peint, les autres deviennent transparents (pas de double fond).</div>
      </div>
      <div class="bc-block"><b>Couleurs du texte formaté</b>
        <div class="bc-hint">Sur un dégradé avec contraste automatique, l'italique / gras / citations suivent la couleur du texte.</div>
        ${extraRow('em', '<i>Actions</i> (italique)')}
        ${extraRow('strong', '<b>Dialogue</b> (gras)')}
        ${extraRow('quote', 'Citations « q »')}
      </div>
      <hr>
      <div class="bc-block"><b>Personnages du chat (groupes)</b>
        <div class="bc-hint">Couleur ou dégradé propre à chaque personnage ; laissez vide pour utiliser la bulle « Bots ».</div>
        <div id="bc_chars"></div>
      </div>
      <hr>
      <div class="bc-block"><b>Préréglages</b>
        <div class="bc-presets">${presetButtons}</div>
      </div>
      <div class="bc-block"><div class="menu_button" id="bc_reset_all">Réinitialiser tout</div></div>
    </div>
  </div>
</div>`;
}

function renderCharList() {
    const $ = globalThis.jQuery;
    if (!$) return;
    const host = $('#bc_chars');
    if (!host.length) return;
    const s = getSettings();
    const list = getChatCharacters();
    host.empty();
    if (!list.length) {
        host.append('<div class="bc-hint">Aucun personnage dans le chat actuel.</div>');
        return;
    }
    const gradOptions = ['<option value="">Aucun dégradé</option>']
        .concat(Object.entries(GRADIENT_PRESETS).map(([id, g]) => `<option value="${id}">${escapeHtml(g.label)}</option>`)).join('');
    for (const c of list) {
        const ov = s.characters[c.key] || {};
        const custom = !!(ov.bg || ov.fg || ov.grad);
        const row = $(`<div class="bc-char" data-key="${escapeHtml(c.key)}">
          <span class="bc-char-name">${escapeHtml(c.name)}${custom ? ' <small>(personnalisé)</small>' : ''}</span>
          <label>Fond <input type="color" class="bc-char-bg"></label>
          <label>Texte <input type="color" class="bc-char-fg"></label>
          <label>Dégradé <select class="text_pole bc-char-grad">${gradOptions}</select></label>
          <div class="menu_button bc-char-reset">Réinitialiser</div>
        </div>`);
        row.find('.bc-char-bg').val(ov.bg || s.botBg);
        row.find('.bc-char-fg').val(ov.fg || s.botFg);
        row.find('.bc-char-grad').val(ov.grad && GRADIENT_PRESETS[ov.grad] ? ov.grad : '');
        const setOv = (field, val) => {
            try {
                const cur = s.characters[c.key] || { name: c.name, avatar: c.avatar, bg: null, fg: null, grad: null };
                cur.name = c.name; cur.avatar = c.avatar;
                if (field === 'grad') cur.grad = (val && GRADIENT_PRESETS[val]) ? val : null;
                else {
                    cur[field] = normalizeHex(val);
                    if (field === 'bg') { cur.grad = null; row.find('.bc-char-grad').val(''); } // un fond uni choisi remplace le dégradé
                }
                s.characters[c.key] = cur;
                saveSettings();
                applyStyle();
                row.find('.bc-char-name').html(`${escapeHtml(c.name)} <small>(personnalisé)</small>`);
            } catch (e) { console.error(LOG, e); }
        };
        row.find('.bc-char-bg').on('input change', function () { setOv('bg', $(this).val()); });
        row.find('.bc-char-fg').on('input change', function () { setOv('fg', $(this).val()); });
        row.find('.bc-char-grad').on('change', function () { setOv('grad', String($(this).val())); });
        row.find('.bc-char-reset').on('click', () => {
            try {
                delete s.characters[c.key];
                saveSettings();
                applyStyle();
                renderCharList();
            } catch (e) { console.error(LOG, e); }
        });
        host.append(row);
    }
}

function updatePreview() {
    try {
        const $ = globalThis.jQuery;
        if (!$ || !$('#bc_preview').length) return;
        const s = getSettings();
        // Aperçu : mêmes déclarations que le thème, sans le mode continu (pas de tranche d'écran ici)
        const fx = { ...fxOf(s), continuous: false };
        for (const P of ['user', 'bot']) {
            const el = document.getElementById(`bc_prev_${P}`);
            if (!el) continue;
            const r = resolveSide(s, P);
            el.style.cssText = '';
            el.style.setProperty('--bc-radius', `${s.radius}px`);
            for (const [p, v] of paintDecls(r.spec, fx)) el.style.setProperty(p, v);
            el.style.setProperty('color', r.fg);
            const tint = (sel, color) => $(el).find(sel).css('color', color || '');
            tint('em', r.em); tint('strong', r.strong); tint('q', r.quote);
            const hasNameColor = $(el).find('.bc-prev-name');
            hasNameColor.css('color', r.fg);
        }
    } catch (e) {
        console.warn(LOG, 'updatePreview a échoué', e);
    }
}

function syncSideUi(P) {
    const $ = globalThis.jQuery;
    const s = getSettings();
    const grad = s[`${P}BgType`] === 'gradient';
    $(`#bc_${P}BgType`).val(s[`${P}BgType`]);
    $(`.bc-side[data-side="${P}"] .bc-solid-only`).toggle(!grad);
    $(`.bc-side[data-side="${P}"] .bc-grad-only`).toggle(grad);
    $(`#bc_${P}Bg`).val(s[`${P}Bg`]);
    $(`#bc_${P}Fg`).val(s[`${P}Fg`]);
    $(`#bc_${P}FgRow`).toggle(!grad || !s[`${P}AutoFg`]);
    $(`#bc_${P}AutoFg`).prop('checked', s[`${P}AutoFg`]);
    $(`#bc_${P}Opacity`).val(s[`${P}Opacity`]);
    $(`#bc_${P}Opacity_value`).text(`${s[`${P}Opacity`]}%`);
    const sel = s[`${P}Grad`];
    $(`#bc_${P}Grid .bc-swatch`).each(function () {
        const on = this.dataset.grad === sel;
        this.classList.toggle('bc-selected', on);
        this.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $(`#bc_${P}GradName`).text(sel === CUSTOM_ID ? 'Dégradé personnalisé' : (GRADIENT_PRESETS[sel]?.label || ''));
    const c = s[`${P}Custom`];
    $(`#bc_${P}CustomBox`).toggle(sel === CUSTOM_ID);
    $(`#bc_${P}CType`).val(c.type);
    $(`#bc_${P}CAngle`).val(c.angle).prop('disabled', c.type === 'radial');
    $(`#bc_${P}CAngle_value`).text(`${c.angle}°`);
    $(`#bc_${P}C1`).val(c.c1); $(`#bc_${P}C2`).val(c.c2); $(`#bc_${P}C3`).val(c.c3).prop('disabled', !c.useC3);
    $(`#bc_${P}UseC3`).prop('checked', c.useC3);
    // Le swatch « personnalisé » reflète le dégradé en cours
    $(`#bc_${P}Grid .bc-swatch-custom`).css('background', buildGradientCss(customToGradient(c)));
}

function syncUi() {
    const $ = globalThis.jQuery;
    if (!$) return;
    const s = getSettings();
    $('#bc_enabled').prop('checked', s.enabled);
    syncSideUi('user');
    syncSideUi('bot');
    for (const k of ['continuous', 'gloss', 'glow', 'gradBorder']) $(`#bc_${k}`).prop('checked', s[k]);
    $('#bc_radius').val(s.radius);
    $('#bc_radius_value').text(`${s.radius}px`);
    $('#bc_paintTarget').val(s.paintTarget);
    for (const k of ['em', 'strong', 'quote']) {
        $(`#bc_${k}Enabled`).prop('checked', s[`${k}Enabled`]);
        $(`#bc_${k}Color`).val(s[`${k}Color`]);
    }
    renderCharList();
    updatePreview();
}

function bindUi() {
    const $ = globalThis.jQuery;
    const s = getSettings();
    const change = () => { saveSettings(); applyStyle(); };

    $('#bc_enabled').on('change', function () { s.enabled = !!$(this).prop('checked'); change(); });
    for (const P of ['user', 'bot']) {
        $(`#bc_${P}BgType`).on('change', function () { s[`${P}BgType`] = String($(this).val()) === 'gradient' ? 'gradient' : 'solid'; syncSideUi(P); change(); });
        $(`#bc_${P}Grid`).on('click', '.bc-swatch', function () {
            const id = this.dataset.grad;
            if (id !== CUSTOM_ID && !GRADIENT_PRESETS[id]) return;
            s[`${P}Grad`] = id;
            s[`${P}BgType`] = 'gradient';
            syncSideUi(P); change();
        });
        $(`#bc_${P}AutoFg`).on('change', function () { s[`${P}AutoFg`] = !!$(this).prop('checked'); syncSideUi(P); change(); });
        const cu = s[`${P}Custom`];
        $(`#bc_${P}CType`).on('change', function () { cu.type = GRADIENT_TYPES.includes(String($(this).val())) ? String($(this).val()) : 'linear'; syncSideUi(P); change(); });
        $(`#bc_${P}CAngle`).on('input change', function () { cu.angle = clampNumber($(this).val(), 135, 0, 360); $(`#bc_${P}CAngle_value`).text(`${cu.angle}°`); $(`#bc_${P}Grid .bc-swatch-custom`).css('background', buildGradientCss(customToGradient(cu))); change(); });
        for (const k of ['C1', 'C2', 'C3']) {
            $(`#bc_${P}${k}`).on('input change', function () { cu[k.toLowerCase()] = normalizeHex($(this).val()) || cu[k.toLowerCase()]; $(`#bc_${P}Grid .bc-swatch-custom`).css('background', buildGradientCss(customToGradient(cu))); change(); });
        }
        $(`#bc_${P}UseC3`).on('change', function () { cu.useC3 = !!$(this).prop('checked'); syncSideUi(P); change(); });
    }
    for (const k of ['userBg', 'userFg', 'botBg', 'botFg', 'emColor', 'strongColor', 'quoteColor']) {
        $(`#bc_${k}`).on('input change', function () {
            s[k] = normalizeHex($(this).val()) || defaultSettings[k];
            change();
            if (k === 'botBg' || k === 'botFg') renderCharList();
        });
    }
    for (const k of ['userOpacity', 'botOpacity']) {
        $(`#bc_${k}`).on('input change', function () {
            s[k] = clampNumber($(this).val(), 100, 0, 100);
            $(`#bc_${k}_value`).text(`${s[k]}%`);
            change();
        });
    }
    for (const k of ['continuous', 'gloss', 'glow', 'gradBorder']) {
        $(`#bc_${k}`).on('change', function () { s[k] = !!$(this).prop('checked'); change(); });
    }
    $('#bc_radius').on('input change', function () {
        s.radius = clampNumber($(this).val(), defaultSettings.radius, 0, 40);
        $('#bc_radius_value').text(`${s.radius}px`);
        change();
    });
    $('#bc_paintTarget').on('change', function () {
        const v = String($(this).val());
        s.paintTarget = ['mes_text', 'mes_block', 'mes'].includes(v) ? v : 'mes_text';
        change();
    });
    for (const k of ['em', 'strong', 'quote']) {
        $(`#bc_${k}Enabled`).on('change', function () { s[`${k}Enabled`] = !!$(this).prop('checked'); change(); });
    }
    $('#bubble_colors_settings .bc-preset').on('click', function () {
        try {
            const p = PRESETS[$(this).data('preset')];
            if (!p) return;
            const { label, ...values } = p;
            Object.assign(s, { userBgType: 'solid', botBgType: 'solid', continuous: false, emEnabled: false, strongEnabled: false, quoteEnabled: false, userOpacity: 100, botOpacity: 100 }, values);
            change();
            syncUi();
        } catch (e) { console.error(LOG, e); }
    });
    $('#bc_reset_all').on('click', () => {
        try {
            const store = stExtensions.extension_settings;
            store[MODULE_NAME] = {};
            getSettings();
            // Les références `s` capturées deviennent obsolètes : on relie l'interface.
            $('#bubble_colors_settings').remove();
            mountSettings();
            saveSettings();
            applyStyle();
        } catch (e) { console.error(LOG, e); }
    });
}

function mountSettings() {
    const $ = globalThis.jQuery;
    if (!$ || $('#bubble_colors_settings').length) return;
    const host = $('#extensions_settings2').length ? $('#extensions_settings2') : $('#extensions_settings');
    if (!host.length) {
        console.warn(LOG, 'Conteneur des réglages introuvable.');
        return;
    }
    host.append(buildSettingsHtml());
    syncUi();
    bindUi();
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

function init() {
    try {
        getSettings(); // fusionne les valeurs par défaut (migration 1.x -> 2.0)
        applyStyle();
        watchHead();
        mountSettings();

        const { eventSource, event_types } = stScript;
        if (!eventSource || !event_types) {
            console.error(LOG, 'eventSource / event_types introuvables : pas de mise à jour au changement de chat.');
            return;
        }
        const refresh = () => {
            try { applyStyle(); renderCharList(); } catch (e) { console.error(LOG, e); }
        };
        eventSource.on(event_types.CHAT_CHANGED, refresh);
        if (event_types.GROUP_UPDATED) eventSource.on(event_types.GROUP_UPDATED, refresh);
        for (const ev of [event_types.MESSAGE_RECEIVED, event_types.MESSAGE_SENT, event_types.USER_MESSAGE_RENDERED, event_types.CHARACTER_MESSAGE_RENDERED]) {
            if (ev) eventSource.on(ev, () => scheduleSlices());
        }
        console.log(LOG, 'chargé (2.0.0)');
    } catch (e) {
        console.error(LOG, 'Initialisation échouée (chat non affecté)', e);
    }
}

if (globalThis.jQuery) {
    globalThis.jQuery(() => init());
} else {
    init();
}

// Exposé uniquement pour les tests Node (sans effet dans SillyTavern)
export const __test = {
    normalizeHex, hexToRgba, cssAttr, buildCss, braceBalance, getSettings, normalizeSettings, defaultSettings, PRESETS, GRADIENT_PRESETS,
    getChatCharacters, relLuminance, avgLuminance, contrastText, buildGradientCss, customToGradient, resolveGradient, resolveSide,
    paintDecls, computeSlice, needsSlices,
};
