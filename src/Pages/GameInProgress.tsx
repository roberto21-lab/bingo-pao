import { Box, Container } from "@mui/material";
import * as React from "react";
import { generateCards } from "../utils/bingo";
import type { BingoType } from "../utils/bingoUtils";
import { calculateRoundPrizes } from "../utils/bingoUtils";
import { hasBingo } from "../utils/bingoLogic";
import { initializeGameData } from "../utils/gameInitialization";
import { numberToBingoFormat } from "../utils/bingoUtils";
import GameHeader from "../Componets/GameHeader";
import GameStatusCard from "../Componets/GameStatusCard";
import CardList from "../Componets/CardList";
import CardPreviewModal from "../Componets/CardPreviewModal";
import BingoValidationModal from "../Componets/BingoValidationModal";
import ConfettiFireworks from "../Componets/ConfettiFireworks";
import BackgroundStars from "../Componets/BackgroundStars";

export default function GameInProgress() {
  const currentRound = 1;
  const totalRounds = 3;
  const totalPot = 10000;

  const roundBingoTypes: BingoType[] = React.useMemo(
    () => ["horizontal", "vertical", "fullCard"],
    []
  );

  const currentBingoType: BingoType = roundBingoTypes[currentRound - 1] || "fullCard";
  const playerCards = React.useMemo(() => generateCards(6), []);

  const { calledNumbers: initialCalledNumbers, markedNumbers: initialMarkedNumbers } =
    React.useMemo(
      () => initializeGameData(playerCards, currentRound, roundBingoTypes),
      [playerCards, currentRound, roundBingoTypes]
    );

  const [calledNumbers] = React.useState<Set<string>>(initialCalledNumbers);
  const [markedNumbers, setMarkedNumbers] = React.useState<Map<number, Set<string>>>(
    initialMarkedNumbers
  );

  const [modalOpen, setModalOpen] = React.useState(false);
  const [previewCardIndex, setPreviewCardIndex] = React.useState<number | null>(null);
  const [bingoValidationOpen, setBingoValidationOpen] = React.useState(false);
  const [winningCardIndex, setWinningCardIndex] = React.useState<number | null>(null);
  const [showConfetti, setShowConfetti] = React.useState(false);

  const currentNumber = "B-7";
  const lastNumbers = ["G-53", "I-28", "N-41"];

  const roundPrizes = React.useMemo(
    () => calculateRoundPrizes(totalPot, totalRounds),
    [totalPot, totalRounds]
  );
  const currentRoundPrize = roundPrizes[currentRound - 1] || 0;

  const getMarkedForCard = (cardIndex: number): Set<string> => {
    return markedNumbers.get(cardIndex) || new Set();
  };

  const isNumberCalled = (num: number): boolean => {
    if (num === 0) return false;
    return calledNumbers.has(numberToBingoFormat(num));
  };

  const isNumberMarked = (num: number, cardIndex: number): boolean => {
    if (num === 0) return false;
    const cardMarked = getMarkedForCard(cardIndex);
    return cardMarked.has(numberToBingoFormat(num));
  };

  const checkBingo = (cardIndex: number): boolean => {
    const card = playerCards[cardIndex];
    const cardMarked = getMarkedForCard(cardIndex);
    return hasBingo(card, cardMarked, currentBingoType);
  };

  const handleCardClick = (index: number) => {
    setPreviewCardIndex(index);
    setModalOpen(true);
  };

  const handleNumberClick = (number: number) => {
    if (previewCardIndex === null || number === 0) return;

    const numberFormat = numberToBingoFormat(number);
    if (!calledNumbers.has(numberFormat)) return;

    setMarkedNumbers((prev) => {
      const next = new Map(prev);
      const cardMarked = next.get(previewCardIndex) || new Set();
      const newMarked = new Set(cardMarked);

      if (newMarked.has(numberFormat)) {
        newMarked.delete(numberFormat);
      } else {
        newMarked.add(numberFormat);
      }

      next.set(previewCardIndex, newMarked);
      return next;
    });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setPreviewCardIndex(null);
  };

  const handleBingo = () => {
    if (previewCardIndex !== null) {
      setWinningCardIndex(previewCardIndex);
      setShowConfetti(true);
      handleCloseModal();
      setBingoValidationOpen(true);
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }
  };

  const handleCloseBingoValidation = () => {
    setBingoValidationOpen(false);
    setWinningCardIndex(null);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#1a1d2e",
        color: "#ffffff",
        paddingBottom: "80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <BackgroundStars />

      <Container maxWidth="sm" sx={{ py: 3, position: "relative", zIndex: 1 }}>
        <GameHeader
          currentRound={currentRound}
          currentRoundPrize={currentRoundPrize}
          currentBingoType={currentBingoType}
        />

        <GameStatusCard
          currentRound={currentRound}
          totalRounds={totalRounds}
          lastNumbers={lastNumbers}
          currentNumber={currentNumber}
        />

        <CardList
          cards={playerCards}
          calledNumbers={calledNumbers}
          markedNumbers={markedNumbers}
          hasBingo={checkBingo}
          onCardClick={handleCardClick}
        />
      </Container>

      {previewCardIndex !== null && (
        <CardPreviewModal
          open={modalOpen}
          onClose={handleCloseModal}
          onBingo={handleBingo}
          card={playerCards[previewCardIndex]}
          cardId={previewCardIndex + 1}
          hasBingo={checkBingo(previewCardIndex)}
          isNumberCalled={isNumberCalled}
          isNumberMarked={(num) => isNumberMarked(num, previewCardIndex)}
          onNumberClick={handleNumberClick}
        />
      )}

      {winningCardIndex !== null && (
        <BingoValidationModal
          open={bingoValidationOpen}
          onClose={handleCloseBingoValidation}
          winningCard={playerCards[winningCardIndex]}
          winningCardId={winningCardIndex + 1}
          markedNumbers={getMarkedForCard(winningCardIndex)}
          calledNumbers={calledNumbers}
        />
      )}

      <ConfettiFireworks active={showConfetti} />
    </Box>
  );
}
