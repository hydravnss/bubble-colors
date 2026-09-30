# Bubble Colors

Extension SillyTavern pour personnaliser les couleurs des bulles de chat (vous / bots / personnages d'un groupe).

> ⚠️ **Non testée dans un vrai SillyTavern** : seuls les fonctions utilitaires et le CSS généré sont testés sous Node (`node test/bubble-colors.test.mjs`).

## Installation

SillyTavern > Extensions > **Install extension** > coller `https://github.com/hydravnss/bubble-colors`.
Réglages : Extensions > **Bubble Colors**.

## Fonctions

- Couleur de fond, de texte et opacité (0-100) pour la bulle utilisateur et la bulle des bots.
- Couleurs propres à chaque personnage du chat courant (groupes), avec « Réinitialiser » par personnage.
- Arrondi des bulles (0-40 px), couleurs des *actions* (italique), du **dialogue** (gras) et des citations.
- Aperçu en direct, « Réinitialiser tout » et préréglages : iMessage bleu/gris, Vert WhatsApp, Violet, Rose, Mode sombre rouge.

## Compatibilité avec un thème CSS personnalisé

Les règles sont injectées dans `<style id="bubble-colors-style">`, gardé en dernier dans `<head>`, avec `!important` et des sélecteurs très spécifiques (`html body #chat .mes…`) pour l'emporter sur un thème comme « iMessage Dark ».
Le fond est peint sur **un seul** élément (`.mes_block` par défaut, ou `.mes` via l'option « Élément coloré » si votre thème dessine la bulle là) ; l'autre est mis en transparent pour éviter le double fond. Les messages système (`is_system="true"`) ne sont jamais modifiés.

## Licence

MIT
