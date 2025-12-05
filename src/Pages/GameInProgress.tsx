import { Box, Container, CircularProgress, Alert } from "@mui/material";
import * as React from "react";
import { useParams } from "react-router-dom";
import type { BingoType } from "../utils/bingoUtils";
import { calculateRoundPrizes } from "../utils/bingoUtils";
import { getBingoPatternNumbers } from "../utils/bingoLogic";
import { numberToBingoFormat } from "../utils/bingoUtils";
import GameHeader from "../Components/GameHeader";
import GameStatusCard from "../Components/GameStatusCard";
import CardList from "../Components/CardList";
import CardPreviewModal from "../Components/CardPreviewModal";
import BingoValidationModal from "../Components/BingoValidationModal";
import BingoPatternModal from "../Components/BingoPatternModal";
import ConfettiFireworks from "../Components/ConfettiFireworks";
import BackgroundStars from "../Components/BackgroundStars";
import WinnerCardModal from "../Components/WinnerCardModal";
import { disconnectSocket } from "../Services/socket.service";
import { mapPatternToBingoType } from "../utils/patternMapper";
import { useGameData } from "../hooks/useGameData";
import { useWebSocketConnection } from "../hooks/useWebSocketConnection";
import { useAuth } from "../hooks/useAuth";
import { getUserId } from "../Services/auth.service";
import { useGameContext } from "../contexts/GameContext";
import { createGetMarkedForCard } from "../utils/gameHelpers";
import { useCountdowns } from "../hooks/useCountdowns";
import { useGameProgress } from "../hooks/useGameProgress";
import { useGameStarting } from "../hooks/useGameStarting";
import { useGameStateSync } from "../hooks/useGameStateSync";
import { useBingoHandlers } from "../hooks/useBingoHandlers";
import { useWebSocketListeners } from "../hooks/useWebSocketListeners";
import { gameInProgressStyles, containerStyles } from "../styles/gameInProgress.styles";

export default function GameInProgress() {
  React.useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const currentUserId = user?.id || getUserId() || undefined;
  const { setEnrolledUsersCount, setIsGameActive } = useGameContext();

  // Hook para cargar datos iniciales del juego
  const gameData = useGameData(roomId);

  const {
    loading,
    error,
    room,
    playerCards,
    playerCardsData,
    currentRound,
    totalRounds,
    totalPot,
    roundBingoTypes,
    roundsData,
    calledNumbers,
    currentNumber,
    lastNumbers,
    lastCalledTimestamp,
    gameStarted,
    isCallingNumber,
    roundEnded,
    roundFinished,
    roomFinished,
    winners,
    winningNumbersMap,
    roomScheduledAt,
    serverTimeOffset,
    setCurrentRound,
    setCalledNumbers,
    setCurrentNumber,
    setLastNumbers,
    setLastCalledTimestamp,
    setIsCallingNumber,
    setRoundEnded,
    setRoundFinished,
    setRoundsData,
    setRoundBingoTypes,
    setRoom,
    setRoomFinished,
    setWinners,
    setPlayerCards,
    setPlayerCardsData,
    setWinningNumbersMap,
    setTotalPot,
  } = gameData;

  // Estados locales del componente
  const [markedNumbers, setMarkedNumbers] = React.useState<
    Map<number, Set<string>>
  >(new Map());
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [timeoutCountdown, setTimeoutCountdown] = React.useState<number | null>(
    null
  );
  const [timeoutStartTime, setTimeoutStartTime] = React.useState<number | null>(
    null
  );
  const [isGameStarting, setIsGameStarting] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);

  // Hook para conexión WebSocket
  useWebSocketConnection(roomId, gameStarted);

  // Actualizar contexto del juego para el Header
  React.useEffect(() => {
    const enrolledCount = room && typeof room === "object" && "enrolled_users_count" in room
      ? (typeof room.enrolled_users_count === "number" ? room.enrolled_users_count : 0)
      : (room && typeof room === "object" && "players" in room && Array.isArray(room.players)
          ? room.players.length
          : 0);
    
    setEnrolledUsersCount(enrolledCount);
    setIsGameActive(!roundFinished && gameStarted);
  }, [room, gameStarted, roundFinished, setEnrolledUsersCount, setIsGameActive]);

  // Countdown antes de comenzar (countdown interno de 5 segundos cuando el juego está listo)
  React.useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        setCountdown(0);
        // Comenzar el juego después del countdown
        setTimeout(() => {
          setCountdown(null);
          setIsCallingNumber(true);
          // Si no hay timestamp, establecer uno inicial para que se llame el primer número inmediatamente
          if (!lastCalledTimestamp) {
            // Establecer timestamp inicial (hace 7 segundos) para que se llame el primer número inmediatamente
            setLastCalledTimestamp(Date.now() - 7000);
          }
        }, 500);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    countdown,
    lastCalledTimestamp,
    setIsCallingNumber,
    setLastCalledTimestamp,
  ]);

  // Obtener el pattern del round actual directamente desde roundsData (debe estar antes de los hooks que lo usan)
  const currentBingoType: BingoType = React.useMemo(() => {
    const activeRound = roundsData.find((r) => {
      const status =
        typeof r.status_id === "object" && r.status_id ? r.status_id.name : "";
      return status === "in_progress" || status === "starting";
    });

    const maxRounds = totalRounds || 3;

    if (activeRound) {
      const pattern =
        typeof activeRound.pattern_id === "object" && activeRound.pattern_id
          ? activeRound.pattern_id.name
          : "";

      const isLastRound = activeRound.round_number === maxRounds;

      if (!isLastRound) {
        if (pattern === "full") {
          return "horizontal";
        }
      } else {
        if (pattern !== "full") {
          return "fullCard";
        }
      }

      return mapPatternToBingoType(pattern);
    }

    const currentRoundData = roundsData.find(
      (r) => r.round_number === currentRound
    );

    if (currentRoundData) {
      const pattern =
        typeof currentRoundData.pattern_id === "object" &&
        currentRoundData.pattern_id
          ? currentRoundData.pattern_id.name
          : "";

      const isLastRound = currentRound === maxRounds;

      if (!isLastRound) {
        if (pattern === "full") {
          return "horizontal";
        }
      } else {
        if (pattern !== "full") {
          return "fullCard";
        }
      }

      return mapPatternToBingoType(pattern);
    }

    if (roundBingoTypes.length > 0 && roundBingoTypes[currentRound - 1]) {
      return roundBingoTypes[currentRound - 1];
    }

    const isLastRound = currentRound === maxRounds;
    if (!isLastRound) {
      return "horizontal";
    } else {
      return "fullCard";
    }
  }, [roundsData, roundBingoTypes, currentRound, totalRounds]);

  // Hook para countdowns
  const {
    roomStartCountdown,
    setRoomStartCountdown,
    setRoomStartCountdownFinish,
    roundTransitionCountdown,
    setRoundTransitionCountdown,
    setRoundTransitionCountdownFinish,
    setRoundStartCountdownFinish,
    bingoClaimCountdown,
    setBingoClaimCountdown,
    setBingoClaimCountdownFinish,
    nextRoundNumber,
    setNextRoundNumber,
  } = useCountdowns(
    gameStarted,
    roomId,
    roomScheduledAt,
    serverTimeOffset,
    currentRound,
    roundFinished,
    calledNumbers
  );

  // Hook para progress bar
  const {
    progress,
    setProgress,
    progressIntervalRef,
  } = useGameProgress(
    isCallingNumber,
    roundFinished,
    roundEnded,
    lastCalledTimestamp,
    timeoutCountdown,
    timeoutStartTime,
    setTimeoutCountdown,
    setTimeoutStartTime
  );

  // Hook para isGameStarting
  useGameStarting(
    room,
    roomStartCountdown,
    roundTransitionCountdown,
    isCallingNumber,
    currentNumber,
    roundFinished,
    roomFinished,
    setIsGameStarting
  );

  // Hook para sincronización periódica del estado
  useGameStateSync(
    gameStarted,
    roomId,
    currentRound,
    bingoClaimCountdown,
    setCurrentRound,
    setCalledNumbers,
    setCurrentNumber,
    setLastNumbers,
    setLastCalledTimestamp,
    setMarkedNumbers,
    setRoundFinished,
    setRoundEnded,
    setIsCallingNumber,
    setProgress,
    setRoom,
    roundFinished
  );

  // Función helper para obtener números marcados de un cartón
  const getMarkedForCard = React.useMemo(
    () => createGetMarkedForCard(markedNumbers),
    [markedNumbers]
  );

  // Hook para handlers de bingo
  const bingoHandlers = useBingoHandlers(
    roomId,
    currentUserId,
    currentRound,
    playerCards,
    playerCardsData,
    markedNumbers,
    getMarkedForCard,
    currentBingoType,
    calledNumbers,
    setShowConfetti
  );

  const {
    modalOpen,
    setModalOpen,
    previewCardIndex,
    setPreviewCardIndex,
    bingoValidationOpen,
    setBingoValidationOpen,
    showConfetti: showConfettiFromHandler,
    showLoserAnimation,
    setShowLoserAnimation,
    currentRoundWinners,
    setCurrentRoundWinners,
    currentWinnerIndex,
    setCurrentWinnerIndex,
    winnerCardModalOpen,
    setWinnerCardModalOpen,
    selectedWinner,
    setSelectedWinner,
    patternModalOpen,
    setPatternModalOpen,
    handleCardClick: handleCardClickBase,
    handleCloseModal,
    handlePreviousCard,
    handleNextCard,
    handleBingo: handleBingoBase,
    handleCloseBingoValidation,
    handlePreviousWinner,
    handleNextWinner,
    checkBingo,
    isNumberCalled,
    isNumberMarked,
  } = bingoHandlers;

  // Combinar showConfetti de ambos lugares
  const showConfettiCombined = showConfetti || showConfettiFromHandler;
  
  // Sincronizar setShowConfetti para que ambos estados se actualicen juntos
  React.useEffect(() => {
    if (showConfettiFromHandler !== showConfetti) {
      setShowConfetti(showConfettiFromHandler);
    }
  }, [showConfettiFromHandler, showConfetti, setShowConfetti]);

  // Wrapper para handleCardClick que maneja el caso de sala finalizada
  const handleCardClick = React.useCallback((index: number) => {
    if (roomFinished && winners && winners.length > index) {
      setSelectedWinner(winners[index]);
      setWinnerCardModalOpen(true);
      return;
    }
    handleCardClickBase(index, roomFinished, winners);
  }, [roomFinished, winners, handleCardClickBase, setSelectedWinner, setWinnerCardModalOpen]);

  // Wrapper para handleNumberClick que actualiza markedNumbers
  const handleNumberClick = React.useCallback((number: number) => {
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
  }, [previewCardIndex, calledNumbers]);

  // Wrapper para handleBingo que pasa los setters necesarios
  const handleBingo = React.useCallback(() => {
    handleBingoBase(
      setMarkedNumbers,
      setRoundFinished,
      setRoundEnded,
      setIsCallingNumber,
      setProgress,
      handleCloseModal
    );
  }, [handleBingoBase, setMarkedNumbers, setRoundFinished, setRoundEnded, setIsCallingNumber, setProgress, handleCloseModal]);

  // Hook para WebSocket listeners
  useWebSocketListeners(
    gameStarted,
    roomId,
    currentRound,
    roundEnded,
    roundFinished,
    isCallingNumber,
    isGameStarting,
    roundTransitionCountdown,
    bingoClaimCountdown,
    lastCalledTimestamp,
    timeoutCountdown,
    timeoutStartTime,
    calledNumbers,
    playerCards,
    currentBingoType,
    totalRounds,
    room,
    getMarkedForCard,
    lastNumbers,
    setCurrentRound,
    setCalledNumbers,
    setCurrentNumber,
    setLastNumbers,
    setLastCalledTimestamp,
    setIsCallingNumber,
    setRoundEnded,
    setRoundFinished,
    setRoomFinished,
    setIsGameStarting,
    setProgress,
    setTimeoutCountdown,
    setTimeoutStartTime,
    setRoundTransitionCountdown,
    setRoundTransitionCountdownFinish,
    setRoundStartCountdownFinish,
    setBingoClaimCountdown,
    setBingoClaimCountdownFinish,
    setNextRoundNumber,
    setMarkedNumbers,
    setRoundsData,
    setRoundBingoTypes,
    setRoom,
    setTotalPot,
    setEnrolledUsersCount,
    setWinners,
    setPlayerCards,
    setPlayerCardsData,
    setWinningNumbersMap,
    setModalOpen,
    setPreviewCardIndex,
    setBingoValidationOpen,
    setCurrentRoundWinners,
    setCurrentWinnerIndex,
    setShowConfetti,
    setShowLoserAnimation,
    setRoomStartCountdown,
    setRoomStartCountdownFinish,
    progressIntervalRef
  );

  // Obtener premios reales de cada ronda desde el backend
  const roundPrizes = React.useMemo(() => {
    if (!roundsData || roundsData.length === 0) {
      return calculateRoundPrizes(totalPot, totalRounds);
    }
    
    const prizes = roundsData
      .sort((a, b) => a.round_number - b.round_number)
      .map((round) => {
        const rewardAmount = round.reward?.amount || 0;
        const percentToUse = round.reward?.percent || round.prize_percent;
        if (rewardAmount === 0 && totalPot > 0 && percentToUse) {
          return (totalPot * percentToUse) / 100;
        }
        return rewardAmount;
      });
    
    return prizes;
  }, [roundsData, totalPot, totalRounds]);
  
  const currentRoundPrize = roundPrizes[currentRound - 1] || 0;

  // Calcular el total de premios realmente entregados cuando la sala termina
  const totalPrizeDelivered = React.useMemo(() => {
    if (!roomFinished || !winners || winners.length === 0 || !roundsData) {
      return totalPot;
    }

    const roundsWithWinners = new Set(winners.map(w => w.round_number));
    const totalDelivered = roundsData
      .filter(round => roundsWithWinners.has(round.round_number))
      .reduce((sum, round) => sum + (round.reward?.amount || 0), 0);

    return totalDelivered > 0 ? totalDelivered : totalPot;
  }, [roomFinished, winners, roundsData, totalPot]);

  // Calcular los números del patrón de bingo para cada cartón
  const bingoPatternNumbersMap = React.useMemo(() => {
    const map = new Map<number, Set<string>>();
    playerCards.forEach((card, index) => {
      const cardMarked = getMarkedForCard(index);
      if (checkBingo(index)) {
        map.set(
          index,
          getBingoPatternNumbers(card, cardMarked, currentBingoType)
        );
      }
    });
    return map;
  }, [playerCards, currentBingoType, getMarkedForCard, checkBingo]);

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#1a1008",
          color: "#f5e6d3",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: "80px",
        }}
      >
        <CircularProgress sx={{ color: "#d4af37" }} />
      </Box>
    );
  }

  // Error state
  if (error || !room || playerCards.length === 0) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#1a1008",
          color: "#f5e6d3",
          paddingBottom: "80px",
        }}
      >
        <Container maxWidth="sm" sx={{ pt: "80px", pb: 4 }}>
          <Alert
            severity="error"
            sx={{
              backgroundColor: "rgba(201, 168, 90, 0.2)",
              color: "#c9a85a",
              border: "1px solid rgba(201, 168, 90, 0.4)",
              "& .MuiAlert-message": {
                whiteSpace: "pre-line",
              },
            }}
          >
            {error || "No se pudo cargar el juego"}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={gameInProgressStyles}>
      <BackgroundStars />

      <Container maxWidth="sm" sx={containerStyles}>
        <GameHeader
          currentRound={currentRound}
          currentRoundPrize={currentRoundPrize}
          currentBingoType={currentBingoType}
          roomName={
            room && typeof room === "object" && "name" in room
              ? String(room.name)
              : undefined
          }
          roomFinished={roomFinished}
          totalPrize={totalPrizeDelivered}
          enrolledUsersCount={
            room && typeof room === "object" && "enrolled_users_count" in room
              ? (typeof room.enrolled_users_count === "number" ? room.enrolled_users_count : 0)
              : (room && typeof room === "object" && "players" in room && Array.isArray(room.players)
                  ? room.players.length
                  : 0)
          }
          onPatternClick={() => setPatternModalOpen(true)}
        />

        <GameStatusCard
          currentRound={currentRound}
          totalRounds={totalRounds}
          lastNumbers={lastNumbers}
          currentNumber={currentNumber}
          calledNumbers={calledNumbers}
          progress={progress}
          countdown={countdown ?? undefined}
          isFinished={roundFinished || roomFinished}
          timeoutCountdown={roomFinished ? null : timeoutCountdown}
          roundTransitionCountdown={
            roomFinished ? null : roundTransitionCountdown
          }
          nextRoundNumber={roomFinished ? null : nextRoundNumber}
          roomStartCountdown={roomFinished ? null : roomStartCountdown}
          roomScheduledAt={roomFinished ? null : roomScheduledAt}
          roomFinished={roomFinished}
          bingoClaimCountdown={roomFinished ? null : bingoClaimCountdown}
          isCallingNumber={isCallingNumber}
          isGameStarting={isGameStarting}
        />

        <CardList
          cards={playerCards}
          cardsData={playerCardsData}
          calledNumbers={calledNumbers}
          markedNumbers={markedNumbers}
          hasBingo={checkBingo}
          onCardClick={handleCardClick}
          bingoPatternNumbersMap={bingoPatternNumbersMap}
          roomId={roomId}
          isGameFinished={roundFinished || roomFinished}
          winningNumbersMap={roomFinished ? winningNumbersMap : undefined}
          showWinners={roomFinished}
          winners={roomFinished ? winners : undefined}
          showLoserAnimation={showLoserAnimation}
          currentUserId={currentUserId}
        />
      </Container>

      {previewCardIndex !== null &&
        playerCards[previewCardIndex] &&
        (() => {
          const card = playerCards[previewCardIndex];
          const cardMarked = getMarkedForCard(previewCardIndex);
          const hasBingoOnCard = checkBingo(previewCardIndex);
          const bingoPatternNumbers = hasBingoOnCard
            ? getBingoPatternNumbers(card, cardMarked, currentBingoType)
            : new Set<string>();

          return (
            <CardPreviewModal
              open={modalOpen}
              onClose={handleCloseModal}
              onBingo={handleBingo}
              card={card}
              cardCode={
                playerCardsData[previewCardIndex]?.code ||
                String(previewCardIndex + 1)
              }
              hasBingo={hasBingoOnCard}
              isNumberCalled={isNumberCalled}
              isNumberMarked={(num) => isNumberMarked(num, previewCardIndex)}
              onNumberClick={handleNumberClick}
              onPrevious={handlePreviousCard}
              onNext={handleNextCard}
              hasPrevious={playerCards.length > 1}
              hasNext={playerCards.length > 1}
              previousHasBingo={
                playerCards.length > 1
                  ? checkBingo(
                      previewCardIndex === 0
                        ? playerCards.length - 1
                        : previewCardIndex - 1
                    )
                  : false
              }
              nextHasBingo={
                playerCards.length > 1
                  ? checkBingo(
                      previewCardIndex === playerCards.length - 1
                        ? 0
                        : previewCardIndex + 1
                    )
                  : false
              }
              bingoPatternNumbers={bingoPatternNumbers}
            />
          );
        })()}

      {/* Modal de validación con múltiples ganadores */}
      {currentRoundWinners.length > 0 && (
        <BingoValidationModal
          open={bingoValidationOpen}
          onClose={handleCloseBingoValidation}
          winners={currentRoundWinners}
          currentWinnerIndex={currentWinnerIndex}
          onPreviousWinner={handlePreviousWinner}
          onNextWinner={handleNextWinner}
          calledNumbers={calledNumbers}
        />
      )}

      {/* Modal del patrón de bingo */}
      <BingoPatternModal
        open={patternModalOpen}
        onClose={() => setPatternModalOpen(false)}
        pattern={currentBingoType}
      />

      {/* Modal del cartón ganador (solo cuando la sala está finalizada) */}
      <WinnerCardModal
        open={winnerCardModalOpen}
        onClose={() => setWinnerCardModalOpen(false)}
        winner={selectedWinner}
      />

      <ConfettiFireworks active={showConfettiCombined} />
    </Box>
  );
}
