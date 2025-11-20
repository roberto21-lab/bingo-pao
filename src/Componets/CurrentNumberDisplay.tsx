import { Box, Typography } from "@mui/material";

type CurrentNumberDisplayProps = {
  currentNumber: string;
  progress?: number; // 0 a 100
  countdown?: number; // 5, 4, 3, 2, 1
  isFinished?: boolean; // Si el round está finalizado
  timeoutCountdown?: number | null; // Countdown de timeout (10, 9, 8, ...)
};

export default function CurrentNumberDisplay({ 
  currentNumber, 
  progress = 0,
  countdown,
  isFinished = false,
  timeoutCountdown = null
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
        {isFinished ? (
          <Typography
            sx={{
              fontSize: "20px",
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
            Finalizado
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
        {isFinished
          ? "Ronda Finalizada"
          : timeoutCountdown !== null && timeoutCountdown > 0
          ? `Tiempo restante: ${timeoutCountdown}s`
          : countdown !== undefined && countdown > 0 
          ? "Iniciando ronda..." 
          : "Número Actual Llamado"}
      </Typography>
    </Box>
  );
}

