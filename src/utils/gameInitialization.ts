import type { BingoGrid } from "./bingo";
import type { BingoType } from "./bingoUtils";
import { numberToBingoFormat } from "./bingoUtils";

export const initializeGameData = (
  playerCards: BingoGrid[],
  currentRound: number,
  roundBingoTypes: BingoType[]
) => {
  if (playerCards.length === 0) {
    return { calledNumbers: new Set<string>(), markedNumbers: new Map<number, Set<string>>() };
  }

  const firstCard = playerCards[0];
  const numbers = new Set<string>(["B-7", "G-53", "I-28", "N-41", "B-3", "I-22", "N-35", "G-50", "O-65"]);
  const firstRowMarked = new Set<string>();
  const bingoType = roundBingoTypes[currentRound - 1] || "fullCard";

  if (bingoType === "horizontal") {
    for (let col = 0; col < 5; col++) {
      const num = firstCard[0][col];
      if (num !== 0) {
        const numFormat = numberToBingoFormat(num);
        numbers.add(numFormat);
        firstRowMarked.add(numFormat);
      }
    }
  } else if (bingoType === "vertical") {
    for (let row = 0; row < 5; row++) {
      const num = firstCard[row][0];
      if (num !== 0) {
        const numFormat = numberToBingoFormat(num);
        numbers.add(numFormat);
        firstRowMarked.add(numFormat);
      }
    }
  } else if (bingoType === "fourCorners") {
    const corners = [[0, 0], [0, 4], [4, 0], [4, 4]];
    corners.forEach(([row, col]) => {
      const num = firstCard[row][col];
      if (num !== 0) {
        const numFormat = numberToBingoFormat(num);
        numbers.add(numFormat);
        firstRowMarked.add(numFormat);
      }
    });
  } else if (bingoType === "smallCross") {
    const crossPositions = [[1, 2], [3, 2], [2, 1], [2, 3]];
    crossPositions.forEach(([row, col]) => {
      const num = firstCard[row][col];
      if (num !== 0) {
        const numFormat = numberToBingoFormat(num);
        numbers.add(numFormat);
        firstRowMarked.add(numFormat);
      }
    });
  } else {
    for (let col = 0; col < 5; col++) {
      const num = firstCard[0][col];
      if (num !== 0) {
        const numFormat = numberToBingoFormat(num);
        numbers.add(numFormat);
        firstRowMarked.add(numFormat);
      }
    }
  }

  const markedMap = new Map<number, Set<string>>();
  markedMap.set(0, firstRowMarked);

  return { calledNumbers: numbers, markedNumbers: markedMap };
};

