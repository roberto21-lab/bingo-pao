import { Box, Typography } from "@mui/material";

type CardBadgeProps = {
  hasBingo: boolean;
  markedCount?: number;
};

export default function CardBadge({ hasBingo, markedCount = 0 }: CardBadgeProps) {
  if (hasBingo) {
    return (
      <Box
        sx={{
          position: "absolute",
          top: -8,
          right: -8,
          minWidth: "48px",
          height: "24px",
          borderRadius: "12px",
          backgroundColor: "#e3bf70",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 1,
          boxShadow: "0 2px 8px rgba(227, 191, 112, 0.5)",
          border: "2px solid #ffffff",
          zIndex: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: "8px",
            fontWeight: 900,
            color: "#0f0f1e",
            letterSpacing: "0.5px",
          }}
        >
          BINGO
        </Typography>
      </Box>
    );
  }

  if (markedCount > 0) {
    return (
      <Box
        sx={{
          position: "absolute",
          top: -8,
          right: -8,
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: "#4caf50",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #1a1d2e",
          zIndex: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          {markedCount}
        </Typography>
      </Box>
    );
  }

  return null;
}

