import { Box, Typography } from "@mui/material";
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
          fontSize: { xs: "24px", sm: "28px" },
          fontWeight: 900,
          background: "linear-gradient(135deg, #d4af37, #f4d03f, #ffd700, #f4d03f, #d4af37)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          mb: 3,
          fontFamily: "'Montserrat', sans-serif",
          textShadow: "0 2px 8px rgba(212, 175, 55, 0.4)",
          position: "relative",
        }}
      >
        Juego en Progreso
      </Typography>

      {/* Badge tipo moneda para el premio */}
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
          px: 2.5,
          py: 1,
          borderRadius: "20px",
          background: "linear-gradient(135deg, #d4af37 0%, #f4d03f 30%, #ffd700 50%, #f4d03f 70%, #d4af37 100%)",
          backgroundSize: "200% 200%",
          animation: "shimmer 3s ease-in-out infinite",
          boxShadow: `
            0 4px 15px rgba(212, 175, 55, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2),
            0 0 0 2px rgba(212, 175, 55, 0.3)
          `,
          border: "2px solid rgba(212, 175, 55, 0.6)",
          position: "relative",
          "@keyframes shimmer": {
            "0%, 100%": { backgroundPosition: "0% 50%" },
            "50%": { backgroundPosition: "100% 50%" },
          },
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontSize: { xs: "18px", sm: "22px" },
            fontWeight: 900,
            color: "#1a1008",
            textAlign: "center",
            fontFamily: "'Montserrat', sans-serif",
            textShadow: "0 1px 2px rgba(255, 255, 255, 0.3)",
          }}
        >
          Premio Ronda {currentRound}: ${currentRoundPrize.toLocaleString("es-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </Typography>
      </Box>

      {currentRound <= 2 && (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
            px: 1.5,
            py: 0.5,
            borderRadius: "12px",
            background: "rgba(26, 16, 8, 0.5)",
            border: "1px solid rgba(212, 175, 55, 0.4)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: "14px", sm: "16px" },
              fontWeight: 700,
              color: "#d4af37",
              textAlign: "center",
              fontFamily: "'Montserrat', sans-serif",
              textShadow: "0 1px 3px rgba(212, 175, 55, 0.5)",
            }}
          >
            Modo: {getBingoTypeName(currentBingoType)}
          </Typography>
        </Box>
      )}
    </>
  );
}

