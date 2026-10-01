# Bubble Colors

Extension SillyTavern pour personnaliser les bulles de chat (vous / bots / personnages d'un groupe) : couleurs unies ou **dégradés façon thèmes Messenger**.

## Installation

SillyTavern > Extensions > **Install extension** > coller `https://github.com/hydravnss/bubble-colors`.
Réglages : Extensions > **Bubble Colors**.

## Nouveautés 2.0.0

- **Cible par défaut : `.mes_text`** (la vraie bulle dans « iMessage Dark » et la plupart des thèmes). `.mes_block` et `.mes` sont mis en transparent (pas de double fond). L'option « Élément coloré » permet de revenir à `.mes_block` ou `.mes`. L'arrondi par défaut passe à 19 px.
- **Type de fond Uni / Dégradé** pour « Vous » et « Bots », avec une grille de 24 thèmes en pastilles rondes (toucher pour choisir, anneau sur la sélection) + dégradé personnalisé : 2-3 couleurs, angle 0-360°, type linéaire / radial / conique.
- **Dégradé continu sur l'écran (effet Messenger)** : chaque bulle affiche la tranche du dégradé correspondant à sa position dans la zone de chat. Calculé en JS (variables `--bc-x/--bc-y/--bc-w/--bc-h`, mises à jour au défilement avec `requestAnimationFrame`, au redimensionnement et à l'arrivée d'un message) ; `background-attachment: fixed` n'est pas utilisé car peu fiable sur iOS Safari. Désactivé par défaut : le dégradé est alors propre à chaque bulle.
- **Contraste automatique du texte** (blanc ou noir selon la luminance moyenne du dégradé), activé par défaut sur dégradé ; couleur manuelle possible en le décochant. L'italique, le gras et les citations suivent la couleur du texte (lisibles sur dégradé), sauf couleur manuelle explicite.
- **Effets optionnels** : brillance (couche de fond blanche semi-transparente, sans pseudo-élément), ombre / lueur (couleur du premier arrêt du dégradé), bordure dégradée (désactivée par défaut).
- **Aperçu en direct** des deux bulles, stylées comme le thème.
- **Surcharges par personnage** : couleur unie ou n'importe quel dégradé prédéfini.
- **Migration** : les réglages 1.x sont conservés et complétés par les valeurs par défaut (`.mes_block` → `.mes_text`, 18 → 19 px). Les dégradés sont enregistrés par identifiant.

## Thèmes dégradés

| Identifiant | Nom |
|---|---|
| `bleu-violet` | Bleu → Violet |
| `rose-orange` | Rose → Orange |
| `cyan-bleu-royal` | Cyan → Bleu royal |
| `pastel` | Pastel (bleu clair / rose / jaune) |
| `violet-rose` | Violet → Rose |
| `vert-turquoise` | Vert → Turquoise |
| `rouge-orange` | Rouge → Orange |
| `coucher-soleil` | Coucher de soleil |
| `ocean` | Océan |
| `aurore` | Aurore |
| `bonbon` | Bonbon |
| `minuit` | Minuit |
| `lavande` | Lavande |
| `menthe` | Menthe |
| `peche` | Pêche |
| `messenger-classique` | Messenger classique (vertical) |
| `arc-en-ciel` | Arc-en-ciel (conique) |
| `cible` | Cible (radial rouge → orange → jaune → vert) |
| `rose-magenta` | Rose → Magenta (radial) |
| `or` | Or |
| `argent` | Argent |
| `neon` | Néon |
| `lave` | Lave |
| `glace` | Glace |
| `custom` | Personnalisé (2-3 couleurs, angle, type) |

## Compatibilité avec un thème CSS personnalisé

Les règles sont injectées dans `<style id="bubble-colors-style">`, gardé en dernier dans `<head>` (et ré-ajouté si un autre style arrive après), avec `!important` et des sélecteurs plus spécifiques (`html body #chat .mes:not([is_system="true"])[is_user="true"] .mes_text`) pour l'emporter sur un thème comme « iMessage Dark ». Les messages système (`is_system="true"`) ne sont jamais modifiés.

## Tests

- `node test/bubble-colors.test.mjs` : fonctions utilitaires (hex→rgba, génération de dégradés, luminance / contraste, migration, CSS généré).
- Vérifié dans un vrai SillyTavern 1.19 avec Playwright WebKit (émulation iPhone 14 Pro) et un CSS « iMessage Dark » reconstitué ; **pas testé sur un vrai iPhone**.

## Licence

MIT
