'use strict';
// ===== Poser sur les planchers : plateformes à balustrade, terrasses en planches, pontons, tapis.
// On y pose meubles et déco comme par terre ; E / X visent d'abord ce qui est posé dessus, à la hauteur où l'on se tient. =====
(function () {
  const A = G.act;
  const at = (k, fn) => function () { const p = G.player, sv = G[k]; G[k] = p ? p.y : null; try { return fn.apply(this, arguments); } finally { G[k] = sv; } };
  A.placeObj = at('_deckY', A.placeObj);
  A.interact = at('_deckPick', A.interact);
  A.take = at('_deckPick', A.take);
})();
