import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import type { BingoGrid } from "../utils/bingo";
import SparkleAnimation from "./SparkleAnimation";

type CardPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  onBingo: () => void;
  card: BingoGrid;
  cardId: number;
  hasBingo: boolean;
  isNumberCalled: (num: number) => boolean;
  isNumberMarked: (num: number) => boolean;
  onNumberClick: (num: number) => void;
};

export default function CardPreviewModal({
  open,
  onClose,
  onBingo,
  card,
  cardId,
  hasBingo,
  isNumberCalled,
  isNumberMarked,
  onNumberClick,
}: CardPreviewModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#1a1d2e",
          borderRadius: "20px",
          border: "1px solid rgba(227, 191, 112, 0.3)",
        },
      }}
    >
      <DialogContent sx={{ p: 4 }}>
        <Typography
          variant="h5"
          sx={{
            textAlign: "center",
            color: "#ffffff",
            fontWeight: 700,
            mb: 3,
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Cartón #{cardId}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 3,
            position: "relative",
          }}
        >
          {hasBingo && <SparkleAnimation />}
          <Box
            sx={{
              width: "100%",
              maxWidth: "400px",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              p: 3,
              border: hasBingo ? "3px solid #e3bf70" : "2px solid #e3bf70",
              position: "relative",
              zIndex: 1,
              boxShadow: hasBingo
                ? "0 8px 32px rgba(227, 191, 112, 0.6)"
                : "0 4px 16px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                mb: 2,
              }}
            >
              {["B", "I", "N", "G", "O"].map((letter) => (
                <Typography
                  key={letter}
                  sx={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "#1a1d2e",
                    letterSpacing: "1px",
                  }}
                >
                  {letter}
                </Typography>
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 1,
              }}
            >
              {card.map((row, rowIndex) =>
                row.map((num, colIndex) => {
                  const isFree = num === 0;
                  const isCalled = isNumberCalled(num);
                  const isMarked = isNumberMarked(num);
                  const canMark = isCalled && !isFree && !hasBingo;
                  const isNotMarked = isCalled && !isMarked && !isFree;
                  const shouldBeGold = hasBingo && isMarked;

                  return (
                    <Box
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => canMark && onNumberClick(num)}
                      sx={{
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isFree
                          ? "#f0f0f0"
                          : shouldBeGold
                          ? "#f5d99a"
                          : isMarked
                          ? "#c8e6c9"
                          : isNotMarked
                          ? "#ffcdd2"
                          : "#ffffff",
                        borderRadius: "4px",
                        border: isFree
                          ? "2px solid #e0e0e0"
                          : shouldBeGold
                          ? "3px solid #e3bf70"
                          : isMarked
                          ? "3px solid #4caf50"
                          : isNotMarked
                          ? "3px solid #f44336"
                          : "2px solid #e0e0e0",
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#1a1d2e",
                        position: "relative",
                        cursor: canMark ? "pointer" : "default",
                        transition: "all 0.2s",
                        "&:hover": canMark
                          ? {
                              backgroundColor: isMarked ? "#a5d6a7" : "#ffcdd2",
                              transform: "scale(1.05)",
                            }
                          : {},
                      }}
                    >
                      {isFree ? (
                        <Typography
                          sx={{
                            fontSize: "12px",
                            fontWeight: 900,
                            color: "#1a1d2e",
                            transform: "rotate(-45deg)",
                            position: "absolute",
                          }}
                        >
                          FREE
                        </Typography>
                      ) : (
                        <>
                          {num}
                          {isMarked && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: 2,
                                right: 2,
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                backgroundColor: "#4caf50",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "12px",
                                  color: "#ffffff",
                                  fontWeight: 700,
                                }}
                              >
                                ✓
                              </Typography>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Box>

        {!hasBingo && (
          <Typography
            variant="body2"
            sx={{
              color: "#e3bf70",
              fontSize: "12px",
              textAlign: "center",
              mt: 2,
            }}
          >
            Toca los números verdes para marcarlos o desmarcarlos
          </Typography>
        )}
        {hasBingo && (
          <Typography
            variant="h6"
            sx={{
              color: "#e3bf70",
              fontSize: "24px",
              fontWeight: 900,
              textAlign: "center",
              mt: 2,
              textShadow: "0 2px 8px rgba(227, 191, 112, 0.5)",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            ¡BINGO!
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, gap: 2, justifyContent: "center" }}>
        {hasBingo && (
          <Button
            onClick={onBingo}
            sx={{
              flex: 1,
              py: 1.5,
              borderRadius: "12px",
              textTransform: "none",
              background:
                "linear-gradient(135deg, rgba(201, 168, 90, 0.9) 0%, rgba(227, 191, 112, 1) 50%, rgba(240, 208, 138, 0.9) 100%)",
              color: "#0f0f1e",
              border: "2px solid rgba(227, 191, 112, 0.5)",
              fontWeight: 900,
              fontSize: "18px",
              boxShadow: "0 6px 20px rgba(227, 191, 112, 0.5)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, rgba(212, 179, 102, 1) 0%, rgba(236, 200, 130, 1) 50%, rgba(245, 217, 154, 1) 100%)",
                boxShadow: "0 8px 24px rgba(227, 191, 112, 0.6)",
                transform: "translateY(-2px)",
              },
            }}
          >
            BINGO
          </Button>
        )}
        <Button
          onClick={onClose}
          sx={{
            flex: hasBingo ? 1 : "none",
            py: 1.5,
            px: hasBingo ? 0 : 4,
            borderRadius: "12px",
            textTransform: "none",
            backgroundColor: "rgba(244, 67, 54, 0.9)",
            color: "#ffffff",
            border: "1px solid rgba(244, 67, 54, 0.5)",
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)",
            "&:hover": {
              backgroundColor: "rgba(244, 67, 54, 1)",
              boxShadow: "0 6px 16px rgba(244, 67, 54, 0.4)",
              transform: "translateY(-1px)",
            },
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

