import { Box } from "@mui/material";
import * as React from "react";

type SparkleAnimationProps = {
  count?: number;
  size?: { min: number; max: number };
};

export default function SparkleAnimation({
  count = 30,
  size = { min: 2, max: 3 },
}: SparkleAnimationProps) {
  const sparkles = React.useMemo(() => {
    return Array.from({ length: count }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: size.min + Math.random() * (size.max - size.min),
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    }));
  }, [count, size]);

  return (
    <Box
      sx={{
        position: "absolute",
        top: "-20px",
        left: "-20px",
        right: "-20px",
        bottom: "-20px",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      {sparkles.map((sparkle, i) => (
        <Box
          key={`sparkle-${i}`}
          sx={{
            position: "absolute",
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            borderRadius: "50%",
            backgroundColor: "#e3bf70",
            top: `${sparkle.top}%`,
            left: `${sparkle.left}%`,
            boxShadow: `
              0 0 ${sparkle.size * 2}px ${sparkle.size}px rgba(227, 191, 112, 0.6),
              0 0 ${sparkle.size * 4}px ${sparkle.size * 2}px rgba(227, 191, 112, 0.3)
            `,
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
    </Box>
  );
}

