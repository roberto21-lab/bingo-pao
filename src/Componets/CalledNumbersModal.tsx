import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type CalledNumbersModalProps = {
  open: boolean;
  onClose: () => void;
  calledNumbers: Set<string>; // Set de números llamados en formato B-1, I-20, etc.
  currentRound: number;
  totalRounds: number;
};

export default function CalledNumbersModal({
  open,
  onClose,
  calledNumbers,
  currentRound,
  totalRounds,
}: CalledNumbersModalProps) {
  // Convertir Set a Array y ordenar
  const numbersArray = Array.from(calledNumbers).sort((a, b) => {
    // Ordenar por letra primero (B, I, N, G, O) y luego por número
    const letterOrder: { [key: string]: number } = {
      B: 1,
      I: 2,
      N: 3,
      G: 4,
      O: 5,
    };

    const aLetter = a.split("-")[0];
    const bLetter = b.split("-")[0];
    const aNum = parseInt(a.split("-")[1] || "0");
    const bNum = parseInt(b.split("-")[1] || "0");

    if (letterOrder[aLetter] !== letterOrder[bLetter]) {
      return letterOrder[aLetter] - letterOrder[bLetter];
    }
    return aNum - bNum;
  });

  // Agrupar por letra (B, I, N, G, O)
  const groupedNumbers: { [key: string]: string[] } = {
    B: [],
    I: [],
    N: [],
    G: [],
    O: [],
  };

  numbersArray.forEach((num) => {
    const letter = num.split("-")[0];
    if (groupedNumbers[letter]) {
      groupedNumbers[letter].push(num);
    }
  });

  // Todos los números se muestran en verde como solicitado
  const getChipColor = () => {
    return "#4CAF50"; // Verde para todos los números
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "rgba(31, 19, 9, 0.95)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRadius: "20px",
          border: "2px solid rgba(212, 175, 55, 0.3)",
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "#f5e6d3",
          borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#d4af37" }}>
            Números Llamados
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#f5e6d3", opacity: 0.8, fontSize: "12px" }}
          >
            Ronda {currentRound}/{totalRounds} • Total: {numbersArray.length} números
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: "#f5e6d3",
            "&:hover": {
              backgroundColor: "rgba(212, 175, 55, 0.2)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

            <DialogContent 
              sx={{ 
                pt: 3, 
                pb: 3,
                height: "500px",
                overflowY: "auto",
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "rgba(26, 16, 8, 0.3)",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(212, 175, 55, 0.5)",
                  borderRadius: "4px",
                  "&:hover": {
                    background: "rgba(212, 175, 55, 0.7)",
                  },
                },
              }}
            >
              {numbersArray.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#f5e6d3",
                      opacity: 0.7,
                    }}
                  >
                    Aún no se han llamado números
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  {Object.entries(groupedNumbers).map(([letter, numbers]) => {
                    if (numbers.length === 0) return null;

                    return (
                      <Box key={letter}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "#d4af37",
                            fontWeight: 700,
                            mb: 1.5,
                            fontSize: "14px",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                          }}
                        >
                          {letter} ({numbers.length})
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          {numbers.map((num) => (
                            <Chip
                              key={num}
                              label={num}
                              sx={{
                                backgroundColor: getChipColor(),
                                color: "#ffffff",
                                fontWeight: 700,
                                fontSize: "13px",
                                height: "36px",
                                boxShadow: "0 2px 8px rgba(76, 175, 80, 0.4)",
                                border: "1px solid rgba(255, 255, 255, 0.3)",
                                "&:hover": {
                                  transform: "scale(1.05)",
                                  transition: "transform 0.2s",
                                  backgroundColor: "#66BB6A",
                                  boxShadow: "0 4px 12px rgba(76, 175, 80, 0.6)",
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </DialogContent>
    </Dialog>
  );
}

