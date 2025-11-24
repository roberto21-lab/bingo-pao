import { Box, Typography, Chip } from "@mui/material";
import type { BingoType } from "../utils/bingoUtils";
import { getBingoTypeName } from "../utils/bingoUtils";

type GameHeaderProps = {
  currentRound: number;
  currentRoundPrize: number;
  currentBingoType: BingoType;
  isGameActive?: boolean;
  roomName?: string;
  roomFinished?: boolean; // Si la sala está finalizada
  totalPrize?: number; // Premio total de todas las rondas (cuando roomFinished es true)
};

export default function GameHeader({
  currentRound,
  currentRoundPrize,
  currentBingoType,
  isGameActive = true,
  roomName = "Juego en Progreso",
  roomFinished = false,
  totalPrize = 0,
}: GameHeaderProps) {
  return (
    <>
      {isGameActive && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 1,
            mt: "0",
          }}
        >
          <Chip
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#f44336",
                  boxShadow: "0 0 8px rgba(244, 67, 54, 0.8)",
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%, 100%": {
                      opacity: 1,
                      transform: "scale(1)",
                    },
                    "50%": {
                      opacity: 0.7,
                      transform: "scale(1.2)",
                    },
                  },
                }}
              />
            }
            label="En Vivo"
            size="small"
            sx={{
              backgroundColor: "rgba(76, 175, 80, 0.15)",
              color: "#f44336",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              fontWeight: 600,
              fontSize: "0.75rem",
              "& .MuiChip-icon": {
                marginLeft: 1,
              },
            }}
          />
        </Box>
      )}

      <Typography
        variant="h4"
        sx={{
          textAlign: "left",
          fontSize: { xs: "24px", sm: "28px" },
          fontWeight: 900,
          background: "linear-gradient(135deg, #d4af37, #f4d03f, #ffd700, #f4d03f, #d4af37)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          mb: 3,
          mt: "4rem",
          fontFamily: "'Montserrat', sans-serif",
          textShadow: "0 2px 8px rgba(212, 175, 55, 0.4)",
          position: "relative",
        }}
      >
        {roomName}
      </Typography>

      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 32,
          display: "inline-flex",
          alignItems: "center",
          px: 2,
          py: 1,
          borderTopRightRadius: "8px",
          borderBottomRightRadius: "8px",
          background: "linear-gradient(135deg, rgba(212, 175, 55, 0.9) 0%, rgba(244, 208, 63, 1) 50%, rgba(212, 175, 55, 0.9) 100%)",
          border: "1.5px solid rgba(212, 175, 55, 1)",
          borderLeft: "none",
          boxShadow: "0 2px 8px rgba(212, 175, 55, 0.5)",
          zIndex: 2,
          mb: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontSize: { xs: "18px", sm: "22px" },
            fontWeight: 700,
            color: "#1a1008",
            fontFamily: "'Montserrat', sans-serif",
            letterSpacing: "0.5px",
          }}
        >
          {roomFinished 
            ? `Total Premio Entregado: $${totalPrize.toLocaleString("es-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`
            : `Premio Ronda ${currentRound}: $${currentRoundPrize.toLocaleString("es-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`}
        </Typography>
      </Box>

      {!roomFinished && (
        <>
          {currentRound <= 2 ? (
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
          ) : (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
                px: 2,
                py: 1,
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(244, 208, 63, 0.4) 50%, rgba(212, 175, 55, 0.3) 100%)",
                border: "2px solid rgba(212, 175, 55, 0.6)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 4px 16px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                animation: "pulse 2s infinite",
                "@keyframes pulse": {
                  "0%, 100%": {
                    boxShadow: "0 4px 16px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                  },
                  "50%": {
                    boxShadow: "0 6px 20px rgba(212, 175, 55, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                  },
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "16px", sm: "18px" },
                  fontWeight: 900,
                  color: "#1a1008",
                  textAlign: "center",
                  fontFamily: "'Montserrat', sans-serif",
                  textShadow: "0 1px 3px rgba(255, 255, 255, 0.5)",
                  letterSpacing: "0.5px",
                }}
              >
                🎯 CARTÓN LLENO
              </Typography>
            </Box>
          )}
        </>
      )}
    </>
  );
}

