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

