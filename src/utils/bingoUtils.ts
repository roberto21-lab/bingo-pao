export type BingoType = "horizontal" | "vertical" | "diagonal" | "fourCorners" | "smallCross" | "fullCard";

export const numberToBingoFormat = (num: number): string => {
  if (num === 0) return "FREE";
  if (num >= 1 && num <= 15) return `B-${num}`;
  if (num >= 16 && num <= 30) return `I-${num}`;
  if (num >= 31 && num <= 45) return `N-${num}`;
  if (num >= 46 && num <= 60) return `G-${num}`;
  if (num >= 61 && num <= 75) return `O-${num}`;
  return "";
};

export const getBingoTypeName = (type: BingoType): string => {
  switch (type) {
    case "horizontal":
      return "Línea Horizontal";
    case "vertical":
      return "Línea Vertical";
    case "diagonal":
      return "Línea Diagonal";
    case "fourCorners":
      return "4 Esquinas";
    case "smallCross":
      return "Cruz Pequeña";
    case "fullCard":
      return "Cartón Lleno";
    default:
      return "Cartón Lleno";
  }
};

export const calculateRoundPrizes = (totalPot: number, totalRounds: number): number[] => {
  if (totalRounds === 3) {
    return [
      totalPot * 0.2,
      totalPot * 0.3,
      totalPot * 0.6,
    ];
  }
  const percentages = [0.2, 0.3, 0.5];
  return percentages.slice(0, totalRounds).map((p) => totalPot * p);
};

