/**
 * Bubble Colors - extension SillyTavern
 * Personnalise les couleurs des bulles de chat (utilisateur / bots / personnages de groupe),
 * l'opacité, l'arrondi et les couleurs de l'italique / gras / citations.
 *
 * Les règles sont injectées dans <style id="bubble-colors-style"> (toujours en dernier dans <head>)
 * avec !important et des sélecteurs très spécifiques pour l'emporter sur un thème CSS personnalisé.
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

const defaultSettings = Object.freeze({
    enabled: true,
    // Élément qui reçoit la couleur de fond : 'mes_block' (défaut) ou 'mes'. L'autre est mis en transparent.
    paintTarget: 'mes_block',
    userBg: '#0a84ff',
    userFg: '#ffffff',
    userOpacity: 100,
    botBg: '#3a3a3c',
    botFg: '#ffffff',
    botOpacity: 100,
    radius: 18, // px, 0-40
    emEnabled: false, // *actions* (italique)
    emColor: '#b0b0b8',
    strongEnabled: false, // **dialogue** (gras)
    strongColor: '#ffffff',
    quoteEnabled: false, // "citations" (balise q)
    quoteColor: '#ffd60a',
    // { [clé avatar/nom]: { name, avatar, bg: '#rrggbb'|null, fg: '#rrggbb'|null } }
    characters: {},
});

const PRESETS = Object.freeze({
    imessage: { label: 'iMessage bleu/gris', userBg: '#0a84ff', userFg: '#ffffff', botBg: '#3a3a3c', botFg: '#ffffff', radius: 18 },
    whatsapp: { label: 'Vert WhatsApp', userBg: '#005c4b', userFg: '#e9edef', botBg: '#202c33', botFg: '#e9edef', radius: 12 },
    violet: { label: 'Violet', userBg: '#7c3aed', userFg: '#ffffff', botBg: '#2e2a45', botFg: '#f3eefe', radius: 18 },
    rose: { label: 'Rose', userBg: '#ec4899', userFg: '#ffffff', botBg: '#3b2a33', botFg: '#ffeaf3', radius: 20 },
    rouge: { label: 'Mode sombre rouge', userBg: '#991b1b', userFg: '#f5f5f5', botBg: '#1c1c1e', botFg: '#f5f5f5', radius: 14, emEnabled: true, emColor: '#f87171' },
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

/** Échappe une valeur pour l'utiliser dans un sélecteur d'attribut entre guillemets. */
function cssAttr(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\a ').replace(/\r/g, '');
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * Génère tout le CSS. Choix de peinture :
 *  - paintTarget 'mes_block' : le fond va sur `.mes_block`, `.mes` devient transparent.
 *  - paintTarget 'mes'       : le fond va sur `.mes`, `.mes_block` devient transparent.
 * Un seul des deux est peint (pas de double peinture, donc l'opacité ne se cumule pas).
 * Les messages système (`is_system="true"`) sont exclus de tous les sélecteurs.
 */
function buildCss(s) {
    const d = defaultSettings;
    const userBg = hexToRgba(s.userBg, s.userOpacity, d.userBg);
    const botBg = hexToRgba(s.botBg, s.botOpacity, d.botBg);
    const userFg = normalizeHex(s.userFg) || d.userFg;
    const botFg = normalizeHex(s.botFg) || d.botFg;
    const radius = clampNumber(s.radius, d.radius, 0, 40);
    const paint = s.paintTarget === 'mes' ? '.mes' : '.mes_block';
    const other = s.paintTarget === 'mes' ? '.mes_block' : '.mes';

    const R = 'html body #chat';
    const M = '.mes:not([is_system="true"])';
    const USER = `${M}[is_user="true"]`;
    const BOT = `${M}:not([is_user="true"])`;
    const out = [];

    out.push(`${R} {\n  --bc-user-bg: ${userBg} !important;\n  --bc-user-fg: ${userFg} !important;\n  --bc-bot-bg: ${botBg} !important;\n  --bc-bot-fg: ${botFg} !important;\n  --bc-radius: ${radius}px !important;\n}`);
    out.push(`${R} ${USER} {\n  --bc-bg: var(--bc-user-bg) !important;\n  --bc-fg: var(--bc-user-fg) !important;\n  --SmartThemeUserMesBlurTintColor: var(--bc-user-bg) !important;\n}`);
    out.push(`${R} ${BOT} {\n  --bc-bg: var(--bc-bot-bg) !important;\n  --bc-fg: var(--bc-bot-fg) !important;\n  --SmartThemeBotMesBlurTintColor: var(--bc-bot-bg) !important;\n}`);

    // Surcharges par personnage (bots / groupes uniquement)
    const chars = s.characters && typeof s.characters === 'object' ? s.characters : {};
    for (const entry of Object.values(chars)) {
        if (!entry || typeof entry !== 'object') continue;
        const bg = normalizeHex(entry.bg);
        const fg = normalizeHex(entry.fg);
        if (!bg && !fg) continue;
        let decl = '';
        if (bg) decl += `  --bc-bg: ${hexToRgba(bg, s.botOpacity, d.botBg)} !important;\n`;
        if (fg) decl += `  --bc-fg: ${fg} !important;\n`;
        const sels = [];
        if (entry.name) sels.push(`${R} ${BOT}[ch_name="${cssAttr(entry.name)}"]`);
        if (entry.avatar) {
            sels.push(`${R} ${BOT}[data-avatar="${cssAttr(entry.avatar)}"]`);
            sels.push(`${R} ${BOT}:has(.avatar img[src*="${cssAttr(encodeURIComponent(entry.avatar))}"])`);
        }
        // Une règle par sélecteur : un sélecteur non reconnu n'invalide pas les autres.
        for (const sel of sels) out.push(`${sel} {\n${decl}}`);
    }

    // Peinture
    out.push(`${R} ${M} ${paint} {\n  background-color: var(--bc-bg) !important;\n  background-image: none !important;\n  border-radius: var(--bc-radius) !important;\n}`);
    out.push(`${R} ${M} ${other} {\n  background-color: transparent !important;\n  background-image: none !important;\n}`);
    if (paint === '.mes_block') {
        // `.mes` transparent mais arrondi identique pour que les ombres / bordures du thème restent cohérentes
        out.push(`${R} ${M} {\n  border-radius: var(--bc-radius) !important;\n}`);
    }

    // Couleur du texte
    out.push(`${R} ${M} .mes_block .mes_text,\n${R} ${M} .mes_text,\n${R} ${M} .mes_text p,\n${R} ${M} .mes_text li,\n${R} ${M} .name_text,\n${R} ${M} .mes_block .name_text {\n  color: var(--bc-fg) !important;\n}`);

    // Actions / dialogues / citations
    if (s.emEnabled) {
        const c = normalizeHex(s.emColor) || d.emColor;
        out.push(`${R} ${M} .mes_text em,\n${R} ${M} .mes_text i {\n  color: ${c} !important;\n}`);
    }
    if (s.strongEnabled) {
        const c = normalizeHex(s.strongColor) || d.strongColor;
        out.push(`${R} ${M} .mes_text strong,\n${R} ${M} .mes_text b {\n  color: ${c} !important;\n}`);
    }
    if (s.quoteEnabled) {
        const c = normalizeHex(s.quoteColor) || d.quoteColor;
        out.push(`${R} ${M} .mes_text q {\n  color: ${c} !important;\n}`);
    }
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

// ---------------------------------------------------------------------------
// Réglages
// ---------------------------------------------------------------------------

function getSettings() {
    const store = stExtensions.extension_settings;
    if (!store[MODULE_NAME] || typeof store[MODULE_NAME] !== 'object') {
        store[MODULE_NAME] = {};
    }
    const s = store[MODULE_NAME];
    for (const [key, value] of Object.entries(defaultSettings)) {
        if (s[key] === undefined) s[key] = (value && typeof value === 'object') ? JSON.parse(JSON.stringify(value)) : value; // fusion des valeurs par défaut
    }
    for (const k of ['userBg', 'userFg', 'botBg', 'botFg', 'emColor', 'strongColor', 'quoteColor']) {
        s[k] = normalizeHex(s[k]) || defaultSettings[k];
    }
    s.userOpacity = clampNumber(s.userOpacity, 100, 0, 100);
    s.botOpacity = clampNumber(s.botOpacity, 100, 0, 100);
    s.radius = clampNumber(s.radius, defaultSettings.radius, 0, 40);
    if (s.paintTarget !== 'mes' && s.paintTarget !== 'mes_block') s.paintTarget = 'mes_block';
    if (!s.characters || typeof s.characters !== 'object' || Array.isArray(s.characters)) s.characters = {};
    return s;
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
    } catch (e) {
        console.error(LOG, 'applyStyle a échoué', e);
    }
}

function watchHead() {
    try {
        if (styleObserver || typeof MutationObserver === 'undefined' || typeof document === 'undefined' || !document.head) return;
        styleObserver = new MutationObserver(() => {
            try {
                const el = document.getElementById(STYLE_ID);
                if (!el || document.head.lastElementChild === el) return;
                const now = Date.now();
                if (now - lastReappend < 300) return; // garde-fou anti-boucle avec d'autres scripts
                lastReappend = now;
                document.head.appendChild(el);
            } catch { /* ignore */ }
        });
        styleObserver.observe(document.head, { childList: true });
    } catch (e) {
        console.warn(LOG, 'Observation de <head> impossible', e);
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
      <hr>
      <div class="bc-block"><b>Bulle « Vous »</b>
        ${colorRow('userBg', 'Fond')}
        ${colorRow('userFg', 'Texte')}
        ${opacityRow('userOpacity')}
      </div>
      <div class="bc-block"><b>Bulle « Bots »</b>
        ${colorRow('botBg', 'Fond')}
        ${colorRow('botFg', 'Texte')}
        ${opacityRow('botOpacity')}
      </div>
      <hr>
      <div class="bc-block"><b>Forme</b>
        <div class="bc-row"><label for="bc_radius">Arrondi</label><input type="range" id="bc_radius" min="0" max="40" step="1"><span id="bc_radius_value" class="bc-val"></span></div>
        <div class="bc-row"><label for="bc_paintTarget">Élément coloré</label>
          <select id="bc_paintTarget" class="text_pole">
            <option value="mes_block">.mes_block (défaut)</option>
            <option value="mes">.mes (si votre thème dessine la bulle ici)</option>
          </select>
        </div>
        <div class="bc-hint">Un seul élément est peint, l'autre devient transparent (pas de double fond).</div>
      </div>
      <div class="bc-block"><b>Couleurs du texte formaté</b>
        ${extraRow('em', '<i>Actions</i> (italique)')}
        ${extraRow('strong', '<b>Dialogue</b> (gras)')}
        ${extraRow('quote', 'Citations « q »')}
      </div>
      <hr>
      <div class="bc-block"><b>Personnages du chat (groupes)</b>
        <div class="bc-hint">Couleurs propres à chaque personnage ; laissez vide pour utiliser la bulle « Bots ».</div>
        <div id="bc_chars"></div>
      </div>
      <hr>
      <div class="bc-block"><b>Préréglages</b>
        <div class="bc-presets">${presetButtons}</div>
      </div>
      <div class="bc-block"><b>Aperçu</b>
        <div id="bc_preview" class="bc-preview">
          <div class="bc-bubble bc-bubble-bot" id="bc_prev_bot"><span class="bc-prev-name">Bot</span><br>Salut ! <em>*sourit*</em> <strong>Comment ça va ?</strong> <q>« Bien »</q></div>
          <div class="bc-bubble bc-bubble-user" id="bc_prev_user"><span class="bc-prev-name">Vous</span><br>Très bien, merci !</div>
        </div>
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
    for (const c of list) {
        const ov = s.characters[c.key] || {};
        const custom = !!(ov.bg || ov.fg);
        const row = $(`<div class="bc-char" data-key="${escapeHtml(c.key)}">
          <span class="bc-char-name">${escapeHtml(c.name)}${custom ? ' <small>(personnalisé)</small>' : ''}</span>
          <label>Fond <input type="color" class="bc-char-bg"></label>
          <label>Texte <input type="color" class="bc-char-fg"></label>
          <div class="menu_button bc-char-reset">Réinitialiser</div>
        </div>`);
        row.find('.bc-char-bg').val(ov.bg || s.botBg);
        row.find('.bc-char-fg').val(ov.fg || s.botFg);
        const setOv = (field, val) => {
            try {
                const cur = s.characters[c.key] || { name: c.name, avatar: c.avatar, bg: null, fg: null };
                cur.name = c.name; cur.avatar = c.avatar;
                cur[field] = normalizeHex(val);
                s.characters[c.key] = cur;
                saveSettings();
                applyStyle();
                row.find('.bc-char-name').html(`${escapeHtml(c.name)} <small>(personnalisé)</small>`);
            } catch (e) { console.error(LOG, e); }
        };
        row.find('.bc-char-bg').on('input change', function () { setOv('bg', $(this).val()); });
        row.find('.bc-char-fg').on('input change', function () { setOv('fg', $(this).val()); });
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
        const r = `${s.radius}px`;
        $('#bc_prev_user').css({ backgroundColor: hexToRgba(s.userBg, s.userOpacity), color: s.userFg, borderRadius: r });
        $('#bc_prev_bot').css({ backgroundColor: hexToRgba(s.botBg, s.botOpacity), color: s.botFg, borderRadius: r });
        $('#bc_preview em').css('color', s.emEnabled ? s.emColor : '');
        $('#bc_preview strong').css('color', s.strongEnabled ? s.strongColor : '');
        $('#bc_preview q').css('color', s.quoteEnabled ? s.quoteColor : '');
    } catch (e) {
        console.warn(LOG, 'updatePreview a échoué', e);
    }
}

function syncUi() {
    const $ = globalThis.jQuery;
    if (!$) return;
    const s = getSettings();
    $('#bc_enabled').prop('checked', s.enabled);
    for (const k of ['userBg', 'userFg', 'botBg', 'botFg']) $(`#bc_${k}`).val(s[k]);
    for (const k of ['userOpacity', 'botOpacity']) {
        $(`#bc_${k}`).val(s[k]);
        $(`#bc_${k}_value`).text(`${s[k]}%`);
    }
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
    $('#bc_radius').on('input change', function () {
        s.radius = clampNumber($(this).val(), defaultSettings.radius, 0, 40);
        $('#bc_radius_value').text(`${s.radius}px`);
        change();
    });
    $('#bc_paintTarget').on('change', function () {
        s.paintTarget = String($(this).val()) === 'mes' ? 'mes' : 'mes_block';
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
            Object.assign(s, { emEnabled: false, strongEnabled: false, quoteEnabled: false, userOpacity: 100, botOpacity: 100 }, values);
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
        getSettings(); // fusionne les valeurs par défaut
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
        console.log(LOG, 'chargé');
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
export const __test = { normalizeHex, hexToRgba, cssAttr, buildCss, braceBalance, getSettings, defaultSettings, PRESETS, getChatCharacters };
