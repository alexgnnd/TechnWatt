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
