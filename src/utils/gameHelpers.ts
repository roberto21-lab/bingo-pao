// import type { BingoGrid } from "./bingo";

/**
 * Convierte números de cartón de formato con "FREE" a formato numérico
 * @param numbers Array de números que puede incluir "FREE"
 * @returns Array de números donde "FREE" se convierte a 0
 */
export function convertCardNumbers(numbers: (number | "FREE")[][]): number[][] {
  return numbers.map((row) => row.map((num) => (num === "FREE" ? 0 : num)));
}

/**
 * Factory function para crear getMarkedForCard
 * @param markedNumbers Map de números marcados por índice de cartón
 * @returns Función que retorna los números marcados para un cartón específico
 */
export function createGetMarkedForCard(
  markedNumbers: Map<number, Set<string>>
) {
  return (cardIndex: number): Set<string> => {
    return markedNumbers.get(cardIndex) || new Set();
  };
}
