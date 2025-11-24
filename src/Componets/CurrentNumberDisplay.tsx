import { Box, Typography } from "@mui/material";

type CurrentNumberDisplayProps = {
  currentNumber: string;
  progress?: number; // 0 a 100
  countdown?: number; // 5, 4, 3, 2, 1
  isFinished?: boolean; // Si el round está finalizado
  timeoutCountdown?: number | null; // Countdown de timeout (10, 9, 8, ...)
  roundTransitionCountdown?: number | null; // Countdown de transición entre rondas (15, 14, 13, ...)
  nextRoundNumber?: number | null; // Número de la siguiente ronda
  roomStartCountdown?: number | null; // Countdown de inicio de sala (45, 44, 43, ...)
  roomScheduledAt?: Date | null; // Fecha programada de inicio de la sala
  timeUntilStart?: number | null; // Tiempo restante hasta el inicio en segundos
  roomFinished?: boolean; // Si la sala está finalizada (no hay más rondas)
  bingoClaimCountdown?: number | null; // Countdown de ventana de bingo (45, 44, 43, ...)
  isCallingNumber?: boolean; // Si se están llamando números actualmente
  isGameStarting?: boolean; // Si el juego está iniciando (después de round-started pero antes del primer número)
};

export default function CurrentNumberDisplay({ 
  currentNumber, 
  progress = 0,
  countdown,
  isFinished = false,
  timeoutCountdown = null,
  roundTransitionCountdown = null,
  nextRoundNumber = null,
  roomStartCountdown = null,
  roomScheduledAt = null,
  timeUntilStart = null,
  roomFinished = false,
  bingoClaimCountdown = null,
  isCallingNumber = false,
  isGameStarting = false,
}: CurrentNumberDisplayProps) {
  const size = 120;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          position: "relative",
          width: `${size}px`,
          height: `${size}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* SVG para el progress bar circular */}
        <svg
          width={size}
          height={size}
          style={{ position: "absolute", transform: "rotate(-90deg)" }}
        >
          {/* Círculo de fondo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(227, 191, 112, 0.2)"
            strokeWidth={strokeWidth}
          />
          {/* Círculo de progreso - Efecto dorado metalizado */}
          {progress > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#goldGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 0.1s linear",
                filter: "drop-shadow(0 0 4px rgba(212, 175, 55, 0.6))",
              }}
            />
          )}
          {/* Gradiente dorado para el progress bar */}
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="30%" stopColor="#f4d03f" />
              <stop offset="50%" stopColor="#ffd700" />
              <stop offset="70%" stopColor="#f4d03f" />
              <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
          </defs>
        </svg>

        {/* Contenido del círculo - Efecto de vidrio desgastado con borde dorado */}
        <Box
          sx={{
            width: `${size - strokeWidth * 2}px`,
            height: `${size - strokeWidth * 2}px`,
            borderRadius: "50%",
            border: "3px solid rgba(212, 175, 55, 0.6)",
            background: `
              radial-gradient(circle at 30% 30%, rgba(212, 175, 55, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(244, 208, 63, 0.25) 0%, transparent 50%),
              linear-gradient(135deg, rgba(26, 16, 8, 0.7) 0%, rgba(31, 19, 9, 0.75) 50%, rgba(26, 16, 8, 0.7) 100%)
            `,
            backdropFilter: "blur(15px) saturate(150%)",
            WebkitBackdropFilter: "blur(15px) saturate(150%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.7),
              inset 0 2px 6px rgba(255, 255, 255, 0.15),
              inset 0 -2px 6px rgba(0, 0, 0, 0.4),
              0 0 16px rgba(212, 175, 55, 0.2)
            `,
            position: "relative",
            zIndex: 1,
            "&::before": {
              content: '""',
              position: "absolute",
              top: "10%",
              left: "15%",
              width: "30%",
              height: "25%",
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(0, 0, 0, 0.25) 0%, transparent 70%)",
              pointerEvents: "none",
              zIndex: 0,
            },
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: "50%",
              background: `
                radial-gradient(ellipse 80px 60px at 25% 30%, rgba(0, 0, 0, 0.2) 0%, transparent 50%),
                radial-gradient(ellipse 60px 50px at 75% 60%, rgba(0, 0, 0, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse 100px 80px at 50% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 60%)
              `,
              pointerEvents: "none",
              zIndex: 0,
            },
          }}
        >
        {roomStartCountdown !== null && roomStartCountdown > 0 ? (
          <Box sx={{ textAlign: "center", position: "relative", zIndex: 2 }}>
            <Typography
              sx={{
                fontSize: "48px",
                fontWeight: 900,
                background: roomStartCountdown <= 10 
                  ? "linear-gradient(135deg, #ff9800, #ffb74d, #ff9800)"
                  : "linear-gradient(135deg, #2196f3, #42a5f5, #2196f3)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                fontFamily: "'Montserrat', sans-serif",
                animation: roomStartCountdown <= 10 ? "pulse 0.5s infinite" : "none",
                "@keyframes pulse": {
                  "0%, 100%": { transform: "scale(1)" },
                  "50%": { transform: "scale(1.15)" },
                },
                mb: 0.5,
              }}
            >
              {roomStartCountdown}
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#d4af37",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Iniciando juego...
            </Typography>
          </Box>
        ) : bingoClaimCountdown !== null && bingoClaimCountdown > 0 ? (
          <Box sx={{ textAlign: "center", position: "relative", zIndex: 2 }}>
            <Typography
              sx={{
                fontSize: "48px",
                fontWeight: 900,
                background: bingoClaimCountdown <= 10 
                  ? "linear-gradient(135deg, #ff9800, #ffb74d, #ff9800)"
                  : "linear-gradient(135deg, #4caf50, #66bb6a, #4caf50)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                fontFamily: "'Montserrat', sans-serif",
                animation: bingoClaimCountdown <= 10 ? "pulse 0.5s infinite" : "none",
                "@keyframes pulse": {
                  "0%, 100%": { transform: "scale(1)" },
                  "50%": { transform: "scale(1.15)" },
                },
                mb: 0.5,
              }}
            >
              {bingoClaimCountdown}
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#d4af37",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Otros pueden cantar bingo...
            </Typography>
          </Box>
        ) : isGameStarting ? (
          <Box sx={{ textAlign: "center", position: "relative", zIndex: 2 }}>
            <Typography
              sx={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#d4af37",
                textShadow: "0 2px 6px rgba(0, 0, 0, 0.5)",
                fontFamily: "'Montserrat', sans-serif",
                mb: 0.5,
                animation: "pulse 1s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.7 },
                },
              }}
            >
              Iniciando juego...
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#f5e6d3",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                fontFamily: "'Montserrat', sans-serif",
                opacity: 0.8,
              }}
            >
              Preparando números...
            </Typography>
          </Box>
        ) : roomScheduledAt && currentNumber === "" && !isFinished && !isCallingNumber && roomStartCountdown === null && timeUntilStart !== null && timeUntilStart > 0 ? (
          <Box sx={{ textAlign: "center", position: "relative", zIndex: 2 }}>
            <Typography
              sx={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#d4af37",
                textShadow: "0 2px 6px rgba(0, 0, 0, 0.5)",
                fontFamily: "'Montserrat', sans-serif",
                mb: 0.5,
              }}
            >
              Esperando inicio
            </Typography>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#f5e6d3",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                fontFamily: "'Montserrat', sans-serif",
                opacity: 0.8,
              }}
            >
              {(() => {
                // Usar el tiempo restante calculado desde el componente padre (sincronizado con servidor)
                const timeRemaining = timeUntilStart;
                
                if (timeRemaining > 0) {
                  const hours = Math.floor(timeRemaining / 3600);
                  const minutes = Math.floor((timeRemaining % 3600) / 60);
                  const seconds = timeRemaining % 60;
                  
                  if (hours > 0) {
                    return `Inicia en ${hours}h ${minutes}m ${seconds}s`;
                  } else if (minutes > 0) {
                    return `Inicia en ${minutes}m ${seconds}s`;
                  } else {
                    return `Inicia en ${seconds}s`;
                  }
                }
                return "Iniciando...";
              })()}
            </Typography>
          </Box>
        ) : roundTransitionCountdown !== null && roundTransitionCountdown > 0 ? (
          <Box sx={{ textAlign: "center", position: "relative", zIndex: 2 }}>
            <Typography
              sx={{
                fontSize: "48px",
                fontWeight: 900,
                background: roundTransitionCountdown <= 3 
                  ? "linear-gradient(135deg, #4caf50, #66bb6a, #4caf50)"
                  : "linear-gradient(135deg, #2196f3, #42a5f5, #2196f3)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                fontFamily: "'Montserrat', sans-serif",
                animation: roundTransitionCountdown <= 3 ? "pulse 0.5s infinite" : "none",
                "@keyframes pulse": {
                  "0%, 100%": { transform: "scale(1)" },
                  "50%": { transform: "scale(1.15)" },
                },
                mb: 0.5,
              }}
            >
              {roundTransitionCountdown}
            </Typography>
            {nextRoundNumber && (
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#d4af37",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                Ronda {nextRoundNumber}
              </Typography>
            )}
          </Box>
        ) : isFinished ? (
          <Typography
            sx={{
              fontSize: roomFinished ? "16px" : "20px",
              fontWeight: 900,
              color: "#4caf50",
              textShadow: "0 2px 6px rgba(0, 0, 0, 0.5), 0 0 8px rgba(76, 175, 80, 0.4)",
              fontFamily: "'Montserrat', sans-serif",
              textAlign: "center",
              position: "relative",
              zIndex: 2,
              lineHeight: 1.2,
              padding: "0 8px",
            }}
          >
            {roomFinished ? "Partida Finalizada" : "Finalizado"}
          </Typography>
        ) : timeoutCountdown !== null && timeoutCountdown > 0 ? (
          <Typography
            sx={{
              fontSize: "48px",
              fontWeight: 900,
              background: timeoutCountdown <= 3 
                ? "linear-gradient(135deg, #f44336, #ff6b6b, #f44336)"
                : "linear-gradient(135deg, #ff9800, #ffb74d, #ff9800)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
              fontFamily: "'Montserrat', sans-serif",
              textAlign: "center",
              position: "relative",
              zIndex: 2,
              animation: timeoutCountdown <= 3 ? "pulse 0.5s infinite" : "none",
              "@keyframes pulse": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.15)" },
              },
            }}
          >
            {timeoutCountdown}
          </Typography>
        ) : countdown !== undefined && countdown > 0 ? (
            <Typography
              sx={{
                fontSize: "48px",
                fontWeight: 900,
                background: "linear-gradient(135deg, #d4af37, #f4d03f, #ffd700, #f4d03f, #d4af37)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 8px rgba(212, 175, 55, 0.5)",
                fontFamily: "'Montserrat', sans-serif",
                position: "relative",
                zIndex: 2,
                animation: countdown > 0 ? "pulse 0.5s ease-in-out" : "none",
                "@keyframes pulse": {
                  "0%, 100%": { transform: "scale(1)" },
                  "50%": { transform: "scale(1.1)" },
                },
              }}
            >
              {countdown}
            </Typography>
          ) : (
            <Typography
              sx={{
                fontSize: "36px",
                fontWeight: 900,
                background: currentNumber 
                  ? "linear-gradient(135deg, #d4af37, #f4d03f, #ffd700, #f4d03f, #d4af37)"
                  : "linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(244, 208, 63, 0.3))",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: currentNumber ? "transparent" : "rgba(212, 175, 55, 0.4)",
                textShadow: currentNumber ? "0 2px 8px rgba(212, 175, 55, 0.6)" : "none",
                fontFamily: "'Montserrat', sans-serif",
                position: "relative",
                zIndex: 2,
              }}
            >
              {currentNumber || "—"}
            </Typography>
          )}
        </Box>
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: "#f5e6d3",
          fontSize: "12px",
          opacity: 0.9,
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
          fontWeight: 500,
        }}
      >
        {roomStartCountdown !== null && roomStartCountdown > 0
          ? `Iniciando en ${roomStartCountdown}s`
          : bingoClaimCountdown !== null && bingoClaimCountdown > 0
          ? `Otros pueden cantar bingo: ${bingoClaimCountdown}s`
          : roomScheduledAt && currentNumber === "" && !isFinished
          ? "Esperando inicio del juego"
          : roundTransitionCountdown !== null && roundTransitionCountdown > 0
          ? `Próxima ronda en ${roundTransitionCountdown}s`
          : isFinished
          ? (roomFinished ? "Partida Finalizada" : "Ronda Finalizada")
          : timeoutCountdown !== null && timeoutCountdown > 0
          ? `Tiempo restante: ${timeoutCountdown}s`
          : countdown !== undefined && countdown > 0 
          ? "Iniciando ronda..." 
          : "Número Actual Llamado"}
      </Typography>
    </Box>
  );
}

