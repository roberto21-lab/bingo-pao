import { Typography } from "@mui/material";
import type { BingoType } from "../utils/bingoUtils";
import { getBingoTypeName } from "../utils/bingoUtils";

type GameHeaderProps = {
  currentRound: number;
  currentRoundPrize: number;
  currentBingoType: BingoType;
};

export default function GameHeader({
  currentRound,
  currentRoundPrize,
  currentBingoType,
}: GameHeaderProps) {
  return (
    <>
      <Typography
        variant="h4"
        sx={{
          marginTop: "3rem",
          textAlign: "center",
          fontSize: { xs: "22px", sm: "26px" },
          fontWeight: 700,
          color: "#ffffff",
          mb: 3,
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        Juego en Progreso
      </Typography>

      <Typography
        variant="h5"
        sx={{
          fontSize: { xs: "20px", sm: "24px" },
          fontWeight: 900,
          color: "#e3bf70",
          mb: 1,
          textAlign: "center",
          fontFamily: "'Montserrat', sans-serif",
          textShadow: "0 2px 8px rgba(227, 191, 112, 0.5)",
        }}
      >
        Premio Ronda {currentRound}: ${currentRoundPrize.toLocaleString("es-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </Typography>

      {currentRound <= 2 && (
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: "16px", sm: "18px" },
            fontWeight: 700,
            color: "#e3bf70",
            mb: 3,
            textAlign: "center",
            fontFamily: "'Montserrat', sans-serif",
            textShadow: "0 2px 6px rgba(227, 191, 112, 0.4)",
            opacity: 0.9,
          }}
        >
          Modo: {getBingoTypeName(currentBingoType)}
        </Typography>
      )}
    </>
  );
}

