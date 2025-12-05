import { useState } from "react";
import * as React from "react";
import { getCardsByRoomAndUser } from "../Services/cards.service";
import { claimBingo, type RoomWinner } from "../Services/bingo.service";
import { numberToBingoFormat } from "../utils/bingoUtils";
import { hasBingo } from "../utils/bingoLogic";
import type { BingoGrid } from "../utils/bingo";
import type { BingoType } from "../utils/bingoUtils";

/**
 * Hook para manejar los handlers relacionados con bingo y cartones
 */
export function useBingoHandlers(
  roomId: string | undefined,
  currentUserId: string | undefined,
  currentRound: number,
  playerCards: BingoGrid[],
  _playerCardsData: Array<{ _id: string; code: string }>,
  _markedNumbers: Map<number, Set<string>>,
  getMarkedForCard: (cardIndex: number) => Set<string>,
  currentBingoType: BingoType,
  calledNumbers: Set<string>,
  setShowConfetti: (value: boolean) => void
) {
  const [modalOpen, setModalOpen] = useState(false);
  const [previewCardIndex, setPreviewCardIndex] = useState<number | null>(null);
  const [bingoValidationOpen, setBingoValidationOpen] = useState(false);
  const [showConfettiLocal, setShowConfettiLocal] = useState(false);
  const [showLoserAnimation, setShowLoserAnimation] = useState(false);
  const [currentRoundWinners, setCurrentRoundWinners] = useState<
    import("../Components/BingoValidationModal").WinnerData[]
  >([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const [winnerCardModalOpen, setWinnerCardModalOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<RoomWinner | null>(null);
  const [patternModalOpen, setPatternModalOpen] = useState(false);

  const handleCardClick = (index: number, roomFinished: boolean, winners: RoomWinner[] | undefined) => {
    // Si la sala está finalizada y se están mostrando ganadores, abrir modal del winner
    if (roomFinished && winners && winners.length > index) {
      setSelectedWinner(winners[index]);
      setWinnerCardModalOpen(true);
      return;
    }
    
    // Comportamiento normal para cartones durante el juego
    setPreviewCardIndex(index);
    setModalOpen(true);
  };

  const handleNumberClick = (number: number) => {
    if (previewCardIndex === null || number === 0) return;

    const numberFormat = numberToBingoFormat(number);
    if (!calledNumbers.has(numberFormat)) return;

    // Esta función se actualizará desde el componente principal
    // ya que necesita acceso a setMarkedNumbers
  };

  const handleCloseModalLocal = () => {
    setModalOpen(false);
    setPreviewCardIndex(null);
  };

  const handlePreviousCard = () => {
    if (previewCardIndex === null || playerCards.length === 0) return;
    
    // Navegación infinita: si está en el primer cartón, ir al último
    if (previewCardIndex === 0) {
      setPreviewCardIndex(playerCards.length - 1);
    } else {
      setPreviewCardIndex(previewCardIndex - 1);
    }
  };

  const handleNextCard = () => {
    if (previewCardIndex === null || playerCards.length === 0) return;
    
    // Navegación infinita: si está en el último cartón, ir al primero
    if (previewCardIndex === playerCards.length - 1) {
      setPreviewCardIndex(0);
    } else {
      setPreviewCardIndex(previewCardIndex + 1);
    }
  };

  const handleBingo = async (
    _setMarkedNumbers: React.Dispatch<React.SetStateAction<Map<number, Set<string>>>>,
    _setRoundFinished: (value: boolean) => void,
    _setRoundEnded: (value: boolean) => void,
    _setIsCallingNumber: (value: boolean) => void,
    _setProgress: (value: number) => void,
    _handleCloseModal: () => void
  ) => {
    if (previewCardIndex === null || !roomId) {
      console.log(`[GameInProgress] ⚠️ handleBingo: previewCardIndex=${previewCardIndex}, roomId=${roomId}`);
      return;
    }

    if (!currentUserId) {
      console.error(`[GameInProgress] ❌ handleBingo: No hay userId disponible`);
      alert("Error: No se pudo identificar tu usuario. Por favor, inicia sesión nuevamente.");
      return;
    }

    try {
      console.log(`[GameInProgress] 🎯 Iniciando claim de bingo para Round ${currentRound}`);
      console.log(`[GameInProgress]    - Room ID: ${roomId}`);
      console.log(`[GameInProgress]    - User ID: ${currentUserId}`);
      console.log(`[GameInProgress]    - Preview Card Index: ${previewCardIndex}`);

      // Obtener el cartón y los números marcados
      const card = playerCards[previewCardIndex];
      if (!card) {
        console.error(`[GameInProgress] ❌ handleBingo: No se encontró el cartón en el índice ${previewCardIndex}`);
        return;
      }

      const cardMarked = getMarkedForCard(previewCardIndex);
      const markedNumbersArray = Array.from(cardMarked);
      console.log(`[GameInProgress]    - Números marcados: ${markedNumbersArray.length} números`);

      const cardsData = await getCardsByRoomAndUser(roomId, currentUserId);
      if (previewCardIndex >= cardsData.length) {
        console.error(`[GameInProgress] ❌ handleBingo: previewCardIndex (${previewCardIndex}) >= cardsData.length (${cardsData.length})`);
        return;
      }

      const cardId = cardsData[previewCardIndex]._id;
      console.log(`[GameInProgress]    - Card ID: ${cardId}`);

      // Llamar al endpoint de validación de bingo
      console.log(`[GameInProgress] 📤 Enviando request de claim bingo al backend...`);
      const result = await claimBingo(roomId, currentRound, {
        cardId,
        userId: currentUserId,
        markedNumbers: markedNumbersArray,
      });
      
      console.log(`[GameInProgress] ✅ Respuesta del backend:`, result);

      // Si el bingo es válido, cerrar el modal del cartón y mostrar confetti
      if (result.success) {
        console.log(`[GameInProgress] ✅ Bingo válido! Cerrando modal y mostrando confetti...`);
        // Cerrar el modal del cartón primero
        handleCloseModalLocal();

        // Actualizar estado
        // CRÍTICO: NO marcar el round como finalizado cuando el usuario canta bingo
        // El round solo se finaliza después de 45 segundos
        setShowConfettiLocal(true);
        setShowConfetti(true);

        // El modal de validación se abrirá cuando llegue el evento bingo-claimed
        // que se emite desde el backend para todos los usuarios

        // CRÍTICO: NO detener el juego cuando alguien canta bingo
        // El juego continúa durante la ventana de 45 segundos para que otros puedan cantar bingo

        setTimeout(() => {
          setShowConfettiLocal(false);
          setShowConfetti(false);
        }, 5000);
      } else {
        console.error(`[GameInProgress] ❌ Bingo no válido:`, result);
        alert(result.message || "El bingo no es válido. Por favor, verifica que todos los números estén marcados correctamente.");
      }
    } catch (error: unknown) {
      console.error(`[GameInProgress] ❌ Error al reclamar bingo:`, error);
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Error al validar el bingo. Por favor, verifica que todos los números estén marcados correctamente.";
      alert(errorMessage);
    }
  };

  const handleCloseBingoValidation = () => {
    setBingoValidationOpen(false);
    setCurrentRoundWinners([]);
    setCurrentWinnerIndex(0);
  };

  const handlePreviousWinner = () => {
    if (currentWinnerIndex > 0) {
      setCurrentWinnerIndex(currentWinnerIndex - 1);
    }
  };

  const handleNextWinner = () => {
    if (currentWinnerIndex < currentRoundWinners.length - 1) {
      setCurrentWinnerIndex(currentWinnerIndex + 1);
    }
  };

  const checkBingo = (cardIndex: number): boolean => {
    if (playerCards.length === 0) return false;
    const card = playerCards[cardIndex];
    if (!card) return false;
    const cardMarked = getMarkedForCard(cardIndex);
    return hasBingo(card, cardMarked, currentBingoType);
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

  return {
    modalOpen,
    setModalOpen,
    previewCardIndex,
    setPreviewCardIndex,
    bingoValidationOpen,
    setBingoValidationOpen,
    showConfetti: showConfettiLocal,
    setShowConfetti: setShowConfettiLocal,
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
    handleCardClick,
    handleNumberClick,
    handleCloseModal: handleCloseModalLocal,
    handlePreviousCard,
    handleNextCard,
    handleBingo,
    handleCloseBingoValidation,
    handlePreviousWinner,
    handleNextWinner,
    checkBingo,
    isNumberCalled,
    isNumberMarked,
  };
}
