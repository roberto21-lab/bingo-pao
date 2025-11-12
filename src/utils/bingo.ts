// src/utils/bingo.ts
export type BingoGrid = number[][]; // 5x5, 0 = FREE

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Genera un cartón válido: B(1–15), I(16–30), N(31–45), G(46–60), O(61–75)
export function generateCard(): BingoGrid {
  const columns = [
    shuffle(range(15).map((i) => i + 1)).slice(0, 5),      // B
    shuffle(range(15).map((i) => i + 16)).slice(0, 5),     // I
    shuffle(range(15).map((i) => i + 31)).slice(0, 5),     // N
    shuffle(range(15).map((i) => i + 46)).slice(0, 5),     // G
    shuffle(range(15).map((i) => i + 61)).slice(0, 5),     // O
  ];
  // Transponer columnas → filas
  const grid: BingoGrid = range(5).map((r) => range(5).map((c) => columns[c][r]));
  // Centro FREE
  grid[2][2] = 0;
  return grid;
}

export function generateCards(count: number): BingoGrid[] {
  return Array.from({ length: count }, () => generateCard());
}
