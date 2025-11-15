import { Box, Typography } from "@mui/material";
import type { BingoGrid } from "../utils/bingo";
import { numberToBingoFormat } from "../utils/bingoUtils";

type WinningCardDisplayProps = {
  card: BingoGrid;
  cardId: number;
  markedNumbers: Set<string>;
};

export default function WinningCardDisplay({
  card,
  cardId,
  markedNumbers,
}: WinningCardDisplayProps) {
  const isMarked = (num: number): boolean => {
    if (num === 0) return true;
    return markedNumbers.has(numberToBingoFormat(num));
  };

  return (
    <>
      <Typography
        variant="h6"
        sx={{
          color: "#ffffff",
          fontWeight: 700,
          mb: 2,
          textAlign: "center",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        Cartón #{cardId}
      </Typography>
      <Box
        sx={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          p: 3,
          border: "3px solid #e3bf70",
          boxShadow: "0 8px 32px rgba(227, 191, 112, 0.6)",
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
              const shouldBeGold = isMarked(num);

              return (
                <Box
                  key={`${rowIndex}-${colIndex}`}
                  sx={{
                    aspectRatio: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isFree
                      ? "#f0f0f0"
                      : shouldBeGold
                      ? "#f5d99a"
                      : "#ffffff",
                    borderRadius: "4px",
                    border: isFree
                      ? "2px solid #e0e0e0"
                      : shouldBeGold
                      ? "3px solid #e3bf70"
                      : "2px solid #e0e0e0",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#1a1d2e",
                    position: "relative",
                  }}
                >
                  {isFree ? (
                    <Typography
                      sx={{
                        fontSize: "10px",
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
                      {shouldBeGold && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            backgroundColor: "#e3bf70",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "10px",
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
    </>
  );
}

