import { Box, Typography, Stack, Chip } from "@mui/material";
import * as React from "react";

interface SuccessToastProps {
  message: string;
  subMessage?: string;
  onClose: () => void;
}

export default function SuccessToast({ message, subMessage, onClose }: SuccessToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isExiting, setIsExiting] = React.useState(false);
  const [isEntering, setIsEntering] = React.useState(true);

  React.useEffect(() => {
    const enterTimer = setTimeout(() => {
      setIsEntering(false);
    }, 50);

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 400);
    }, 5000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 10,
        left: "50%",
        transform: isEntering 
          ? "translateX(calc(-50% - 100vw)) scale(0.9)" 
          : isExiting 
          ? "translateX(calc(-50% - 100vw)) scale(0.95)" 
          : "translateX(-50%) scale(1)",
        zIndex: 10000,
        minWidth: "300px",
        width: "calc(100% - 40px)",
        maxWidth: { xs: "calc(100% - 40px)", sm: "400px" },
        backgroundColor: "rgba(26, 29, 46, 0.85)",
        border: "1px solid rgba(76, 175, 80, 0.3)",
        borderRadius: "12px",
        padding: 2,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: isEntering ? 0 : isExiting ? 0 : 1,
        backdropFilter: "blur(10px) saturate(180%)",
        WebkitBackdropFilter: "blur(10px) saturate(180%)",
        overflow: "hidden",
        pointerEvents: "auto",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)",
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600, 
              mb: 0.5,
              color: "#4caf50",
            }}
          >
            {message}
          </Typography>
          {subMessage && (
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.8,
                color: "#4caf50",
              }}
            >
              {subMessage}
            </Typography>
          )}
        </Box>
        <Chip 
          label="¡Éxito!" 
          size="small" 
          sx={{ 
            backgroundColor: "rgba(76, 175, 80, 0.2)",
            color: "#4caf50",
            border: "1px solid rgba(76, 175, 80, 0.4)",
          }}
        />
      </Stack>
    </Box>
  );
}

