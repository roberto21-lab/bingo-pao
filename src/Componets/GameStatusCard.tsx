import { Box, Stack, Typography } from "@mui/material";
import CurrentNumberDisplay from "./CurrentNumberDisplay";

type GameStatusCardProps = {
  currentRound: number;
  totalRounds: number;
  lastNumbers: string[];
  currentNumber: string;
};

export default function GameStatusCard({
  currentRound,
  totalRounds,
  lastNumbers,
  currentNumber,
}: GameStatusCardProps) {
  return (
    <Box
      sx={{
        background: "rgba(31, 34, 51, 0.5)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        p: 2.5,
        mb: 3,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography
          variant="body2"
          sx={{
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Ronda: {currentRound}/{totalRounds}
        </Typography>
        <Box>
          <Typography
            variant="body2"
            sx={{
              color: "#ffffff",
              fontSize: "12px",
              opacity: 0.8,
              mb: 0.5,
            }}
          >
            Últimos Números:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {lastNumbers.join(", ")}
          </Typography>
        </Box>
      </Stack>

      <CurrentNumberDisplay currentNumber={currentNumber} />
    </Box>
  );
}

