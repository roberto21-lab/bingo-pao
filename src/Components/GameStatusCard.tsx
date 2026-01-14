import { Box, Stack, Typography } from "@mui/material";
import CurrentNumberDisplay from "./CurrentNumberDisplay";
import CalledNumbersModal from "./CalledNumbersModal";
import { useState } from "react";

type GameStatusCardProps = {
  currentRound: number;
  totalRounds: number;
  lastNumbers: string[];
  currentNumber: string;
  calledNumbers?: Set<string>; // Todos los números llamados para el modal
  progress?: number;
  countdown?: number;
  isFinished?: boolean;
  timeoutCountdown?: number | null;
  roundTransitionCountdown?: number | null;
  nextRoundNumber?: number | null;
  roomStartCountdown?: number | null;
  roomScheduledAt?: Date | null;
  roomFinished?: boolean; // Si la sala está finalizada (no hay más rondas)
  bingoClaimCountdown?: number | null; // Countdown de ventana de bingo (45, 44, 43, ...)
  isCallingNumber?: boolean; // Si se están llamando números actualmente
  isGameStarting?: boolean; // Si el juego está iniciando (después de round-started pero antes del primer número)
};

export default function GameStatusCard({
  currentRound,
  totalRounds,
  lastNumbers,
  currentNumber,
  calledNumbers = new Set(),
  progress,
  countdown,
  isFinished = false,
  timeoutCountdown = null,
  roundTransitionCountdown = null,
  nextRoundNumber = null,
  roomStartCountdown = null,
  roomScheduledAt = null,
  roomFinished = false,
  bingoClaimCountdown = null,
  isCallingNumber = false,
  isGameStarting = false,
}: GameStatusCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Box
      className="glass-effect"
      sx={{
        background: "rgba(31, 19, 9, 0.6)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderRadius: "20px",
        border: "2px solid rgba(212, 175, 55, 0.3)",
        p: 3,
        mb: 3,
        position: "relative",
        overflow: "hidden",
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.6),
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          inset 0 -1px 0 rgba(0, 0, 0, 0.2),
          0 0 0 1px rgba(212, 175, 55, 0.1) inset
        `,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent)",
          zIndex: 1,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse 300px 200px at 20% 30%, rgba(0, 0, 0, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 250px 180px at 80% 60%, rgba(0, 0, 0, 0.08) 0%, transparent 50%)
          `,
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} sx={{ position: "relative", zIndex: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            sx={{
              display: "inline-block",
              px: 1.5,
              py: roomFinished ? 1 : (currentRound === totalRounds ? 1 : 0.5),
              borderRadius: "12px",
              background: roomFinished
                ? "linear-gradient(135deg, rgba(76, 175, 80, 0.5) 0%, rgba(129, 199, 132, 0.4) 100%)"
                : currentRound === totalRounds
                ? "linear-gradient(135deg, rgba(212, 175, 55, 0.5) 0%, rgba(244, 208, 63, 0.4) 100%)"
                : "linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(244, 208, 63, 0.2) 100%)",
              border: roomFinished
                ? "2px solid rgba(76, 175, 80, 0.7)"
                : currentRound === totalRounds
                ? "2px solid rgba(212, 175, 55, 0.7)"
                : "1px solid rgba(212, 175, 55, 0.4)",
              boxShadow: roomFinished
                ? "0 4px 12px rgba(76, 175, 80, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                : currentRound === totalRounds
                ? "0 4px 12px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                : "0 2px 8px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: roomFinished ? "#1a1008" : (currentRound === totalRounds ? "#1a1008" : "#f5e6d3"),
                fontSize: roomFinished ? "15px" : "14px",
                fontWeight: 700,
                textShadow: roomFinished || currentRound === totalRounds
                  ? "0 1px 2px rgba(255, 255, 255, 0.5)"
                  : "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              {roomFinished ? "🏆 Juego Finalizado" : `Ronda: ${currentRound}/${totalRounds}`}
            </Typography>
          </Box>
          {!roomFinished && (
            <Box
              sx={{
                display: "inline-block",
                px: 1,
                py: 0.3,
                borderRadius: "8px",
                background: isFinished 
                  ? "rgba(76, 175, 80, 0.2)" 
                  : timeoutCountdown !== null 
                  ? "rgba(255, 152, 0, 0.2)" 
                  : "rgba(212, 175, 55, 0.2)",
                border: `1px solid ${isFinished ? "rgba(76, 175, 80, 0.4)" : timeoutCountdown !== null ? "rgba(255, 152, 0, 0.4)" : "rgba(212, 175, 55, 0.4)"}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: isFinished ? "#4caf50" : timeoutCountdown !== null ? "#ff9800" : "#d4af37",
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                }}
              >
                {isFinished 
                  ? "✓ Finalizada" 
                  : timeoutCountdown !== null 
                  ? `⏱️ ${timeoutCountdown}s`
                  : "▶ En progreso"}
              </Typography>
            </Box>
          )}
        </Box>
        {/* Ocultar "Últimos Números" cuando la sala está finalizada */}
        {!roomFinished && (
          <Box
            onClick={() => {
              if (calledNumbers.size > 0) {
                setModalOpen(true);
              }
            }}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: "12px",
              background: "rgba(26, 16, 8, 0.4)",
              border: "1px solid rgba(212, 175, 55, 0.2)",
              backdropFilter: "blur(10px)",
              cursor: calledNumbers.size > 0 ? "pointer" : "default",
              transition: "all 0.2s ease",
              "&:hover": calledNumbers.size > 0
                ? {
                    background: "rgba(26, 16, 8, 0.6)",
                    border: "1px solid rgba(212, 175, 55, 0.4)",
                    transform: "scale(1.02)",
                  }
                : {},
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#f5e6d3",
                fontSize: "11px",
                opacity: 0.9,
                mb: 0.5,
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              }}
            >
              Últimos Números:
              <br />
              {calledNumbers.size > 0 && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: "9px",
                    ml: 0.5,
                    opacity: 0.7,
                    fontStyle: "italic",
                  }}
                >
                  (click para ver todos)
                </Typography>
              )}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#d4af37",
                fontSize: "13px",
                fontWeight: 700,
                textShadow: "0 1px 3px rgba(212, 175, 55, 0.5)",
              }}
            >
              {lastNumbers.length > 0 ? lastNumbers.join(", ") : "—"}
            </Typography>
          </Box>
        )}
      </Stack>

      <CurrentNumberDisplay 
        currentNumber={currentNumber} 
        progress={progress}
        countdown={countdown}
        isFinished={isFinished}
        timeoutCountdown={timeoutCountdown}
        roundTransitionCountdown={roundTransitionCountdown}
        nextRoundNumber={nextRoundNumber}
        roomStartCountdown={roomStartCountdown}
        roomScheduledAt={roomScheduledAt}
        roomFinished={roomFinished}
        bingoClaimCountdown={bingoClaimCountdown}
        isCallingNumber={isCallingNumber}
        isGameStarting={isGameStarting}
      />

      <CalledNumbersModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        calledNumbers={calledNumbers}
        currentRound={currentRound}
        totalRounds={totalRounds}
      />
    </Box>
  );
}

