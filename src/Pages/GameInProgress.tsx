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
import { disconnectSocket, onRoomPrizeUpdated } from "../Services/socket.service";
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
import { useBingoNotifications } from "../hooks/useBingoNotifications";
import { useRoomStartedNotification } from "../hooks/useRoomStartedNotification";
import { useReconnectSync } from "../hooks/useReconnectSync";
import type { RoomStateData } from "../Services/rooms.service";
import { getRoomPrizes } from "../Services/rooms.service";
import BingoNotificationToast from "../Components/BingoNotificationToast";
import RoomStartedNotification from "../Components/RoomStartedNotification";
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
    // FIX-CRITICAL: Ref para calledNumbers para evitar stale closures
    calledNumbersRef,
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
    // FASE 4: Para sincronización de progress bar con servidor
    nextCallAt,
    setNextCallAt,
    setServerTimeOffset,
    // P2-FIX: Datos de premios centralizados desde endpoint /prizes
    prizeData,
    setPrizeData,
  } = gameData;

  // Estados locales del componente
  const [markedNumbers, setMarkedNumbers] = React.useState<
    Map<number, Set<string>>
  >(new Map());
  const [countdown, setCountdown] = React.useState<number | null>(null);
  
  // FIX-ROUND-MARKS: Ref para trackear la ronda anterior y detectar cambios
  // Esto garantiza que markedNumbers se limpie cuando cambia la ronda,
  // independientemente de si los eventos WebSocket llegaron correctamente
  const previousRoundForMarksRef = React.useRef(currentRound);
  const [timeoutCountdown, setTimeoutCountdown] = React.useState<number | null>(
    null
  );
  const [timeoutStartTime, setTimeoutStartTime] = React.useState<number | null>(
    null
  );
  const [isGameStarting, setIsGameStarting] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);

  // FIX-ROUND-MARKS: useEffect para limpiar markedNumbers Y calledNumbers cuando cambia la ronda
  // Este es un safety net que garantiza que los números de la ronda anterior
  // no persistan y causen el error "número no ha salido" al cantar bingo en la nueva ronda
  // 
  // IMPORTANTE: Limpiamos AMBOS porque:
  // 1. markedNumbers: números que el usuario marcó manualmente (de ronda anterior)
  // 2. calledNumbers: números que el servidor llamó (pueden ser de ronda anterior si WebSocket no sincronizó)
  React.useEffect(() => {
    if (currentRound !== previousRoundForMarksRef.current) {
      const previousRound = previousRoundForMarksRef.current;
      console.log(
        `[GameInProgress] 🧹 FIX-ROUND-MARKS: Detectado cambio de ronda (${previousRound} → ${currentRound}). Limpiando estados...`
      );
      
      // Limpiar números marcados por el usuario
      setMarkedNumbers(new Map());
      console.log(
        `[GameInProgress] ✅ FIX-ROUND-MARKS: markedNumbers limpiados`
      );
      
      // Limpiar números llamados (serán recargados por WebSocket o sincronización)
      // Solo limpiar si estamos avanzando de ronda (no retrocediendo)
      if (currentRound > previousRound) {
        // Verificar si calledNumbers tiene datos de la ronda anterior
        // Usamos la ref para obtener el valor actual
        const currentCalledNumbers = calledNumbersRef.current;
        console.log(
          `[GameInProgress] 🔍 FIX-ROUND-MARKS: calledNumbers actuales: ${currentCalledNumbers.size} números`
        );
        
        // Limpiar calledNumbers para evitar desincronización
        setCalledNumbers(new Set());
        setCurrentNumber("");
        setLastNumbers([]);
        console.log(
          `[GameInProgress] ✅ FIX-ROUND-MARKS: calledNumbers limpiados para ronda ${currentRound}`
        );
      }
      
      previousRoundForMarksRef.current = currentRound;
      console.log(
        `[GameInProgress] ✅ FIX-ROUND-MARKS: Estados limpiados correctamente para ronda ${currentRound}`
      );
    }
  }, [currentRound, setCalledNumbers, setCurrentNumber, setLastNumbers]);

  // Hook para conexión WebSocket
  useWebSocketConnection(roomId, gameStarted);

  // P2-FIX: Escuchar actualizaciones de premios en tiempo real y actualizar prizeData
  React.useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onRoomPrizeUpdated(async (data) => {
      if (data.room_id === roomId) {
        console.log(`[GameInProgress] P2-FIX: Premio actualizado, recargando desde endpoint /prizes`);
        // Recargar premios desde el endpoint para mantener sincronía
        try {
          const prizesData = await getRoomPrizes(roomId);
          if (prizesData) {
            setPrizeData(prizesData);
            console.log(`[GameInProgress] P2-FIX: prizeData actualizado:`, {
              prize_pool: prizesData.prize_pool,
              round_prizes: prizesData.round_prizes,
            });
          }
        } catch (err) {
          console.warn("[GameInProgress] P2-FIX: Error al recargar premios:", err);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, setPrizeData]);

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
  // FIX-PATTERN: Incluir TODOS los estados activos para que el pattern se muestre correctamente
  const currentBingoType: BingoType = React.useMemo(() => {
    // FIX-PATTERN: Buscar ronda activa incluyendo "bingo_claimed"
    // Sin esto, al pasar de ronda durante la ventana de bingo, se muestra el pattern anterior
    const activeRound = roundsData.find((r) => {
      const status =
        typeof r.status_id === "object" && r.status_id ? r.status_id.name : "";
      return status === "in_progress" || status === "starting" || status === "bingo_claimed";
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

    // FIX-PATTERN: Si no hay ronda activa, usar el número de ronda actual
    // Esto es especialmente importante durante transiciones entre rondas
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

    // FIX-PATTERN: Fallback a roundBingoTypes que se actualiza por WebSocket
    // Esto asegura que si el pattern llega por evento antes que roundsData,
    // aún se muestre correctamente
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
    setTimeoutStartTime,
    // FASE 4: Parámetros para sincronización con servidor
    serverTimeOffset,
    nextCallAt
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
    roundFinished,
    // FASE 5: Pasar timestamp del último dato del WebSocket para evitar polling innecesario
    lastCalledTimestamp || undefined
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
    // ISSUE-1: Estados para controlar el botón de bingo
    hasClaimedBingoInRound,
    isClaimingBingo,
    // ISSUE-2: Estados para controlar cartones usados
    isCardClaimed,
    // FIX-SYNC: Estado de transición entre rondas
    setIsTransitioning,
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
    // ISSUE-FIX: Pasar estado para evitar "Mala Suerte" a usuarios que ya cantaron bingo
    hasClaimedBingoInRound,
    setRoomStartCountdown,
    setRoomStartCountdownFinish,
    progressIntervalRef,
    // FASE 4: Para sincronización de progress bar con servidor
    setServerTimeOffset,
    setNextCallAt,
    // FIX-SYNC: Para bloquear interacción durante transición de rondas
    setIsTransitioning
  );

  // ISSUE-5: Hook para notificaciones de bingo en tiempo real
  const { notifications: bingoNotifications, removeNotification: removeBingoNotification } = 
    useBingoNotifications({
      roomId,
      currentUserId,
      enabled: gameStarted && !roomFinished,
    });

  // ISSUE-6: Hook para notificación de inicio de sala
  const { 
    showNotification: showRoomStartedNotification, 
    roomName: roomStartedName, 
    hideNotification: hideRoomStartedNotification 
  } = useRoomStartedNotification({
    roomId,
    enabled: !roomFinished,
  });

  // ISSUE-7: Hook para sincronizar estado al reconectar WebSocket
  // ISSUE-3 FIX: Extraer forceSync para usarlo en visibilitychange
  const { forceSync } = useReconnectSync({
    roomId,
    enabled: gameStarted && !roomFinished,
    onStateSync: React.useCallback((state: RoomStateData) => {
      console.log("[GameInProgress] Sincronizando estado después de reconexión...");
      
      // ISSUE-3 CRITICAL FIX: Usar SOLO los números de la ronda ACTUAL, no de todas las rondas
      // state.calledNumbers contiene números de TODAS las rondas concatenados (incorrecto)
      // state.rounds[currentRound-1].called_numbers contiene solo los números de la ronda actual
      const currentRoundData = state.rounds?.find(r => r.round_number === state.currentRound);
      const currentRoundNumbers = currentRoundData?.called_numbers || [];
      
      console.log(`[GameInProgress] ISSUE-3 FIX: Usando números de ronda ${state.currentRound}: ${currentRoundNumbers.length} números (no ${state.calledNumbers?.length || 0} de todas las rondas)`);
      
      // FIX-RELOAD: NUNCA borrar números si ya tenemos más localmente
      // Esto previene que el sync con datos incompletos borre nuestro estado
      // FIX-CRITICAL: Usar REF para evitar stale closure - calledNumbers.size podría ser stale
      const localNumbersCount = calledNumbersRef.current.size;
      const serverNumbersCount = currentRoundNumbers.length;
      
      console.log(`[GameInProgress] FIX-CRITICAL: Comparando números (local ref: ${localNumbersCount}, servidor: ${serverNumbersCount})`);
      
      // Actualizar números llamados (SOLO de la ronda actual)
      if (currentRoundNumbers.length > 0) {
        // FIX-RELOAD: Solo actualizar si el servidor tiene MÁS números o estamos en una ronda diferente
        if (serverNumbersCount >= localNumbersCount || state.currentRound !== currentRound) {
        setCalledNumbers(new Set(currentRoundNumbers));
        
        // Actualizar último número y últimos 3 números
        const lastNum = currentRoundNumbers[currentRoundNumbers.length - 1];
        if (lastNum) {
          setCurrentNumber(lastNum);
          setLastNumbers(currentRoundNumbers.slice(-3).reverse());
        }
          console.log(`[GameInProgress] ✅ FIX-RELOAD: Números actualizados desde servidor (${serverNumbersCount} números)`);
      } else {
          console.log(`[GameInProgress] ⚠️ FIX-RELOAD: Ignorando sync con menos números (local: ${localNumbersCount}, servidor: ${serverNumbersCount})`);
        }
      } else if (state.currentRound !== currentRound) {
        // FIX-RELOAD: Solo limpiar si CAMBIAMOS de ronda
        // Esto previene que se borren números cuando el servidor no devuelve datos
        console.log(`[GameInProgress] 🔄 FIX-RELOAD: Cambiando de ronda ${currentRound} → ${state.currentRound}, limpiando números`);
        setCalledNumbers(new Set());
        setCurrentNumber("");
        setLastNumbers([]);
      } else {
        // FIX-RELOAD: NO limpiar si estamos en la misma ronda y el servidor no devuelve números
        console.log(`[GameInProgress] ⚠️ FIX-RELOAD: Servidor sin números para ronda ${state.currentRound}, manteniendo ${localNumbersCount} números locales`);
      }
      
      // Actualizar round actual
      if (state.currentRound && state.currentRound !== currentRound) {
        setCurrentRound(state.currentRound);
      }
      
      // ISSUE-3 FIX: Limpiar marcas si cambiamos de ronda
      if (state.currentRound && state.currentRound !== currentRound) {
        setMarkedNumbers(new Map());
      }
      
      // Actualizar estado de round basado en bingo claims
      if (state.bingoState.hasWinner || state.bingoState.windowActive) {
        setIsCallingNumber(false);
        
        // Si hay ventana de bingo activa, calcular tiempo restante
        if (state.bingoState.windowActive && state.bingoState.windowFinishAt) {
          const finishTime = new Date(state.bingoState.windowFinishAt).getTime();
          const remaining = Math.ceil((finishTime - Date.now()) / 1000);
          if (remaining > 0) {
            setBingoClaimCountdown(remaining);
          }
        }
      }
      
      console.log("[GameInProgress] Estado sincronizado:", {
        currentRoundNumbers: currentRoundNumbers.length,
        localNumbers: localNumbersCount,
        currentRound: state.currentRound,
        hasWinner: state.bingoState.hasWinner,
        windowActive: state.bingoState.windowActive,
      });
    // FIX-CRITICAL: Removido calledNumbers de deps - usamos calledNumbersRef para evitar stale closure
    }, [currentRound, calledNumbersRef, setCalledNumbers, setCurrentNumber, setLastNumbers, setCurrentRound, setIsCallingNumber, setBingoClaimCountdown, setMarkedNumbers]),
    onReconnect: React.useCallback(() => {
      console.log("[GameInProgress] WebSocket reconectado, sincronizando...");
    }, []),
  });

  // ISSUE-3 FIX: Sincronizar estado cuando el usuario vuelve de otra app
  // Esto previene que aparezcan números incorrectos cuando el usuario cambia de app
  React.useEffect(() => {
    if (!gameStarted || roomFinished || !roomId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("[GameInProgress] 📱 ISSUE-3 FIX: Usuario volvió a la app, forzando sincronización...");
        // Forzar sincronización inmediata cuando el usuario vuelve
        forceSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameStarted, roomFinished, roomId, forceSync]);

  // P2-FIX: Obtener premios desde endpoint centralizado /prizes como fuente de verdad
  // Si prizeData está disponible, usarlo. Si no, fallback al cálculo local.
  const roundPrizes = React.useMemo(() => {
    // P2-FIX: Usar prizeData del endpoint /prizes como FUENTE DE VERDAD
    if (prizeData && prizeData.round_prizes && prizeData.round_prizes.length > 0) {
      const prizes = prizeData.round_prizes
        .sort((a, b) => a.round_number - b.round_number)
        .map(rp => rp.amount);
      console.log(`[GameInProgress] P2-FIX: roundPrizes desde endpoint /prizes:`, prizes);
      return prizes;
    }
    
    // Fallback: calcular localmente si no hay prizeData
    if (!roundsData || roundsData.length === 0) {
      return calculateRoundPrizes(totalPot, totalRounds);
    }
    
    const prizes = roundsData
      .sort((a, b) => a.round_number - b.round_number)
      .map((round) => {
        const percentToUse = round.reward?.percent || round.prize_percent;
        // Siempre recalcular basándose en totalPot y el porcentaje
        // para que se actualice en tiempo real
        if (totalPot > 0 && percentToUse) {
          return (totalPot * percentToUse) / 100;
        }
        // Solo usar el valor pre-calculado si no hay totalPot
        return round.reward?.amount || 0;
      });
    
    console.log(`[GameInProgress] 💵 roundPrizes (fallback) con totalPot=${totalPot}:`, prizes);
    return prizes;
  }, [prizeData, roundsData, totalPot, totalRounds]);
  
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

        {/* FIX-SYNC: Derivar lastNumbers de calledNumbers para garantizar consistencia */}
        {/* Esto previene que el header muestre números diferentes al modal */}
        <GameStatusCard
          currentRound={currentRound}
          totalRounds={totalRounds}
          lastNumbers={
            // FIX-SYNC: Usar lastNumbers solo si está sincronizado con calledNumbers
            // De lo contrario, derivar de calledNumbers para mantener consistencia
            lastNumbers.length > 0 && lastNumbers.every(n => calledNumbers.has(n))
              ? lastNumbers
              : Array.from(calledNumbers).slice(-3).reverse()
          }
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
          // ISSUE-4: Pasar hasClaimedBingoInRound para evitar "Mala Suerte" si ya cantó bingo
          hasClaimedBingoInRound={hasClaimedBingoInRound}
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
              // ISSUE-1: Props para controlar el estado del botón de bingo
              hasClaimedBingoInRound={hasClaimedBingoInRound}
              isClaimingBingo={isClaimingBingo}
              // ISSUE-2: Verificar si el cartón actual ya fue usado
              isCurrentCardClaimed={
                playerCardsData[previewCardIndex]?._id
                  ? isCardClaimed(playerCardsData[previewCardIndex]._id)
                  : false
              }
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

      {/* ISSUE-5: Notificaciones de bingo en tiempo real */}
      {bingoNotifications.map((notification) => (
        <BingoNotificationToast
          key={notification.id}
          type={notification.type}
          playerName={notification.playerName}
          cardCode={notification.cardCode}
          message={notification.message}
          prizeAmount={notification.prizeAmount}
          pattern={notification.pattern}
          onClose={() => removeBingoNotification(notification.id)}
        />
      ))}

      {/* ISSUE-6: Notificación de inicio de sala */}
      {showRoomStartedNotification && (
        <RoomStartedNotification
          roomName={roomStartedName}
          onClose={hideRoomStartedNotification}
          autoHideDuration={6000}
        />
      )}
    </Box>
  );
}
