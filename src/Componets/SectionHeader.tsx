import { Box, Typography, IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

type SectionHeaderProps = {
  title: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  showNavigation?: boolean;
};

export default function SectionHeader({
  title,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  showNavigation = true,
}: SectionHeaderProps) {
  // Determinar border-radius según el estado de los botones
  const getBorderRadius = () => {
    // Si no hay navegación, mantener el estilo por defecto
    if (!showNavigation) {
      return {
        borderRadius: "20px",
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0,
      };
    }

    // Si estamos en la primera página (hasPrevious = false)
    if (!hasPrevious) {
      return {
        borderRadius: 0,
        borderTopLeftRadius: "20px",
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0,
      };
    }

    // Si ambos botones están activos
    if (hasPrevious && hasNext) {
      return {
        borderRadius: 0,
      };
    }

    // Si solo hasPrevious es true (última página)
    if (hasPrevious && !hasNext) {
      return {
        borderRadius: 0,
        borderTopRightRadius: "20px",
        borderTopLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0,
      };
    }

    // Fallback al estilo por defecto
    return {
      borderRadius: "20px",
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0,
    };
  };

  return (
    <Box
      className="glass-effect"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        marginBottom: "-10px",
        position: "relative",
        background: "rgba(31, 19, 9, 0.4)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        ...getBorderRadius(),
        zIndex: 3,
        border: "2px solid rgba(212, 175, 55, 0.2)",
        padding: "16px 24px",
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.08),
          inset 0 -1px 0 rgba(0, 0, 0, 0.2),
          0 0 0 1px rgba(212, 175, 55, 0.1) inset
        `,
        // Textura de pergamino sutil
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            rgba(31, 19, 9, 0.4) 0px,
            rgba(35, 22, 11, 0.42) 1px,
            rgba(40, 25, 13, 0.4) 2px,
            rgba(35, 22, 11, 0.42) 3px,
            rgba(31, 19, 9, 0.4) 4px,
            rgba(31, 19, 9, 0.4) 12px,
            rgba(35, 22, 11, 0.42) 13px,
            rgba(40, 25, 13, 0.4) 14px,
            rgba(35, 22, 11, 0.42) 15px,
            rgba(31, 19, 9, 0.4) 16px
          ),
          linear-gradient(
            90deg,
            rgba(31, 19, 9, 0.4) 0%,
            rgba(35, 22, 11, 0.41) 25%,
            rgba(40, 25, 13, 0.4) 50%,
            rgba(35, 22, 11, 0.41) 75%,
            rgba(31, 19, 9, 0.4) 100%
          ),
          radial-gradient(ellipse 300px 200px at 20% 30%, rgba(50, 30, 15, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse 250px 180px at 80% 60%, rgba(45, 28, 14, 0.08) 0%, transparent 50%)
        `,
        backgroundSize: `
          100% 32px,
          200% 100%,
          100% 100%,
          100% 100%
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
            radial-gradient(ellipse 200px 150px at 20% 30%, rgba(0, 0, 0, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 180px 130px at 80% 60%, rgba(0, 0, 0, 0.08) 0%, transparent 50%)
          `,
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      {/* Flecha izquierda (anterior) */}
      {showNavigation && (
        <IconButton
          onClick={onPrevious}
          disabled={!hasPrevious}
          sx={{
            color: hasPrevious ? "#d4af37" : "rgba(212, 175, 55, 0.3)",
            backgroundColor: hasPrevious
              ? "rgba(212, 175, 55, 0.15)"
              : "rgba(212, 175, 55, 0.05)",
            border: hasPrevious
              ? "2px solid rgba(212, 175, 55, 0.5)"
              : "2px solid rgba(212, 175, 55, 0.15)",
            borderRadius: "14px",
            width: "52px",
            height: "52px",
            position: "relative",
            overflow: "hidden",
            zIndex: 2,
            // Efecto metálico dorado cuando está activo
            ...(hasPrevious && {
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  rgba(212, 175, 55, 0.15) 0px,
                  rgba(212, 175, 55, 0.2) 1px,
                  rgba(244, 208, 63, 0.15) 2px,
                  rgba(212, 175, 55, 0.15) 3px
                ),
                linear-gradient(
                  135deg,
                  rgba(212, 175, 55, 0.25) 0%,
                  rgba(244, 208, 63, 0.3) 50%,
                  rgba(212, 175, 55, 0.25) 100%
                )
              `,
              boxShadow: `
                0 4px 12px rgba(212, 175, 55, 0.4),
                inset 0 2px 4px rgba(255, 255, 255, 0.25),
                inset 0 -2px 4px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1) inset
              `,
            }),
            "&::before": hasPrevious
              ? {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
                  zIndex: 1,
                }
              : {},
            "&:hover": hasPrevious
              ? {
                  backgroundColor: "rgba(212, 175, 55, 0.25)",
                  borderColor: "rgba(212, 175, 55, 0.7)",
                  transform: "scale(1.08) translateY(-2px)",
                  boxShadow: `
                    0 6px 16px rgba(212, 175, 55, 0.5),
                    inset 0 2px 4px rgba(255, 255, 255, 0.3),
                    inset 0 -2px 4px rgba(0, 0, 0, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.15) inset
                  `,
                }
              : {},
            "&:active": hasPrevious
              ? {
                  transform: "scale(0.96) translateY(0px)",
                  boxShadow: `
                    0 2px 6px rgba(212, 175, 55, 0.4),
                    inset 0 3px 6px rgba(0, 0, 0, 0.3)
                  `,
                }
              : {},
            "&:disabled": {
              opacity: 0.3,
              cursor: "not-allowed",
            },
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <ChevronLeft sx={{ fontSize: "32px", filter: hasPrevious ? "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))" : "none" }} />
        </IconButton>
      )}

      {/* Título con efecto dorado */}
      <Typography
        variant="h4"
        sx={{
          fontSize: { xs: "24px", sm: "28px" },
          fontWeight: 800,
          background: "linear-gradient(135deg, #d4af37 0%, #f4d03f 25%, #ffd700 50%, #f4d03f 75%, #d4af37 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "'Montserrat', sans-serif",
          textShadow: `
            0 2px 4px rgba(212, 175, 55, 0.4),
            0 4px 8px rgba(212, 175, 55, 0.2),
            0 0 20px rgba(212, 175, 55, 0.1)
          `,
          minWidth: showNavigation ? "200px" : "auto",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          letterSpacing: "0.5px",
          // Efecto de brillo adicional
          filter: "drop-shadow(0 2px 4px rgba(212, 175, 55, 0.3))",
        }}
      >
        {title}
      </Typography>

      {/* Flecha derecha (siguiente) */}
      {showNavigation && (
        <IconButton
          onClick={onNext}
          disabled={!hasNext}
          sx={{
            color: hasNext ? "#d4af37" : "rgba(212, 175, 55, 0.3)",
            backgroundColor: hasNext
              ? "rgba(212, 175, 55, 0.15)"
              : "rgba(212, 175, 55, 0.05)",
            border: hasNext
              ? "2px solid rgba(212, 175, 55, 0.5)"
              : "2px solid rgba(212, 175, 55, 0.15)",
            borderRadius: "14px",
            width: "52px",
            height: "52px",
            position: "relative",
            overflow: "hidden",
            zIndex: 2,
            // Efecto metálico dorado cuando está activo
            ...(hasNext && {
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  rgba(212, 175, 55, 0.15) 0px,
                  rgba(212, 175, 55, 0.2) 1px,
                  rgba(244, 208, 63, 0.15) 2px,
                  rgba(212, 175, 55, 0.15) 3px
                ),
                linear-gradient(
                  135deg,
                  rgba(212, 175, 55, 0.25) 0%,
                  rgba(244, 208, 63, 0.3) 50%,
                  rgba(212, 175, 55, 0.25) 100%
                )
              `,
              boxShadow: `
                0 4px 12px rgba(212, 175, 55, 0.4),
                inset 0 2px 4px rgba(255, 255, 255, 0.25),
                inset 0 -2px 4px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1) inset
              `,
            }),
            "&::before": hasNext
              ? {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
                  zIndex: 1,
                }
              : {},
            "&:hover": hasNext
              ? {
                  backgroundColor: "rgba(212, 175, 55, 0.25)",
                  borderColor: "rgba(212, 175, 55, 0.7)",
                  transform: "scale(1.08) translateY(-2px)",
                  boxShadow: `
                    0 6px 16px rgba(212, 175, 55, 0.5),
                    inset 0 2px 4px rgba(255, 255, 255, 0.3),
                    inset 0 -2px 4px rgba(0, 0, 0, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.15) inset
                  `,
                }
              : {},
            "&:active": hasNext
              ? {
                  transform: "scale(0.96) translateY(0px)",
                  boxShadow: `
                    0 2px 6px rgba(212, 175, 55, 0.4),
                    inset 0 3px 6px rgba(0, 0, 0, 0.3)
                  `,
                }
              : {},
            "&:disabled": {
              opacity: 0.3,
              cursor: "not-allowed",
            },
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <ChevronRight sx={{ fontSize: "32px", filter: hasNext ? "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))" : "none" }} />
        </IconButton>
      )}
    </Box>
  );
}

