// src/Componets/ConfettiFireworks.tsx
import * as React from "react";
import { Box } from "@mui/material";

type ConfettiFireworksProps = {
  active: boolean;
};

const ConfettiFireworks: React.FC<ConfettiFireworksProps> = ({ active }) => {
  const confettiParticles = React.useMemo(() => {
    return Array.from({ length: 150 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 8,
      color: ["#e3bf70", "#f5d99a", "#ffed4e", "#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#f0932b"][
        Math.floor(Math.random() * 8)
      ],
      rotation: Math.random() * 360,
    }));
  }, []);

  const fireworks = React.useMemo(() => {
    return Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 50,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 1.5,
      color: ["#e3bf70", "#f5d99a", "#ffed4e", "#ff6b6b", "#4ecdc4"][Math.floor(Math.random() * 5)],
    }));
  }, []);

  if (!active) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {confettiParticles.map((particle, i) => (
        <Box
          key={`confetti-${i}`}
          sx={{
            position: "absolute",
            left: `${particle.left}%`,
            top: "-10px",
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "0%",
            transform: `rotate(${particle.rotation}deg)`,
            animation: `confettiFall ${particle.duration}s linear forwards`,
            animationDelay: `${particle.delay}s`,
            "@keyframes confettiFall": {
              "0%": {
                transform: `translateY(0) rotate(${particle.rotation}deg)`,
                opacity: 1,
              },
              "100%": {
                transform: `translateY(110vh) rotate(${particle.rotation + 720}deg)`,
                opacity: 0,
              },
            },
          }}
        />
      ))}

      {fireworks.map((firework, i) => (
        <Box
          key={`firework-${i}`}
          sx={{
            position: "absolute",
            left: `${firework.left}%`,
            top: `${firework.top}%`,
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            backgroundColor: firework.color,
            boxShadow: `
              0 0 20px 4px ${firework.color},
              0 0 40px 8px ${firework.color},
              0 0 60px 12px ${firework.color}
            `,
            animation: `fireworkExplode ${firework.duration}s ease-out forwards`,
            animationDelay: `${firework.delay}s`,
            "@keyframes fireworkExplode": {
              "0%": {
                transform: "scale(0)",
                opacity: 1,
              },
              "50%": {
                transform: "scale(15)",
                opacity: 0.8,
              },
              "100%": {
                transform: "scale(25)",
                opacity: 0,
              },
            },
          }}
        />
      ))}
    </Box>
  );
};

export default ConfettiFireworks;

