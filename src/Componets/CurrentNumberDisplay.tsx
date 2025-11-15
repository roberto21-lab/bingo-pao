import { Box, Typography } from "@mui/material";

type CurrentNumberDisplayProps = {
  currentNumber: string;
};

export default function CurrentNumberDisplay({ currentNumber }: CurrentNumberDisplayProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          border: "4px solid #e3bf70",
          background:
            "linear-gradient(135deg, rgba(201, 168, 90, 0.3) 0%, rgba(227, 191, 112, 0.4) 50%, rgba(240, 208, 138, 0.3) 100%)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(227, 191, 112, 0.4)",
        }}
      >
        <Typography
          sx={{
            fontSize: "32px",
            fontWeight: 900,
            color: "#ffffff",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          {currentNumber}
        </Typography>
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: "#ffffff",
          fontSize: "12px",
          opacity: 0.8,
        }}
      >
        Número Actual Llamado
      </Typography>
    </Box>
  );
}

