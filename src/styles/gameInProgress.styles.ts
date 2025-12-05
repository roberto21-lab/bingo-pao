import type { SxProps, Theme } from "@mui/material";

/**
 * Estilos del componente GameInProgress
 * Extraídos del componente principal para mejor organización
 */
export const gameInProgressStyles: SxProps<Theme> = {
  minHeight: "100vh",
  backgroundColor: "#1a1008", // Fondo de madera oscura
  color: "#f5e6d3", // Texto crema
  paddingBottom: "80px",
  position: "relative",
  overflow: "hidden",
  // Textura de madera de fondo (más sutil)
  backgroundImage: `
    repeating-linear-gradient(
      0deg,
      #1a1008 0px,
      #1f1309 1px,
      #2a1a0f 2px,
      #1f1309 3px,
      #1a1008 4px,
      #1a1008 8px,
      #1f1309 9px,
      #2a1a0f 10px,
      #1f1309 11px,
      #1a1008 12px
    ),
    linear-gradient(
      90deg,
      #1a1008 0%,
      #1f1309 15%,
      #2a1a0f 30%,
      #1f1309 45%,
      #1a1008 60%,
      #1f1309 75%,
      #2a1a0f 90%,
      #1a1008 100%
    ),
    radial-gradient(ellipse 200px 50px at 25% 30%, rgba(42, 26, 15, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse 150px 40px at 75% 60%, rgba(31, 19, 9, 0.25) 0%, transparent 50%)
  `,
  backgroundSize: `
    100% 16px,
    200% 100%,
    100% 100%,
    100% 100%
  `,
  // Capa de difuminado/vaho sobre el fondo
  "&::before": {
    content: '""',
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(ellipse 600px 400px at 20% 30%, rgba(0, 0, 0, 0.15) 0%, transparent 60%),
      radial-gradient(ellipse 500px 350px at 80% 60%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
      radial-gradient(ellipse 400px 300px at 50% 20%, rgba(0, 0, 0, 0.1) 0%, transparent 60%),
      radial-gradient(ellipse 350px 250px at 15% 70%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
      radial-gradient(ellipse 450px 320px at 70% 15%, rgba(0, 0, 0, 0.1) 0%, transparent 60%)
    `,
    backdropFilter: "blur(8px) saturate(120%)",
    WebkitBackdropFilter: "blur(8px) saturate(120%)",
    pointerEvents: "none",
    zIndex: 0,
  },
};

export const containerStyles: SxProps<Theme> = {
  pt: "80px",
  pb: 3,
  position: "relative",
  zIndex: 1,
};
