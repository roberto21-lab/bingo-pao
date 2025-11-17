// src/Componets/BingoLogo.tsx
import * as React from "react";
import { Box } from "@mui/material";

const BingoLogo: React.FC<{ size?: number }> = ({ size = 150 }) => {
  // Números para la cuadrícula de bingo (5x5) - ajustados para coincidir con la imagen
  const bingoNumbers = [
    [12, 20, 14, 9, 16],
    [18, 70, 10, 30, 25],
    [5, 45, 35, 50, 15],
    [22, 8, 40, 28, 33],
    [11, 55, 7, 42, 19],
  ];

  // Colores dorados lujosos con degradaciones más intensas
  const goldBase = "#e3bf70";
  const goldLight = "#f5d99a";
  const goldDark = "#c9a85a";
  const goldDarker = "#b8964a";
  const goldBright = "#ffed4e";

  // Generar posiciones aleatorias para las partículas doradas alrededor del logo
  const generateSparklePositions = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    }));
  };

  const sparkles = generateSparklePositions(30);

  return (
    <Box
      sx={{
        position: "relative",
        width: size * 1.5,
        height: size * 1.5,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Partículas doradas brillantes en el fondo alrededor del logo */}
      {sparkles.map((sparkle, i) => (
        <Box
          key={`sparkle-${i}`}
          sx={{
            position: "absolute",
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            borderRadius: "50%",
            backgroundColor: goldBase,
            top: `${sparkle.top}%`,
            left: `${sparkle.left}%`,
            boxShadow: `
              0 0 ${sparkle.size * 2}px ${sparkle.size}px rgba(227, 191, 112, 0.6),
              0 0 ${sparkle.size * 4}px ${sparkle.size * 2}px rgba(227, 191, 112, 0.3)
            `,
            zIndex: 0,
            animation: `sparkleFloat ${sparkle.duration}s ease-in-out infinite`,
            animationDelay: `${sparkle.delay}s`,
            "@keyframes sparkleFloat": {
              "0%, 100%": {
                opacity: 0.4,
                transform: "scale(0.8) translateY(0px)",
              },
              "50%": {
                opacity: 1,
                transform: `scale(1.3) translateY(-${sparkle.size * 2}px)`,
              },
            },
          }}
        />
      ))}

      {/* Contenedor del logo */}
      <Box
        sx={{
          position: "relative",
          width: size,
          height: size,
          zIndex: 1,
        }}
      >
        {/* Borde dorado brillante y metálico - más grueso */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "20px",
            background: `linear-gradient(135deg, 
              ${goldDarker} 0%, 
              ${goldDark} 15%, 
              ${goldBase} 30%, 
              ${goldLight} 45%, 
              ${goldBright} 50%, 
              ${goldLight} 55%, 
              ${goldBase} 70%, 
              ${goldDark} 85%, 
              ${goldDarker} 100%
            )`,
            padding: "5px",
            zIndex: 1,
            boxShadow: `
              0 0 30px rgba(227, 191, 112, 0.5),
              0 0 60px rgba(227, 191, 112, 0.3),
              inset 0 0 30px rgba(255, 237, 78, 0.2),
              inset 2px 2px 4px rgba(255, 255, 255, 0.3),
              inset -2px -2px 4px rgba(0, 0, 0, 0.3)
            `,
            "&::before": {
              content: '""',
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "60%",
              height: "60%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)",
              filter: "blur(10px)",
            },
          }}
        >
          {/* Capa interior para el borde */}
          <Box
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: "15px",
              backgroundColor: "transparent",
            }}
          />
        </Box>

        {/* Cuadrícula de bingo de fondo - casi negra */}
        <Box
          sx={{
            position: "absolute",
            top: "5px",
            left: "5px",
            right: "5px",
            bottom: "5px",
            borderRadius: "15px",
            backgroundColor: "#050508",
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gridTemplateRows: "repeat(5, 1fr)",
            gap: "1px",
            padding: "5px",
            zIndex: 2,
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          {bingoNumbers.map((row, rowIndex) =>
            row.map((num, colIndex) => (
              <Box
                key={`${rowIndex}-${colIndex}`}
                sx={{
                  backgroundColor: "#0a0a0f",
                  borderRadius: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: `${size * 0.07}px`,
                  fontWeight: 600,
                  color: "#ffffff",
                  opacity: 0.95,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {num}
              </Box>
            ))
          )}
        </Box>

        {/* Letras PO doradas superpuestas con efecto metálico intenso */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1px",
          }}
        >
          {/* Sombra profunda para efecto 3D */}
          {/* <Box
            sx={{
              position: "absolute",
              fontSize: `${size * 0.48}px`,
              fontWeight: 700,
              color: "rgba(0, 0, 0, 0.6)",
              letterSpacing: "-4px",
              lineHeight: 1,
              transform: "translate(3px, 3px)",
              zIndex: 0,
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Pao
          </Box> */}
          {/* Letras principales con efecto metálico dorado intenso */}
          <Box
            sx={{
              position: "relative",
              fontSize: `${size * 0.48}px`,
              fontWeight: 700,
              background: `linear-gradient(135deg, 
                ${goldDarker} 0%, 
                ${goldDark} 10%, 
                ${goldBase} 25%, 
                ${goldLight} 40%, 
                ${goldBright} 50%, 
                ${goldLight} 60%, 
                ${goldBase} 75%, 
                ${goldDark} 90%, 
                ${goldDarker} 100%
              )`,
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: `
                drop-shadow(0 0 15px rgba(227, 191, 112, 1)) 
                drop-shadow(0 0 30px rgba(227, 191, 112, 0.6))
                drop-shadow(0 0 45px rgba(227, 191, 112, 0.3))
              `,
              letterSpacing: "-4px",
              lineHeight: 1,
              zIndex: 1,
              textShadow: "3px 3px 6px rgba(0, 0, 0, 0.5)",
              fontFamily: "'Montserrat', sans-serif",
              animation: "shimmerGold 4s ease-in-out infinite",
              "@keyframes shimmerGold": {
                "0%, 100%": {
                  backgroundPosition: "0% 50%",
                  filter: `
                    drop-shadow(0 0 15px rgba(227, 191, 112, 1)) 
                    drop-shadow(0 0 30px rgba(227, 191, 112, 0.6))
                  `,
                },
                "50%": {
                  backgroundPosition: "100% 50%",
                  filter: `
                    drop-shadow(0 0 20px rgba(255, 237, 78, 1)) 
                    drop-shadow(0 0 40px rgba(255, 237, 78, 0.7))
                    drop-shadow(0 0 60px rgba(255, 237, 78, 0.4))
                  `,
                },
              },
            }}
          >
            Pao
          </Box>
        </Box>

        {/* Efectos de brillo adicionales dentro del logo */}
        {[...Array(6)].map((_, i) => (
          <Box
            key={`inner-sparkle-${i}`}
            sx={{
              position: "absolute",
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              backgroundColor: goldBright,
              boxShadow: `0 0 8px 3px rgba(255, 237, 78, 0.8)`,
              top: `${20 + (i * 15) % 60}%`,
              left: `${15 + (i * 20) % 70}%`,
              zIndex: 4,
              animation: `innerSparkle ${2 + (i % 2)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              "@keyframes innerSparkle": {
                "0%, 100%": {
                  opacity: 0.5,
                  transform: "scale(0.9)",
                },
                "50%": {
                  opacity: 1,
                  transform: "scale(1.4)",
                },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default BingoLogo;
