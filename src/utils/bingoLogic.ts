import type { BingoType } from "./bingoUtils";
import { numberToBingoFormat } from "./bingoUtils";
import type { BingoGrid } from "./bingo";

export const hasBingo = (
  card: BingoGrid,
  markedNumbers: Set<string>,
  bingoType: BingoType
): boolean => {
  const isMarked = (num: number): boolean => {
    if (num === 0) return true;
    return markedNumbers.has(numberToBingoFormat(num));
  };

  switch (bingoType) {
    case "horizontal": {
      for (let row = 0; row < 5; row++) {
        let allMarked = true;
        for (let col = 0; col < 5; col++) {
          if (!isMarked(card[row][col])) {
            allMarked = false;
            break;
          }
        }
        if (allMarked) return true;
      }
      return false;
    }

    case "vertical": {
      for (let col = 0; col < 5; col++) {
        let allMarked = true;
        for (let row = 0; row < 5; row++) {
          if (!isMarked(card[row][col])) {
            allMarked = false;
            break;
          }
        }
        if (allMarked) return true;
      }
      return false;
    }

    case "diagonal": {
      // Diagonal principal (de arriba-izquierda a abajo-derecha)
      let mainDiagonal = true;
      for (let i = 0; i < 5; i++) {
        if (!isMarked(card[i][i])) {
          mainDiagonal = false;
          break;
        }
      }
      if (mainDiagonal) return true;

      // Diagonal secundaria (de arriba-derecha a abajo-izquierda)
      let secondaryDiagonal = true;
      for (let i = 0; i < 5; i++) {
        if (!isMarked(card[i][4 - i])) {
          secondaryDiagonal = false;
          break;
        }
      }
      return secondaryDiagonal;
    }

    case "fourCorners": {
      return (
        isMarked(card[0][0]) &&
        isMarked(card[0][4]) &&
        isMarked(card[4][0]) &&
        isMarked(card[4][4])
      );
    }

    case "smallCross": {
      return (
        isMarked(card[1][2]) &&
        isMarked(card[3][2]) &&
        isMarked(card[2][1]) &&
        isMarked(card[2][3])
      );
    }

    case "fullCard": {
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (!isMarked(card[row][col])) {
            return false;
          }
        }
      }
      return true;
    }

    default:
      return false;
  }
};

// Función para obtener los números que forman parte del patrón de bingo
export const getBingoPatternNumbers = (
  card: BingoGrid,
  markedNumbers: Set<string>,
  bingoType: BingoType
): Set<string> => {
  const bingoNumbers = new Set<string>();
  const isMarked = (num: number): boolean => {
    if (num === 0) return true;
    return markedNumbers.has(numberToBingoFormat(num));
  };

  switch (bingoType) {
    case "horizontal": {
      for (let row = 0; row < 5; row++) {
        let allMarked = true;
        for (let col = 0; col < 5; col++) {
          if (!isMarked(card[row][col])) {
            allMarked = false;
            break;
          }
        }
        if (allMarked) {
          // Esta fila completa forma el bingo
          for (let col = 0; col < 5; col++) {
            const num = card[row][col];
            if (num !== 0) {
              bingoNumbers.add(numberToBingoFormat(num));
            }
          }
          return bingoNumbers;
        }
      }
      return bingoNumbers;
    }

    case "vertical": {
      for (let col = 0; col < 5; col++) {
        let allMarked = true;
        for (let row = 0; row < 5; row++) {
          if (!isMarked(card[row][col])) {
            allMarked = false;
            break;
          }
        }
        if (allMarked) {
          // Esta columna completa forma el bingo
          for (let row = 0; row < 5; row++) {
            const num = card[row][col];
            if (num !== 0) {
              bingoNumbers.add(numberToBingoFormat(num));
            }
          }
          return bingoNumbers;
        }
      }
      return bingoNumbers;
    }

    case "diagonal": {
      // Diagonal principal (de arriba-izquierda a abajo-derecha)
      let mainDiagonal = true;
      const mainDiagNumbers: string[] = [];
      for (let i = 0; i < 5; i++) {
        const num = card[i][i];
        if (!isMarked(num)) {
          mainDiagonal = false;
          break;
        }
        if (num !== 0) {
          mainDiagNumbers.push(numberToBingoFormat(num));
        }
      }
      if (mainDiagonal) {
        mainDiagNumbers.forEach(n => bingoNumbers.add(n));
        return bingoNumbers;
      }

      // Diagonal secundaria (de arriba-derecha a abajo-izquierda)
      let secondaryDiagonal = true;
      const secDiagNumbers: string[] = [];
      for (let i = 0; i < 5; i++) {
        const num = card[i][4 - i];
        if (!isMarked(num)) {
          secondaryDiagonal = false;
          break;
        }
        if (num !== 0) {
          secDiagNumbers.push(numberToBingoFormat(num));
        }
      }
      if (secondaryDiagonal) {
        secDiagNumbers.forEach(n => bingoNumbers.add(n));
      }
      return bingoNumbers;
    }

    case "fourCorners": {
      const corners = [[0, 0], [0, 4], [4, 0], [4, 4]];
      corners.forEach(([row, col]) => {
        const num = card[row][col];
        if (num !== 0) {
          bingoNumbers.add(numberToBingoFormat(num));
        }
      });
      return bingoNumbers;
    }

    case "smallCross": {
      const crossPositions = [[1, 2], [3, 2], [2, 1], [2, 3]];
      crossPositions.forEach(([row, col]) => {
        const num = card[row][col];
        if (num !== 0) {
          bingoNumbers.add(numberToBingoFormat(num));
        }
      });
      return bingoNumbers;
    }

    case "fullCard": {
      // Todos los números marcados forman el bingo
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const num = card[row][col];
          if (num !== 0 && isMarked(num)) {
            bingoNumbers.add(numberToBingoFormat(num));
          }
        }
      }
      return bingoNumbers;
    }

    default:
      return bingoNumbers;
  }
};

