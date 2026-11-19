---
titre: 'Calculez votre coût réel au kilomètre, essence contre électrique'
brouillon: true
rubrique: watt-actualites
date: '2026-11-20'
categorie: Outil
picto: carte
chapo: 'Entrez vos propres chiffres plutôt que des moyennes nationales. Le calcul se met à jour en direct, et le résultat surprend souvent.'
reperes:
- Calcul instantané
- Vos chiffres, pas des moyennes
- Projection sur 5 ans
---
Les comparaisons entre essence et électrique reposent presque toujours sur des moyennes qui ne correspondent à personne. Votre kilométrage, votre consommation réelle et surtout votre prix du kWh changent complètement le résultat. Voici l'outil pour faire le calcul avec vos propres chiffres.

<div class="tc">
<h4>Votre situation</h4>
<div class="tc-g">
<div class="tc-f"><label for="tc-km">Kilomètres par an</label><input id="tc-km" type="number" value="13000" oninput="twCalc()"></div>
<div class="tc-f"><label for="tc-pe">Prix du kWh (€)</label><input id="tc-pe" type="number" step="0.01" value="0.20" oninput="twCalc()"></div>
<div class="tc-f"><label for="tc-ce">Consommation électrique (kWh/100 km)</label><input id="tc-ce" type="number" step="0.1" value="17" oninput="twCalc()"></div>
<div class="tc-f"><label for="tc-pt">Prix du carburant (€/L)</label><input id="tc-pt" type="number" step="0.01" value="1.75" oninput="twCalc()"></div>
<div class="tc-f"><label for="tc-ct">Consommation essence (L/100 km)</label><input id="tc-ct" type="number" step="0.1" value="6.5" oninput="twCalc()"></div>
</div>
<div class="tc-out">
<div class="tc-c e"><span>Électrique</span><b id="tc-re">—</b><i><span id="tc-r100e">—</span> aux 100 km</i></div>
<div class="tc-c t"><span>Essence</span><b id="tc-rt">—</b><i><span id="tc-r100t">—</span> aux 100 km</i></div>
</div>
<div class="tc-tot"><b id="tc-diff">—</b><span id="tc-lbl">économisés par an</span><em>Soit <span id="tc-5">—</span> sur cinq ans, à usage constant</em></div>
</div>

## Comment remplir correctement

**Le prix du kWh** est la variable décisive. Prenez-le sur votre facture, pas de mémoire. En heures creuses à domicile, il se situe autour de 0,15 à 0,22 €. Sur une borne rapide d'autoroute, comptez 0,50 à 0,70 €. Si vous alternez, faites une moyenne pondérée : par exemple 80 % à domicile et 20 % en itinérance.

**La consommation électrique** varie fortement avec l'usage. Comptez 13 à 15 kWh/100 km pour une citadine en ville, 17 à 19 pour une compacte en usage mixte, 22 à 25 pour un SUV sur autoroute en hiver. La valeur WLTP est un plancher, pas une moyenne.

**La consommation essence** : prenez votre consommation réelle relevée à la pompe, pas celle du constructeur. L'écart est généralement de 15 à 25 %.

## Ce que ce calcul ne dit pas

Il compare l'énergie, et rien d'autre. Trois postes s'y ajoutent, et ils penchent tous du même côté :

- **L'entretien**, nettement plus faible en électrique : ni vidange, ni courroie, ni embrayage, et des plaquettes qui durent plus longtemps grâce au freinage régénératif.
- **La fiscalité et les aides**, variables selon votre situation et la date de livraison.
- **La décote**, la grande inconnue, et le seul poste qui peut jouer en défaveur de l'électrique selon les modèles.

Le prix d'achat n'entre pas non plus dans ce calcul : il se raisonne à part, en loyer mensuel ou en coût de détention total.

## Le bon réflexe

Faites le calcul deux fois. Une première avec votre prix du kWh à domicile, une seconde avec un prix de borne rapide. L'écart entre les deux résultats vous dira, bien mieux qu'un comparatif de modèles, si l'électrique est pertinent dans votre situation — et combien vaut, concrètement, une place de parking avec une prise.
