import type { BingoType } from "./bingoUtils";

/**
 * Mapea un nombre de patrón del backend a un tipo de bingo del frontend
 */
export function mapPatternToBingoType(patternName?: string): BingoType {
  switch (patternName) {
    case "horizontal":
      return "horizontal";
    case "vertical":
      return "vertical";
    case "diagonal":
      return "diagonal";
    case "cross_small":
      return "smallCross";
    case "cross_big":
      console.warn(`[patternMapper] Pattern "cross_big" no tiene equivalente directo en BingoType, usando "smallCross"`);
      return "smallCross";
    case "full":
      return "fullCard";
    default:
      console.warn(`[patternMapper] Pattern desconocido: "${patternName}", usando "horizontal" como fallback`);
      return "horizontal";
  }
}

