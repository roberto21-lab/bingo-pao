// src/Components/shared/StatusBadge.tsx
import React from "react";
import { Box, Typography } from "@mui/material";

type StatusBadgeProps = {
  status: "waiting" | "preparing" | "in_progress" | "locked" | "finished";
  position?: "absolute" | "relative";
  top?: number | string;
  right?: number | string;
};

const statusConfig = {
  waiting: {
    label: "Esperando jugadores",
    color: "#4caf50",
    shadow: "rgba(76, 175, 80, 0.3)",
  },
  preparing: {
    label: "Preparando",
    color: "#ff9800",
    shadow: "rgba(255, 152, 0, 0.3)",
  },
  in_progress: {
    label: "En progreso",
    color: "#f44336",
    shadow: "rgba(244, 67, 54, 0.3)",
  },
  locked: {
    label: "Bloqueada",
    color: "#9e9e9e",
    shadow: "rgba(158, 158, 158, 0.3)",
  },
  finished: {
    label: "Finalizada",
    color: "#9e9e9e",
    shadow: "rgba(158, 158, 158, 0.3)",
  },
} as const;

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  position = "absolute",
  top = 0,
  right = 0,
}) => {
  const config = statusConfig[status] || statusConfig.waiting;

  return (
    <Box
      sx={{
        position,
        top,
        right,
        display: "inline-flex",
        px: 1.5,
        py: 0.5,
        borderRadius: "10px",
        backgroundColor: `${config.color}25`,
        border: `2px solid ${config.color}`,
        boxShadow: `0 3px 10px ${config.shadow}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: config.color,
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
          whiteSpace: "nowrap",
          lineHeight: 1.2,
        }}
      >
        {config.label}
      </Typography>
    </Box>
  );
};

