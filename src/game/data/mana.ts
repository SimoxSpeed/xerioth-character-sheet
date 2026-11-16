// Mana — fonte: Xerioth Master › Avanzamenti A71 (calcolo) e A108 (costo di lancio)

/**
 * T(s): numero corrispondente alla somma dei livelli degli incantesimi (indice = somma, 0–61).
 * Somme da −2 a 0 valgono 0.
 */
export const MANA_LEVEL_SUM_TABLE = [
  0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 65, 75, 85, 95, 105, 110, 120, 131, 143, 156, 170, 185, 201, 218, 235, 255, 275,
  296, 318, 341, 365, 390, 416, 443, 471, 500, 530, 561, 593, 626, 660, 695, 731, 768, 806, 845, 885, 926, 968, 1011,
  1055, 1100, 1146, 1193, 1241, 1290, 1340, 1391, 1443, 1496, 1550,
] as const

/**
 * Costo di lancio. Riga = "Bonus" (livello attuale 0–10), colonna = "Livello" di acquisizione (1–10).
 * Vale per incantesimi e miracoli (Mana e Punti Spirito).
 */
export const CAST_COST_TABLE: readonly (readonly number[])[] = [
  [5, 11, 18, 26, 35, 45, 56, 68, 81, 95],
  [6, 13, 21, 31, 42, 54, 67, 81, 97, 114],
  [7, 15, 25, 37, 50, 64, 80, 97, 116, 136],
  [8, 19, 31, 44, 60, 77, 96, 117, 139, 164],
  [10, 22, 37, 53, 72, 93, 116, 141, 167, 196],
  [12, 27, 44, 64, 87, 111, 139, 169, 201, 236],
  [14, 32, 53, 77, 104, 134, 167, 203, 241, 283],
  [17, 39, 64, 93, 125, 161, 200, 243, 290, 340],
  [21, 47, 77, 111, 150, 193, 240, 292, 300, 320],
  [25, 56, 92, 134, 180, 232, 288, 300, 320, 350],
  [30, 68, 111, 160, 216, 278, 346, 400, 450, 500],
]
