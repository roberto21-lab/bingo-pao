import { useState, useEffect, useRef } from "react";
import * as React from "react";
import { getCardsByRoomAndUser } from "../Services/cards.service";
import { claimBingo, BingoAlreadyClaimedError, CardAlreadyClaimedError, type RoomWinner } from "../Services/bingo.service";
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
  
  // ISSUE-1: Estado para rastrear si el usuario ya cantó bingo VÁLIDO en la ronda actual
  // FIX-SYNC: Solo se marca true si el bingo fue aceptado (válido)
  const [hasClaimedBingoInRound, setHasClaimedBingoInRound] = useState(false);
  const [isClaimingBingo, setIsClaimingBingo] = useState(false); // Para evitar doble-click
  
  // FIX-SYNC: Estado para bloquear interacción durante transición de rondas
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // ISSUE-2: Estado para rastrear qué cartones ya fueron usados para cantar bingo en esta ronda
  // Set de card_id que ya fueron usados
  const [claimedCardIds, setClaimedCardIds] = useState<Set<string>>(new Set());
  
  // Referencia al round anterior para detectar cambios de ronda
  const previousRoundRef = useRef(currentRound);
  
  // ISSUE-1 & ISSUE-2: Resetear los estados cuando cambia la ronda
  useEffect(() => {
    if (currentRound !== previousRoundRef.current) {
      console.log(`[useBingoHandlers] 🔄 Ronda cambió de ${previousRoundRef.current} a ${currentRound}, reseteando estados`);
      setHasClaimedBingoInRound(false);
      setClaimedCardIds(new Set()); // Resetear cartones usados para nueva ronda
      setIsTransitioning(false); // Asegurar que la transición se resetea
      previousRoundRef.current = currentRound;
    }
  }, [currentRound]);

  const handleCardClick = (index: number, roomFinished: boolean, winners: RoomWinner[] | undefined) => {
    // Si la sala está finalizada y se están mostrando ganadores, abrir modal del winner
    if (roomFinished && winners && winners.length > index) {
      setSelectedWinner(winners[index]);
      setWinnerCardModalOpen(true);
      return;
    }
    
    // ISSUE-1 FIX: Bloquear apertura de cartones si ya cantó bingo válido en esta ronda
    // El usuario debe esperar a que la ronda termine y comience la siguiente
    if (hasClaimedBingoInRound) {
      console.log(`[useBingoHandlers] ⚠️ Bloqueando apertura de cartón - ya cantaste bingo en esta ronda`);
      alert("Ya cantaste bingo en esta ronda. Espera a que comience la siguiente ronda.");
      return;
    }
    
    // ISSUE-1 FIX: Bloquear apertura durante transición de rondas
    if (isTransitioning) {
      console.log(`[useBingoHandlers] ⚠️ Bloqueando apertura de cartón - transición en progreso`);
      alert("Espera un momento, se está preparando la siguiente ronda.");
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

  // ISSUE-2: Helper para verificar si un cartón ya fue usado
  const isCardClaimed = (cardId: string): boolean => {
    return claimedCardIds.has(cardId);
  };

  const handleBingo = async (
    _setMarkedNumbers: React.Dispatch<React.SetStateAction<Map<number, Set<string>>>>,
    _setRoundFinished: (value: boolean) => void,
    _setRoundEnded: (value: boolean) => void,
    _setIsCallingNumber: (value: boolean) => void,
    _setProgress: (value: number) => void,
    _handleCloseModal: () => void
  ) => {
    // FIX-SYNC: Verificar si estamos en transición de rondas
    if (isTransitioning) {
      console.log(`[GameInProgress] ⚠️ handleBingo: Transición de ronda en progreso, no se puede cantar bingo`);
      alert("Espera un momento, se está preparando la siguiente ronda.");
      return;
    }
    
    // ISSUE-1: Verificar si ya se cantó bingo VÁLIDO en esta ronda
    if (hasClaimedBingoInRound) {
      console.log(`[GameInProgress] ⚠️ handleBingo: Ya se cantó bingo válido en esta ronda`);
      alert("Ya cantaste bingo válido en esta ronda.");
      return;
    }
    
    // ISSUE-1: Evitar doble-click
    if (isClaimingBingo) {
      console.log(`[GameInProgress] ⚠️ handleBingo: Ya hay un claim en progreso`);
      return;
    }
    
    if (previewCardIndex === null || !roomId) {
      console.log(`[GameInProgress] ⚠️ handleBingo: previewCardIndex=${previewCardIndex}, roomId=${roomId}`);
      return;
    }

    if (!currentUserId) {
      console.error(`[GameInProgress] ❌ handleBingo: No hay userId disponible`);
      alert("Error: No se pudo identificar tu usuario. Por favor, inicia sesión nuevamente.");
      return;
    }

    // ISSUE-1: Marcar que estamos procesando un claim
    setIsClaimingBingo(true);

    try {
      console.log(`[GameInProgress] 🎯 Iniciando claim de bingo para Round ${currentRound}`);
      console.log(`[GameInProgress]    - Room ID: ${roomId}`);
      console.log(`[GameInProgress]    - User ID: ${currentUserId}`);
      console.log(`[GameInProgress]    - Preview Card Index: ${previewCardIndex}`);

      // Obtener el cartón y los números marcados
      const card = playerCards[previewCardIndex];
      if (!card) {
        console.error(`[GameInProgress] ❌ handleBingo: No se encontró el cartón en el índice ${previewCardIndex}`);
        setIsClaimingBingo(false);
        return;
      }

      const cardMarked = getMarkedForCard(previewCardIndex);
      const markedNumbersArray = Array.from(cardMarked);
      console.log(`[GameInProgress]    - Números marcados: ${markedNumbersArray.length} números`);
      
      // FIX-SYNC: Validación pre-claim - verificar que los números marcados están en calledNumbers
      const invalidMarks = markedNumbersArray.filter(num => !calledNumbers.has(num));
      if (invalidMarks.length > 0) {
        console.warn(`[GameInProgress] ⚠️ FIX-SYNC: Detectados ${invalidMarks.length} números marcados que no están en calledNumbers:`, invalidMarks);
        console.warn(`[GameInProgress] ⚠️ Esto indica desincronización. Solicitando al usuario que recargue.`);
        alert("Se detectó un problema de sincronización. Algunos números marcados no coinciden con los números actuales de la ronda. Por favor, recarga la página para sincronizar.");
        setIsClaimingBingo(false);
        return;
      }

      const cardsData = await getCardsByRoomAndUser(roomId, currentUserId);
      if (previewCardIndex >= cardsData.length) {
        console.error(`[GameInProgress] ❌ handleBingo: previewCardIndex (${previewCardIndex}) >= cardsData.length (${cardsData.length})`);
        setIsClaimingBingo(false);
        return;
      }

      const cardId = cardsData[previewCardIndex]._id;
      console.log(`[GameInProgress]    - Card ID: ${cardId}`);

      // ISSUE-2: Verificar si este cartón ya fue usado en esta ronda
      if (isCardClaimed(cardId)) {
        console.log(`[GameInProgress] ⚠️ handleBingo: Este cartón ya fue usado en esta ronda`);
        alert("Este cartón ya fue usado para cantar bingo en esta ronda.");
        setIsClaimingBingo(false);
        return;
      }

      // Llamar al endpoint de validación de bingo
      console.log(`[GameInProgress] 📤 Enviando request de claim bingo al backend...`);
      const result = await claimBingo(roomId, currentRound, {
        cardId,
        userId: currentUserId,
        markedNumbers: markedNumbersArray,
      });
      
      console.log(`[GameInProgress] ✅ Respuesta del backend:`, result);

      // FIX-SYNC: Solo marcar hasClaimedBingoInRound si el bingo fue VÁLIDO
      // Si fue rechazado por sync issue, el usuario podrá reintentar
      if (result.success) {
        setHasClaimedBingoInRound(true);
        // ISSUE-2: Marcar este cartón como usado solo si fue válido
        setClaimedCardIds(prev => new Set([...prev, cardId]));
        
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
        // FIX-SYNC: NO marcar hasClaimedBingoInRound para bingos inválidos
        // Esto permite reintentar si fue un problema de sincronización
        console.warn(`[GameInProgress] ⚠️ Bingo no válido:`, result);
        alert(result.message || "El bingo no es válido. Por favor, verifica que todos los números estén marcados correctamente. Si el problema persiste, recarga la página.");
      }
    } catch (error: unknown) {
      console.error(`[GameInProgress] ❌ Error al reclamar bingo:`, error);
      
      // ISSUE-2: Manejar el error de cartón ya usado
      if (error instanceof CardAlreadyClaimedError) {
        console.log(`[GameInProgress] ⚠️ Cartón ya fue usado en esta ronda`);
        if (error.cardId) {
          setClaimedCardIds(prev => new Set([...prev, error.cardId!]));
        }
        alert(error.message);
      }
      // ISSUE-1: Manejar el error de bingo ya reclamado (solo si fue válido previamente)
      else if (error instanceof BingoAlreadyClaimedError) {
        console.log(`[GameInProgress] ⚠️ Bingo ya reclamado en esta ronda`);
        // FIX-SYNC: Solo bloquear si el mensaje indica que fue válido
        // El backend ahora permite reintento si el claim anterior fue inválido por sync
        setHasClaimedBingoInRound(true);
        alert(error.message);
      } else {
        // FIX-SYNC: Para otros errores, NO bloquear - puede ser un error de red transitorio
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Error al validar el bingo. Por favor, verifica que todos los números estén marcados correctamente.";
        alert(errorMessage);
      }
    } finally {
      // ISSUE-1: Siempre resetear el flag de claiming
      setIsClaimingBingo(false);
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
    // ISSUE-1: Exportar estados para controlar el botón de bingo
    hasClaimedBingoInRound,
    setHasClaimedBingoInRound,
    isClaimingBingo,
    // ISSUE-2: Exportar estados para controlar cartones usados
    claimedCardIds,
    setClaimedCardIds,
    isCardClaimed,
    // FIX-SYNC: Exportar estado de transición
    isTransitioning,
    setIsTransitioning,
  };
}
