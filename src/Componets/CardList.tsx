import { Box, Typography } from "@mui/material";
import SelectableCard from "./SelectableCard";
import CardBadge from "./CardBadge";
import type { BingoGrid } from "../utils/bingo";

type CardListProps = {
  cards: BingoGrid[];
  calledNumbers: Set<string>;
  markedNumbers: Map<number, Set<string>>;
  hasBingo: (index: number) => boolean;
  onCardClick: (index: number) => void;
};

export default function CardList({
  cards,
  calledNumbers,
  markedNumbers,
  hasBingo,
  onCardClick,
}: CardListProps) {
  const getMarkedForCard = (cardIndex: number): Set<string> => {
    return markedNumbers.get(cardIndex) || new Set();
  };

  return (
    <>
      <Typography
        variant="h6"
        sx={{
          fontSize: { xs: "18px", sm: "20px" },
          fontWeight: 600,
          color: "#ffffff",
          mb: 2,
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        Mis Cartones
      </Typography>

      <Box
        sx={{
          overflowX: "auto",
          overflowY: "hidden",
          mb: 4,
          px: 2,
          py: 2,
          scrollSnapType: "x proximity",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(227, 191, 112, 0.3) transparent",
          "&::-webkit-scrollbar": {
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(227, 191, 112, 0.3)",
            borderRadius: "10px",
            "&:hover": {
              background: "rgba(227, 191, 112, 0.5)",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            width: "max-content",
            py: 2,
            "& > *": {
              minWidth: "calc((100vw - 96px) / 3.5)",
              flexShrink: 0,
              scrollSnapAlign: "start",
              margin: "8px 0",
            },
          }}
        >
          {cards.map((card, index) => {
            const cardMarked = getMarkedForCard(index);
            const cardHasBingo = hasBingo(index);

            return (
              <Box key={index} sx={{ position: "relative" }}>
                <SelectableCard
                  grid={card}
                  cardId={index + 1}
                  selected={false}
                  onClick={() => onCardClick(index)}
                  status="free"
                  calledNumbers={calledNumbers}
                  markedNumbers={cardMarked}
                  hasBingo={cardHasBingo}
                />
                <CardBadge hasBingo={cardHasBingo} markedCount={cardMarked.size} />
              </Box>
            );
          })}
        </Box>
      </Box>
    </>
  );
}

