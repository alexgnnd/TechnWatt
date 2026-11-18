# TechnWatt : mode d'emploi

## Modifier ou écrire un article
1. Allez sur **votresite.netlify.app/admin** et connectez-vous.
2. Cliquez sur **Articles** (ou **Comparatifs**).
3. Cliquez sur un article pour le modifier, ou sur **Nouvel article**.
4. Remplissez les cases : titre, rubrique, date, photo principale, chapô, texte…
   - Dans le texte, le bouton **Titre 2** crée un intertitre.
   - Le bouton **+** puis **Image** insère une photo à l'endroit voulu.
5. Cliquez sur **Publier** → **Publier maintenant**. Le site se met à jour en 1 à 2 minutes.

## Bon à savoir
- **Rubrique** : choisit où l'article apparaît (Watt · Actualités, Watt · À bord, Tech · Smartphones…).
- **Date** : les articles les plus récents s'affichent en premier, et les 6 derniers sur la page À la une.
- **Fiche À bord** : remplissez « Encadré de chiffres » et « Prix » pour avoir la colonne de chiffres à droite.
- **Renvoi vers une fiche À bord** : ajoute le grand encadré vert en bas d'une actualité.
- **Mettre à la une** : place l'article dans le carrousel. Choisissez une photo en paysage, prise en situation (pas de fond blanc).
- **Brouillon** : cochez pour cacher un article sans le supprimer.
- Photos : de préférence en JPG, moins de 1 Mo, environ 1 800 px de large.

## Ce qui n'est pas dans l'admin
Le guide (batteries, recharge, aides…), les chiffres du marché, le logo et la mise en page sont dans `src/template.html`.

## Version anglaise
- Le bouton **EN / FR** en haut à droite bascule tout le site.
- Dans l'admin, chaque article a deux onglets de langue : **FR** et **EN**.
- La version anglaise est facultative : si un champ anglais est vide, c'est le texte français qui s'affiche.
- Les photos, la date et la rubrique sont communes aux deux langues.
- Les textes fixes (menus, guide, chiffres du marché) sont traduits dans `src/i18n-en.json`.

## Pictos

Tant qu'un article n'a pas de photo, choisissez un picto dans le champ « Picto (si pas de photo) ». Dès que vous ajoutez une photo principale, elle prend sa place.

## Référencement

Chaque article a sa propre adresse (ex. : /gta-vi, /en/gta-vi), avec son titre, sa description et son image de partage. Le plan du site (/sitemap.xml) se met à jour seul. Le chapô sert de description dans Google : soignez-le, 1 ou 2 phrases.

## Publicité (Google AdSense)

1. Créez votre compte sur adsense.google.com et ajoutez votre site.
2. Dans l'admin, Réglages : collez votre identifiant « ca-pub-… ». Le site publie alors le code AdSense et le fichier ads.txt.
3. Dans AdSense, activez le message de consentement (Confidentialité et messages › RGPD), obligatoire en Europe.
4. Une fois le site validé, créez trois blocs « display » et collez leurs numéros (data-ad-slot) dans Réglages : accueil, fin d'article, bas de rubrique.

Tant que l'identifiant est vide, aucune pub ne s'affiche.
