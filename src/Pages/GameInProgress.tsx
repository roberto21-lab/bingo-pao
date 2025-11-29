import { Box, Container, CircularProgress, Alert } from "@mui/material";
import * as React from "react";
import { useParams } from "react-router-dom";
import type { BingoType } from "../utils/bingoUtils";
import { calculateRoundPrizes } from "../utils/bingoUtils";
import { hasBingo, getBingoPatternNumbers } from "../utils/bingoLogic";
import { numberToBingoFormat } from "../utils/bingoUtils";
import type { BingoGrid } from "../utils/bingo";
import GameHeader from "../Componets/GameHeader";
import GameStatusCard from "../Componets/GameStatusCard";
import CardList from "../Componets/CardList";
import CardPreviewModal from "../Componets/CardPreviewModal";
import BingoValidationModal from "../Componets/BingoValidationModal";
import BingoPatternModal from "../Componets/BingoPatternModal";
import ConfettiFireworks from "../Componets/ConfettiFireworks";
import BackgroundStars from "../Componets/BackgroundStars";
import WinnerCardModal from "../Componets/WinnerCardModal";
import { getCardsByRoomAndUser } from "../Services/cards.service";
import { getRoomRounds } from "../Services/rounds.service";
import { getCalledNumbers } from "../Services/calledNumbers.service";
import { claimBingo, getRoomWinners, type RoomWinner } from "../Services/bingo.service";
import {
  disconnectSocket,
  onNumberCalled,
  onRoundStarted,
  onRoundFinished,
  onTimeoutCountdown,
  onRoundTransitionCountdown,
  onBingoClaimCountdown,
  onBingoClaimed,
  onRoomStateSync,
  onRoundStartCountdown,
  onRoundCountdownStopped,
  onRoomStartCountdown,
  onRoomPending,
  onRoomStatusUpdated,
  onRoomFinished,
  onRoundStatusChanged,
  onRoomPrizeUpdated,
  onCardsEnrolled,
} from "../Services/socket.service";
import { mapPatternToBingoType } from "../utils/patternMapper";
import { useGameData } from "../hooks/useGameData";
import { useWebSocketConnection } from "../hooks/useWebSocketConnection";
import { useAuth } from "../hooks/useAuth";
import { getUserId } from "../Services/auth.service";

function convertCardNumbers(numbers: (number | "FREE")[][]): number[][] {
  return numbers.map((row) => row.map((num) => (num === "FREE" ? 0 : num)));
}

// Funciones auxiliares movidas a hooks/utils

export default function GameInProgress() {
  React.useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const currentUserId = user?.id || getUserId() || undefined;

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
    setTimeUntilStart,
    setTotalPot,
  } = gameData;

  // Estados locales del componente
  const [markedNumbers, setMarkedNumbers] = React.useState<
    Map<number, Set<string>>
  >(new Map());
  const [modalOpen, setModalOpen] = React.useState(false);
  const [patternModalOpen, setPatternModalOpen] = React.useState(false);
  const [previewCardIndex, setPreviewCardIndex] = React.useState<number | null>(
    null
  );
  const [bingoValidationOpen, setBingoValidationOpen] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [showLoserAnimation, setShowLoserAnimation] = React.useState(false);
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [timeoutCountdown, setTimeoutCountdown] = React.useState<number | null>(
    null
  );
  const [timeoutStartTime, setTimeoutStartTime] = React.useState<number | null>(
    null
  );
  const [roundTransitionCountdown, setRoundTransitionCountdown] =
    React.useState<number | null>(null);
  const [nextRoundNumber, setNextRoundNumber] = React.useState<number | null>(
    null
  );
  const [bingoClaimCountdown, setBingoClaimCountdown] = React.useState<
    number | null
  >(null);
  const [roomStartCountdown, setRoomStartCountdown] = React.useState<
    number | null
  >(null);
  const [roomStartCountdownFinish, setRoomStartCountdownFinish] =
    React.useState<number | null>(null);
  const [roundStartCountdownFinish, setRoundStartCountdownFinish] =
    React.useState<number | null>(null);
  const [roundTransitionCountdownFinish, setRoundTransitionCountdownFinish] =
    React.useState<number | null>(null);
  const [bingoClaimCountdownFinish, setBingoClaimCountdownFinish] =
    React.useState<number | null>(null);
  const [isGameStarting, setIsGameStarting] = React.useState(false);
  const [currentRoundWinners, setCurrentRoundWinners] = React.useState<
    import("../Componets/BingoValidationModal").WinnerData[]
  >([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = React.useState(0);
  const [winnerCardModalOpen, setWinnerCardModalOpen] = React.useState(false);
  const [selectedWinner, setSelectedWinner] = React.useState<RoomWinner | null>(null);
  const progressIntervalRef = React.useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  const CALL_INTERVAL = 7000;
  const TIMEOUT_COUNTDOWN_DURATION = 10000;

  // CRÍTICO: Usar refs para acceder a valores actuales sin causar re-registros de listeners
  // Estos refs se actualizan en un useEffect separado para mantener los valores actuales
  const currentRoundRef = React.useRef(currentRound);
  const roomIdRef = React.useRef(roomId);
  const roundFinishedRef = React.useRef(roundFinished);
  const bingoClaimCountdownRef = React.useRef(bingoClaimCountdown);
  const isCallingNumberRef = React.useRef(isCallingNumber);
  const isGameStartingRef = React.useRef(isGameStarting);
  const roundTransitionCountdownRef = React.useRef(roundTransitionCountdown);
  const lastCalledTimestampRef = React.useRef(lastCalledTimestamp);
  const timeoutCountdownRef = React.useRef(timeoutCountdown);
  const timeoutStartTimeRef = React.useRef(timeoutStartTime);
  
  // Actualizar refs cuando cambian los valores (sin causar re-renders del useEffect principal)
  React.useEffect(() => {
    currentRoundRef.current = currentRound;
    roomIdRef.current = roomId;
    roundFinishedRef.current = roundFinished;
    bingoClaimCountdownRef.current = bingoClaimCountdown;
    isCallingNumberRef.current = isCallingNumber;
    isGameStartingRef.current = isGameStarting;
    roundTransitionCountdownRef.current = roundTransitionCountdown;
    lastCalledTimestampRef.current = lastCalledTimestamp;
    timeoutCountdownRef.current = timeoutCountdown;
    timeoutStartTimeRef.current = timeoutStartTime;
  }, [currentRound, roomId, roundFinished, bingoClaimCountdown, isCallingNumber, isGameStarting, roundTransitionCountdown, lastCalledTimestamp, timeoutCountdown, timeoutStartTime]);

  // Hook para conexión WebSocket
  useWebSocketConnection(roomId, gameStarted);

  // Los datos del juego ahora se cargan con useGameData hook

  // Countdown de inicio de sala (solo para la primera ronda, antes de que comience el juego)
  React.useEffect(() => {
    // Solo mostrar countdown si:
    // 1. Es la primera ronda (currentRound === 1)
    // 2. El juego aún no ha comenzado (no hay números llamados)
    // 3. Hay una fecha programada (roomScheduledAt)
    // 4. El round no está finalizado
    if (
      currentRound !== 1 ||
      roundFinished ||
      !roomScheduledAt ||
      calledNumbers.size > 0
    ) {
      setRoomStartCountdown(null);
      setTimeUntilStart(null);
      return;
    }

    const updateCountdown = () => {
      // Usar tiempo del cliente ajustado con el offset del servidor para mayor precisión
      const now = new Date();
      const adjustedNow = new Date(now.getTime() + serverTimeOffset);
      const scheduledTime = new Date(roomScheduledAt);
      const timeRemaining = Math.floor(
        (scheduledTime.getTime() - adjustedNow.getTime()) / 1000
      );

      // Actualizar tiempo restante siempre
      setTimeUntilStart(timeRemaining > 0 ? timeRemaining : null);

      if (timeRemaining <= 0) {
        // El tiempo ya pasó, limpiar countdown
        setRoomStartCountdown(null);
        setTimeUntilStart(null);
        return;
      }

      if (timeRemaining <= 45) {
        // Mostrar countdown cuando queden 45 segundos o menos
        setRoomStartCountdown(timeRemaining);
      } else {
        // Si faltan más de 45 segundos, no mostrar countdown pero mantener el tiempo restante
        setRoomStartCountdown(null);
      }
    };

    // Actualizar inmediatamente
    updateCountdown();

    // Actualizar cada segundo
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [
    currentRound,
    roundFinished,
    roomScheduledAt,
    calledNumbers.size,
    serverTimeOffset,
    setTimeUntilStart,
  ]);

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
            setLastCalledTimestamp(Date.now() - CALL_INTERVAL);
          }
        }, 500);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    countdown,
    lastCalledTimestamp,
    CALL_INTERVAL,
    setIsCallingNumber,
    setLastCalledTimestamp,
  ]);

  // NO hacer polling de rounds - usar solo eventos de Socket.IO
  // El evento 'round-finished' ya maneja la finalización del round

  // La conexión WebSocket ahora se maneja con useWebSocketConnection hook

  // Conexión WebSocket y sincronización en tiempo real
  // IMPORTANTE: Este efecto debe continuar escuchando eventos incluso cuando roundFinished es true
  // para poder recibir eventos de transición y de inicio de nueva ronda
  React.useEffect(() => {
    // Si el juego no ha comenzado o no hay roomId, no hacer nada
    if (!gameStarted || !roomId) {
      return;
    }

    console.log(`[GameInProgress] 🔌 Configurando listeners WebSocket para room ${roomId}, round ${currentRound}`);

    // Si el round está finalizado o no se está llamando números, limpiar progress bar pero seguir escuchando eventos
    if (roundEnded || roundFinished || !isCallingNumber) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // NO retornar aquí - necesitamos seguir escuchando eventos de transición
    }

    let isMounted = true; // Flag para evitar actualizaciones después de desmontar

    // IMPORTANTE: Sincronizar estado completo cuando te unes a una sala con juego activo
    // Esto asegura que todos los usuarios vean exactamente lo mismo
    const unsubscribeRoomStateSync = onRoomStateSync((data) => {
      if (!isMounted || data.room_id !== roomId) {
        return;
      }

      if (data.round) {
        const roundStatus = data.round.status;
        console.log(
          `[GameInProgress] 🔄 Sincronizando estado: Round ${data.round.round_number}, status: ${roundStatus}`
        );

        // Actualizar round actual
        if (data.round.round_number !== currentRound) {
          setCurrentRound(data.round.round_number);
        }

        if (roundStatus === "starting") {
          // Round está en countdown, no mostrar números aún
          console.log(
            `[GameInProgress] Round ${data.round.round_number} está en countdown (starting), esperando...`
          );
          setIsCallingNumber(false);
          // NO establecer isGameStarting aquí - el useEffect lo manejará basado en countdowns activos
          setRoundEnded(false);
          setRoundFinished(false);
          // CRÍTICO: Si hay un round activo, la sala NO está finalizada
          setRoomFinished(false);
          // El countdown se manejará con el evento round-start-countdown
        } else if (roundStatus === "in_progress") {
          console.log(
            `[GameInProgress] 🔄 Sincronizando estado: Round ${data.round.round_number}, ${data.round.called_count} números llamados`
          );

          // CRÍTICO: Si hay un round en progreso, la sala NO está finalizada
          setRoomFinished(false);

          // Sincronizar números llamados
          if (data.round.called_numbers.length > 0) {
            const calledSet = new Set(
              data.round.called_numbers.map((cn) => cn.number)
            );
            setCalledNumbers(calledSet);

            // Actualizar último número llamado
            const lastCalled =
              data.round.called_numbers[data.round.called_numbers.length - 1];
            setCurrentNumber(lastCalled.number);

            if (data.round.last_called_at) {
              setLastCalledTimestamp(
                new Date(data.round.last_called_at).getTime()
              );
            }

            // Actualizar últimos 3 números
            const lastThree = data.round.called_numbers
              .slice(-3)
              .reverse()
              .map((cn) => cn.number);
            setLastNumbers(lastThree);
          }

          // El juego ya está en progreso
          setIsGameStarting(false);
          setIsCallingNumber(true);
        } else if (roundStatus === "finished") {
          // Round finalizado (después de los 45 segundos)
          setIsCallingNumber(false);
          setRoundEnded(true);
          setRoundFinished(true);
          // NOTA: No cambiar roomFinished aquí - solo se cambia cuando la sala completa está finished
        } else if (roundStatus === "bingo_claimed") {
          // Round con bingo reclamado (ventana de 45 segundos activa)
          // CRÍTICO: NO marcar el round como finalizado cuando está en "bingo_claimed"
          // El round solo se finaliza después de 45 segundos
          setIsCallingNumber(false); // Detener llamada de números
          setRoundEnded(false); // El round NO ha terminado, solo tiene bingo reclamado
          setRoundFinished(false); // El round NO está finalizado, solo en "bingo_claimed"
          // NOTA: No cambiar roomFinished aquí - solo se cambia cuando la sala completa está finished
        } else {
          // Estado desconocido o pending
          setIsCallingNumber(false);
          // NO establecer isGameStarting aquí - el useEffect lo manejará basado en countdowns activos
          // CRÍTICO: Si hay un round (aunque esté en pending), la sala NO está finalizada
          setRoomFinished(false);
        }
      } else {
        // No hay ronda activa
        console.log(`[GameInProgress] No hay ronda activa en la sala`);
        setCurrentRound(1);
        setCalledNumbers(new Set());
        setCurrentNumber("");
        setLastNumbers([]);
        setLastCalledTimestamp(null);
        // NO establecer isGameStarting aquí - el useEffect lo manejará basado en countdowns activos
        setIsCallingNumber(false);
        setRoundEnded(false);
        setRoundFinished(false);
      }
    });

    const UPDATE_INTERVAL = 50; // Actualizar progress cada 50ms para suavidad

    // Función para actualizar el progress bar basado en el último timestamp o countdown
    // CRÍTICO: Usar refs para acceder a valores actuales sin depender del closure
    const updateProgress = () => {
      // Solo actualizar si se están llamando números (usar ref para valor actual)
      if (!isCallingNumberRef.current) {
        return;
      }

      // Si hay countdown de timeout activo, mostrar progreso del countdown
      const currentTimeoutCountdown = timeoutCountdownRef.current;
      const currentTimeoutStartTime = timeoutStartTimeRef.current;
      if (currentTimeoutCountdown !== null && currentTimeoutStartTime !== null) {
        const now = Date.now();
        const elapsed = now - currentTimeoutStartTime;
        const remaining = TIMEOUT_COUNTDOWN_DURATION - elapsed;
        const progressValue = Math.max(
          0,
          Math.min((elapsed / TIMEOUT_COUNTDOWN_DURATION) * 100, 100)
        );
        setProgress(progressValue);

        // Actualizar countdown cada segundo
        const secondsRemaining = Math.ceil(remaining / 1000);
        if (secondsRemaining !== currentTimeoutCountdown && secondsRemaining >= 0) {
          setTimeoutCountdown(secondsRemaining);
        }

        // Si el countdown terminó, limpiar
        if (remaining <= 0) {
          setTimeoutCountdown(null);
          setTimeoutStartTime(null);
        }
        return;
      }

      // Progress bar normal para números (usar ref para valor actual)
      const currentLastCalledTimestamp = lastCalledTimestampRef.current;
      if (!currentLastCalledTimestamp) {
        setProgress(0);
        return;
      }

      const now = Date.now();
      const timeSinceLastCall = now - currentLastCalledTimestamp;
      const progressValue = Math.min(
        (timeSinceLastCall / CALL_INTERVAL) * 100,
        100
      );
      setProgress(progressValue);
    };

    // Escuchar eventos de números llamados en tiempo real
    // CRÍTICO: Usar refs para acceder a valores actuales sin causar re-registros
    const unsubscribeNumberCalled = onNumberCalled((data) => {
      // CRÍTICO: Procesar el evento inmediatamente sin delays ni verificaciones innecesarias
      // Verificar flag antes de procesar
      if (!isMounted) {
        return;
      }

      // Verificación rápida de round/room
      if (data.round_number !== currentRoundRef.current || data.room_id !== roomIdRef.current) {
        return;
      }

      // No procesar si el round está finalizado o hay bingo claim activo
      if (roundFinishedRef.current || bingoClaimCountdownRef.current !== null) {
        return;
      }

      // CRÍTICO: Actualizar TODOS los estados de forma síncrona e inmediata
      // Esto asegura que el número aparezca instantáneamente sin delays
      const calledTimestamp = new Date(data.called_at).getTime();
      
      // Actualizar refs primero para que estén disponibles inmediatamente
      lastCalledTimestampRef.current = calledTimestamp;
      
      // Actualizar estados de forma batch para evitar múltiples re-renders
      setCalledNumbers((prev) => {
        // Verificación rápida de duplicados
        if (prev.has(data.number)) {
          return prev;
        }
        return new Set([...prev, data.number]);
      });

      // Actualizar número actual y timestamp inmediatamente
      setCurrentNumber(data.number);
      setLastCalledTimestamp(calledTimestamp);
      
      // Actualizar últimos números
      setLastNumbers((prevLast: string[]) => {
        const updated = [data.number, ...(prevLast || [])].slice(0, 3);
        return updated;
      });

      // Resetear progress bar
      setProgress(0);

      // CRÍTICO: Activar isCallingNumber inmediatamente si no está activo
      // Esto asegura que el progress bar funcione desde el primer número
      if (!isCallingNumberRef.current) {
        setIsCallingNumber(true);
        setRoundEnded(false);
      }

      // Limpiar countdowns y estados de "iniciando" inmediatamente
      if (roundTransitionCountdownRef.current !== null) {
        setRoundTransitionCountdown(null);
        setRoundTransitionCountdownFinish(null);
        setRoundStartCountdownFinish(null);
      }

      if (isGameStartingRef.current) {
        setIsGameStarting(false);
      }
    });

    // Escuchar eventos de countdown de timeout
    const unsubscribeTimeoutCountdown = onTimeoutCountdown((data) => {
      if (!isMounted) return;

      if (data.round_number === currentRound && data.room_id === roomId) {
        setTimeoutCountdown(data.seconds_remaining);
        setTimeoutStartTime(Date.now());
      }
    });

    // Escuchar eventos de round iniciado
    // CRÍTICO: Usar refs para acceder a valores actuales sin depender del closure
    const unsubscribeRoundStarted = onRoundStarted(async (data) => {
      if (!isMounted) return;

      if (data.room_id !== roomIdRef.current) {
        return;
      }

        // IMPORTANTE: Aceptar cualquier round nuevo (mayor o igual al actual)
      // CRÍTICO: Usar ref para obtener el valor actual de currentRound
      const currentRoundValue = currentRoundRef.current;
      if (data.round_number < currentRoundValue) {
          console.log(
          `[GameInProgress] Ignorando round-started para Round ${data.round_number} (round actual: ${currentRoundValue})`
          );
          return;
        }

        console.log(
        `[GameInProgress] Nueva ronda iniciada: Round ${data.round_number} (round anterior: ${currentRoundValue})`
        );

        // CRÍTICO: Recargar rounds para obtener el pattern actualizado del nuevo round
        // Esto asegura que el pattern mostrado sea el correcto del round activo
        try {
        // CRÍTICO: Usar ref para obtener el valor actual de roomId
        const updatedRoundsData = await getRoomRounds(roomIdRef.current);
          // IMPORTANTE: Ordenar rounds por round_number para asegurar que el índice corresponda al round
          const sortedUpdatedRounds = [...updatedRoundsData].sort(
            (a, b) => a.round_number - b.round_number
          );

          // Guardar rounds actualizados
          setRoundsData(sortedUpdatedRounds);

          const updatedBingoTypes = sortedUpdatedRounds.map((round) => {
            const pattern =
              typeof round.pattern_id === "object" && round.pattern_id
                ? round.pattern_id.name
                : "";
            return mapPatternToBingoType(pattern);
          });
          setRoundBingoTypes(updatedBingoTypes);

          // CRÍTICO: Buscar el round activo y actualizar currentRound si es necesario
          // Esto asegura que currentRound siempre apunte al round que realmente está corriendo
          const activeRound = sortedUpdatedRounds.find((r) => {
            const status =
              typeof r.status_id === "object" && r.status_id
                ? r.status_id.name
                : "";
            return status === "in_progress" || status === "starting";
          });

          if (activeRound) {
            console.log(
              `[GameInProgress] Round activo detectado: Round ${
                activeRound.round_number
              }, Pattern: ${
                typeof activeRound.pattern_id === "object" &&
                activeRound.pattern_id
                  ? activeRound.pattern_id.name
                  : "unknown"
              }`
            );
          // CRÍTICO: Usar ref para comparar con el valor actual
          if (activeRound.round_number !== currentRoundRef.current) {
              setCurrentRound(activeRound.round_number);
            }
          } else {
            // Si no hay round activo, usar el round del evento
            console.log(
              `[GameInProgress] No se encontró round activo, usando round del evento: ${data.round_number}`
            );
            setCurrentRound(data.round_number);
          }

          console.log(
            `[GameInProgress] Patterns actualizados para ${sortedUpdatedRounds.length} rounds`
          );
        } catch (error) {
          console.error(
            `[GameInProgress] Error al recargar rounds para actualizar patterns:`,
            error
          );
        }

        // IMPORTANTE: Limpiar el countdown de transición PRIMERO antes de cualquier otra cosa
        // Esto asegura que el UI muestre "Iniciando juego..." en lugar del countdown
        setRoundTransitionCountdown(null);
        setNextRoundNumber(null);
        setRoundTransitionCountdownFinish(null);
        setRoundStartCountdownFinish(null);

        // Actualizar round actual
        setCurrentRound(data.round_number);

        // Limpiar todos los números llamados localmente
        setCalledNumbers(new Set());
        setCurrentNumber("");
        setLastNumbers([]);
        setLastCalledTimestamp(null);

        // Limpiar números marcados en todos los cartones
        setMarkedNumbers(new Map());

        // CRÍTICO: Resetear estados de la ronda - esto hace que "FINALIZADA" desaparezca
        setRoundFinished(false);
        setRoundEnded(false);
        setIsCallingNumber(false); // IMPORTANTE: NO activar isCallingNumber hasta que llegue el primer número
        setProgress(0);
        setTimeoutCountdown(null);
        setTimeoutStartTime(null);
        setBingoClaimCountdown(null); // Limpiar countdown de bingo claim
        setBingoClaimCountdownFinish(null);
        setShowConfetti(false);
        setBingoValidationOpen(false);
        setRoomStartCountdown(null); // Limpiar countdown de inicio de sala
        setRoomStartCountdownFinish(null);

        // NO establecer isGameStarting aquí - el useEffect lo manejará basado en countdowns activos
        // Si hay un countdown activo, isGameStarting será false automáticamente

        // CRÍTICO: Cargar números llamados si ya hay números en la nueva ronda
        // OPTIMIZADO: Usar Promise sin await para no bloquear el flujo y evitar delays
        getCalledNumbers(roomIdRef.current, data.round_number)
          .then((calledNumbersData) => {
            if (!isMounted) return;
            
            if (calledNumbersData.length > 0) {
              const calledSet = new Set(calledNumbersData.map((cn) => cn.number));
              setCalledNumbers(calledSet);

              const lastCalled = calledNumbersData[calledNumbersData.length - 1];
              setCurrentNumber(lastCalled.number);
              const timestamp = new Date(lastCalled.called_at).getTime();
              setLastCalledTimestamp(timestamp);
              lastCalledTimestampRef.current = timestamp;

              const lastThree = calledNumbersData
                .slice(-3)
                .reverse()
                .map((cn) => cn.number);
              setLastNumbers(lastThree);

              setIsGameStarting(false);
              setIsCallingNumber(true);
              setRoundEnded(false);
              setRoundFinished(false);
              setProgress(0);
            }
          })
          .catch((error) => {
            console.error(
              `[GameInProgress] Error al cargar números de Round ${data.round_number}:`,
              error
            );
          });
    });

    // Escuchar eventos de bingo reclamado
    const unsubscribeBingoClaimed = onBingoClaimed(async (data) => {
      if (!isMounted) return;

      // IMPORTANTE: Procesar el evento si es para el round actual O si el round_number es mayor
      // Esto asegura que el evento se procese incluso si hay un problema de sincronización
      if (
        data.room_id === roomId &&
        (data.round_number === currentRound ||
          data.round_number >= currentRound)
      ) {
        console.log(
          `[GameInProgress] Bingo reclamado en round ${data.round_number}${
            data.winner.is_first
              ? " (PRIMER BINGO - iniciando ventana de 45s)"
              : " (bingo adicional durante ventana)"
          }`
        );

        // IMPORTANTE: Si el round del evento es mayor al actual, actualizar el round actual
        // Esto previene que el round retroceda cuando se reclama bingo
        if (data.round_number > currentRound) {
          console.log(
            `[GameInProgress] Actualizando round actual desde bingo reclamado: Round ${data.round_number} (antes: Round ${currentRound})`
          );
          setCurrentRound(data.round_number);
        }

        if (data.winner.is_first) {
          // Detener la llamada de números cuando se reclama el primer bingo
          setIsCallingNumber(false);
          setProgress(0);
          setTimeoutCountdown(null);
          setTimeoutStartTime(null);

          // Cerrar TODOS los modales de cartones cuando hay bingo
          setModalOpen(false);
          setPreviewCardIndex(null);

          // Verificar si el usuario tiene bingo en alguno de sus cartones
          let userHasBingo = false;
          for (let i = 0; i < playerCards.length; i++) {
            const card = playerCards[i];
            const cardMarked = getMarkedForCard(i);
            if (hasBingo(card, cardMarked, currentBingoType)) {
              userHasBingo = true;
              break;
            }
          }

          // Si el usuario NO tiene bingo, mostrar animación de "mala suerte"
          if (!userHasBingo) {
            setShowLoserAnimation(true);
            // Ocultar la animación después de 3 segundos
            setTimeout(() => {
              setShowLoserAnimation(false);
            }, 3000);
          }

          // Obtener todos los ganadores de la ronda actual
          try {
            console.log(
              `[GameInProgress] Obteniendo ganadores para Round ${data.round_number}...`
            );
            const winnersData = await getRoomWinners(roomId);
            const roundWinners = winnersData.filter(
              (w) => w.round_number === data.round_number
            );
            console.log(
              `[GameInProgress] Encontrados ${roundWinners.length} ganador(es) para Round ${data.round_number}`
            );

            // CRÍTICO: Cargar números llamados desde el backend si no están actualizados
            // Esto asegura que tengamos todos los números necesarios para marcar los cartones
            let allCalledNumbers = calledNumbers;
            try {
              const calledNumbersData = await getCalledNumbers(
                roomId,
                data.round_number
              );
              if (calledNumbersData.length > 0) {
                allCalledNumbers = new Set(
                  calledNumbersData.map((cn) => cn.number)
                );
                setCalledNumbers(allCalledNumbers);
                console.log(
                  `[GameInProgress] Cargados ${calledNumbersData.length} números llamados para validación de bingo`
                );
              }
            } catch (error) {
              console.error(
                `[GameInProgress] Error al cargar números llamados para validación:`,
                error
              );
            }

            // Construir array de WinnerData para el modal
            const winnersForModal: import("../Componets/BingoValidationModal").WinnerData[] =
              [];

            for (const winner of roundWinners) {
              try {
                const { api } = await import("../Services/api");
                const cardResponse = await api.get(`/cards/${winner.card_id}`);

                if (cardResponse.data) {
                  const cardData = cardResponse.data;
                  const cardNumbers = convertCardNumbers(cardData.numbers_json);
                  const cardMarked = new Set<string>();

                  // Obtener los números marcados del cartón ganador usando los números llamados
                  allCalledNumbers.forEach((num) => {
                    for (let row = 0; row < cardNumbers.length; row++) {
                      for (let col = 0; col < cardNumbers[row].length; col++) {
                        const cardNum = cardNumbers[row][col];
                        if (cardNum !== 0) {
                          const numFormat = numberToBingoFormat(cardNum);
                          if (numFormat === num) {
                            cardMarked.add(num);
                            break;
                          }
                        }
                      }
                    }
                  });

                  // Calcular los números del patrón de bingo
                  const bingoPatternNumbers = getBingoPatternNumbers(
                    cardNumbers,
                    cardMarked,
                    currentBingoType
                  );

                  winnersForModal.push({
                    card: cardNumbers,
                    cardCode: cardData.code || "N/A",
                    markedNumbers: cardMarked,
                    bingoPatternNumbers: bingoPatternNumbers,
                  });

                  console.log(
                    `[GameInProgress] ✅ Cartón ganador ${cardData.code} procesado correctamente`
                  );
                }
              } catch (cardError) {
                console.error(
                  `[GameInProgress] Error al obtener cartón ganador ${winner.card_id}:`,
                  cardError
                );
              }
            }

            if (winnersForModal.length > 0) {
              // Encontrar el índice del ganador actual (el que acaba de reclamar bingo)
              const currentWinnerIdx = roundWinners.findIndex(
                (w) => w.card_id === data.winner.card_id
              );
              console.log(
                `[GameInProgress] Abriendo modal de validación con ${winnersForModal.length} ganador(es)`
              );
              setCurrentRoundWinners(winnersForModal);
              setCurrentWinnerIndex(
                currentWinnerIdx >= 0 ? currentWinnerIdx : 0
              );
              setBingoValidationOpen(true);
              // CRÍTICO: NO marcar el round como finalizado cuando alguien canta bingo
              // El round solo se finaliza después de 45 segundos
              // NO establecer roundFinished ni roundEnded aquí
              // setRoundFinished(true);  // REMOVIDO: El round NO está finalizado, solo en "bingo_claimed"
              // setRoundEnded(true);     // REMOVIDO: El round NO ha terminado, solo tiene bingo reclamado
            } else {
              console.warn(
                `[GameInProgress] ⚠️ No se pudieron cargar los datos de los ganadores para mostrar el modal`
              );
            }
          } catch (error) {
            console.error(
              "[GameInProgress] Error al obtener ganadores de la ronda:",
              error
            );
          }
        }
      }
    });

    // Escuchar eventos de countdown de ventana de bingo (45 segundos)
    const unsubscribeBingoClaimCountdown = onBingoClaimCountdown((data) => {
      if (!isMounted) return;

      // IMPORTANTE: Procesar el countdown si es para el round actual O si el round_number es mayor
      // Esto asegura que el countdown funcione incluso si hay un problema de sincronización
      if (
        data.room_id === roomId &&
        (data.round_number === currentRound ||
          data.round_number >= currentRound)
      ) {
        console.log(
          `[GameInProgress] Countdown de ventana de bingo: ${data.seconds_remaining}s restantes para Round ${data.round_number}`
        );

        // IMPORTANTE: Si el round del evento es mayor al actual, actualizar el round actual
        // Esto previene que el round retroceda cuando se reclama bingo
        if (data.round_number > currentRound) {
          console.log(
            `[GameInProgress] Actualizando round actual desde countdown de bingo: Round ${data.round_number} (antes: Round ${currentRound})`
          );
          setCurrentRound(data.round_number);
        }

        if (data.finish_timestamp) {
          // Usar timestamp para sincronización precisa
          setBingoClaimCountdownFinish(data.finish_timestamp);
          // El hook calculará el tiempo restante automáticamente
        } else if (data.seconds_remaining > 0) {
          // Fallback si no hay timestamp (compatibilidad hacia atrás)
          setBingoClaimCountdown(data.seconds_remaining);
        } else {
          // Cuando llega a 0, limpiar el countdown (la ronda se finalizará automáticamente)
          console.log(
            `[GameInProgress] Ventana de bingo cerrada. Finalizando round ${data.round_number}...`
          );
          setBingoClaimCountdown(null);
          setBingoClaimCountdownFinish(null);
        }
      }
    });

    // Escuchar eventos de round finalizado
    // CRÍTICO: Usar refs para acceder a valores actuales sin depender del closure
    const unsubscribeRoundFinished = onRoundFinished((data) => {
      if (!isMounted) return;

      // CRÍTICO: Usar refs para obtener valores actuales
      if (data.round_number === currentRoundRef.current && data.room_id === roomIdRef.current) {
        console.log(
          `[GameInProgress] Round ${data.round_number} finalizado. Esperando countdown de transición...`
        );
        setRoundFinished(true);
        setRoundEnded(true);
        setIsCallingNumber(false);
        setProgress(0);
        setTimeoutCountdown(null);
        setTimeoutStartTime(null);
        setBingoClaimCountdown(null); // Limpiar countdown de bingo cuando el round se finaliza
        // El countdown de transición comenzará automáticamente desde el backend
      }
    });

    // Escuchar eventos de countdown de transición entre rondas
    // CRÍTICO: Usar refs para acceder a valores actuales sin depender del closure
    const unsubscribeRoundTransitionCountdown = onRoundTransitionCountdown(
      (data) => {
        if (!isMounted) return;

        // CRÍTICO: Usar ref para obtener el valor actual de roomId
        if (data.room_id !== roomIdRef.current) {
          return;
        }

          console.log(
            `[GameInProgress] Countdown de transición: ${data.seconds_remaining}s para Round ${data.next_round_number}`
          );
          
          // CRÍTICO: Limpiar roundFinished cuando comienza la transición
          // Esto hace que el status "FINALIZADA" desaparezca inmediatamente
          setRoundFinished(false);
          setRoundEnded(false);
          
          // CRÍTICO: Actualizar el round actual cuando comienza la transición
          // Esto asegura que el UI muestre el round correcto durante el countdown
        // Usar ref para obtener el valor actual de currentRound
        const currentRoundValue = currentRoundRef.current;
        if (data.next_round_number && data.next_round_number > currentRoundValue) {
            console.log(
            `[GameInProgress] Actualizando round actual durante transición: Round ${data.next_round_number} (antes: Round ${currentRoundValue})`
            );
            setCurrentRound(data.next_round_number);
          }
          
          if (data.finish_timestamp) {
            // Usar timestamp para sincronización precisa
          setRoundTransitionCountdownFinish((prevFinish: any) => {
              // Si ya hay un countdown activo para este round, mantener el timestamp original
            // CRÍTICO: Usar ref para comparar con el valor actual
            if (prevFinish && data.next_round_number === currentRoundRef.current) {
                return prevFinish;
              }
              return data.finish_timestamp;
            });
            setNextRoundNumber(data.next_round_number);
            setIsCallingNumber(false);
            // El hook calculará el tiempo restante automáticamente
          } else if (data.seconds_remaining > 0) {
            // Fallback si no hay timestamp (compatibilidad hacia atrás)
            setRoundTransitionCountdown(data.seconds_remaining);
            setNextRoundNumber(data.next_round_number);
            setIsCallingNumber(false);
          } else {
            // Cuando llega a 0, limpiar el countdown (la nueva ronda comenzará automáticamente)
            console.log(
              `[GameInProgress] Countdown de transición completado. Esperando inicio de Round ${data.next_round_number}...`
            );
            setRoundTransitionCountdown(null);
            setNextRoundNumber(null);
            setRoundTransitionCountdownFinish(null);
            // El evento round-started se emitirá inmediatamente después, que limpiará todo
        }
      }
    );

    // Escuchar eventos de sala en pending
    const unsubscribeRoomPending = onRoomPending((data) => {
      if (!isMounted) return;

      if (data.room_id === roomId) {
        console.log(
          `[GameInProgress] Sala ${
            data.room_name
          } está en estado 'pending'. Próximo round: ${
            data.next_round_number || "N/A"
          }`
        );
        // Limpiar estados de la ronda anterior
        setRoundFinished(true);
        setRoundEnded(true);
        setIsCallingNumber(false);
        setProgress(0);
        setBingoClaimCountdown(null);
        setRoundTransitionCountdown(null);
        setNextRoundNumber(data.next_round_number || null);
        // El countdown de transición comenzará automáticamente desde el backend
      }
    });

    // Escuchar actualizaciones de status de sala en tiempo real
    const unsubscribeRoomStatusUpdated = onRoomStatusUpdated((data) => {
      if (!isMounted) return;

      if (data.room_id === roomId) {
        console.log(
          `[GameInProgress] Status de sala actualizado: ${data.status}`
        );

        // CRÍTICO: Actualizar roomFinished basado en el nuevo status
        if (data.status === "finished") {
          console.log(
            `[GameInProgress] ⚠️ Sala marcada como 'finished', actualizando roomFinished a true`
          );
          setRoomFinished(true);
        } else if (data.status === "in_progress" || data.status === "pending") {
          console.log(
            `[GameInProgress] ✅ Sala marcada como '${data.status}', actualizando roomFinished a false`
          );
          setRoomFinished(false);
        }

        // Actualizar el status de la sala localmente
        if (room) {
          setRoom({
            ...room,
            status:
              data.status === "in_progress"
                ? "in_progress"
                : data.status === "pending"
                ? "pending"
                : data.status === "finished"
                ? "finished"
                : room.status,
          });
        }
      }
    });

    // Escuchar actualizaciones de premio en tiempo real
    const unsubscribeRoomPrizeUpdated = onRoomPrizeUpdated((data) => {
      if (!isMounted) return;

      if (data.room_id === roomId) {
        console.log(
          `[GameInProgress] Premio actualizado: Total pot: ${data.total_pot}, Prize pool: ${data.total_prize}, Usuarios inscritos: ${data.enrolled_users_count || 0}`
        );
        // CRÍTICO: Usar total_prize (90% del premio pool) en lugar de total_pot (100% del dinero recaudado)
        // Esto asegura que todos los usuarios vean el mismo premio
        setTotalPot(data.total_prize);
        
        // Actualizar el número de usuarios inscritos si está disponible
        if (data.enrolled_users_count !== undefined) {
          setRoom((prevRoom) => {
            if (prevRoom && typeof prevRoom === "object") {
              return {
                ...prevRoom,
                enrolled_users_count: data.enrolled_users_count,
              };
            }
            return prevRoom;
          });
        }
      }
    });

    // Escuchar eventos de cartones inscritos para actualizar el contador de usuarios
    const unsubscribeCardsEnrolled = onCardsEnrolled((data) => {
      if (!isMounted) return;

      if (data.room_id === roomId && data.enrolled_users_count !== undefined) {
        console.log(
          `[GameInProgress] Cartones inscritos: ${data.enrolled_count} cartones por usuario ${data.user_id}, Total usuarios: ${data.enrolled_users_count}`
        );
        // Actualizar el número de usuarios inscritos
        setRoom((prevRoom) => {
          if (prevRoom && typeof prevRoom === "object") {
            return {
              ...prevRoom,
              enrolled_users_count: data.enrolled_users_count,
            };
          }
          return prevRoom;
        });
      }
    });

    // Escuchar eventos de countdown de inicio de sala (pending → in_progress)
    // CRÍTICO: Solo actualizar el timestamp una vez al inicio del countdown, no en cada evento
    const unsubscribeRoomStartCountdown = onRoomStartCountdown((data: any) => {
      if (!isMounted) return;

      if (data.room_id === roomId) {
        // CRÍTICO: NO iniciar countdown de sala si hay un countdown de transición activo
        // Esto previene que el countdown de sala interfiera con la transición entre rounds
        if (roundTransitionCountdown !== null && roundTransitionCountdown > 0) {
        console.log(
            `[GameInProgress] Ignorando countdown de inicio de sala: hay countdown de transición activo (${roundTransitionCountdown}s)`
        );
          return;
        }
        
        // CRÍTICO: Solo establecer el timestamp UNA VEZ al inicio del countdown
        // Si ya tenemos un countdown activo, NO actualizarlo
        // Esto previene que múltiples eventos reinicien el countdown
        if (data.finish_timestamp) {
          setRoomStartCountdownFinish((prevFinish: any) => {
            // Si ya hay un countdown activo, mantener el timestamp original
            // Solo actualizar si no hay countdown activo
            if (prevFinish) {
              // Ya hay un countdown activo, mantener el timestamp original
              return prevFinish;
            }
            // Es un nuevo countdown, establecer el timestamp
        console.log(
              `[GameInProgress] Iniciando countdown de inicio de sala: ${data.seconds_remaining}s (finish: ${new Date(data.finish_timestamp).toISOString()})`
            );
            return data.finish_timestamp;
          });
        }
        
        // CRÍTICO: Actualizar el countdown actual incluso si no hay finish_timestamp
        // Esto asegura que si el usuario entra cuando la sala ya está en pending, vea el countdown
        if (data.seconds_remaining > 0) {
          setRoomStartCountdown(data.seconds_remaining);
          // Si no hay finish_timestamp pero hay seconds_remaining, calcular uno aproximado
          if (!data.finish_timestamp) {
            const estimatedFinish = Date.now() + (data.seconds_remaining * 1000);
            setRoomStartCountdownFinish((prevFinish) => {
              // Solo establecer si no hay uno previo
              if (!prevFinish) {
                console.log(
                  `[GameInProgress] Estableciendo finish_timestamp estimado para countdown de inicio de sala: ${data.seconds_remaining}s`
                );
                return estimatedFinish;
              }
              return prevFinish;
            });
          }
        } else if (data.seconds_remaining === 0) {
          // Cuando llega a 0, limpiar el countdown
          setRoomStartCountdown(null);
          setRoomStartCountdownFinish(null);
        }
      }
    });

    // Escuchar eventos de countdown antes de empezar a llamar números en una nueva ronda (20 segundos)
    // CRÍTICO: Solo actualizar el timestamp una vez al inicio del countdown, no en cada evento
    const unsubscribeRoundStartCountdown = onRoundStartCountdown((data: any) => {
      if (!isMounted) return;

      // IMPORTANTE: Aceptar countdown para el round actual O para un round mayor
      // Esto permite que el frontend se actualice incluso si hay problemas de sincronización
      if (
        data.room_id === roomId &&
        (data.round_number === currentRound ||
          data.round_number >= currentRound)
      ) {
        // Si el round del evento es mayor, actualizar el round actual
        if (data.round_number > currentRound) {
          console.log(
            `[GameInProgress] Actualizando round actual desde countdown: Round ${data.round_number} (antes: Round ${currentRound})`
          );
          setCurrentRound(data.round_number);
        }

        // CRÍTICO: Solo establecer el timestamp UNA VEZ al inicio del countdown
        // Si ya tenemos un countdown activo para este round, verificar si el nuevo timestamp es diferente
        // Si es diferente, es un countdown obsoleto y debemos ignorarlo
        if (data.finish_timestamp) {
          setRoundStartCountdownFinish((prevFinish: any) => {
            // Si ya hay un countdown activo para este round, verificar si el nuevo timestamp es más reciente
            if (prevFinish && data.round_number === currentRound) {
              // Si el nuevo timestamp es diferente (más antiguo o más reciente), mantener el original
              // Solo actualizar si no hay countdown activo
              if (prevFinish !== data.finish_timestamp) {
                console.log(
                  `[GameInProgress] ⚠️ Ignorando countdown obsoleto para Round ${data.round_number}. Timestamp actual: ${new Date(prevFinish).toISOString()}, nuevo: ${new Date(data.finish_timestamp).toISOString()}`
                );
              return prevFinish;
              }
            }
            // Es un nuevo countdown, establecer el timestamp
        console.log(
              `[GameInProgress] Iniciando countdown para Round ${data.round_number}: ${data.seconds_remaining}s (finish: ${new Date(data.finish_timestamp).toISOString()})`
        );
            return data.finish_timestamp;
          });
          setNextRoundNumber(data.round_number);
          setIsCallingNumber(false);
        } else if (data.seconds_remaining === 0) {
          // Cuando llega a 0, limpiar el countdown (los números comenzarán a llamarse)
          console.log(
            `[GameInProgress] Countdown de inicio completado para Round ${data.round_number}. Los números comenzarán a llamarse...`
          );
          setRoundTransitionCountdown(null);
          setNextRoundNumber(null);
          setRoundStartCountdownFinish(null);
        }
        // Si seconds_remaining > 0 pero no hay finish_timestamp, el countdown ya está corriendo
        // No hacer nada, el useEffect lo manejará
      }
    });
    
    // Listener para detener countdowns obsoletos
    const unsubscribeRoundCountdownStopped = onRoundCountdownStopped((data: any) => {
      if (!isMounted) return;
      
      if (data.room_id === roomId && data.round_number === currentRound) {
        console.log(
          `[GameInProgress] 🛑 Countdown detenido por el servidor para Round ${data.round_number}. Limpiando...`
        );
        setRoundStartCountdownFinish(null);
        setNextRoundNumber(null);
        setRoundTransitionCountdown(null);
        setRoundTransitionCountdownFinish(null);
      }
    });

    // Escuchar eventos de cambio de status de round
    // CRÍTICO: Este evento notifica cuando el round cambia de "starting" (countdown) a "in_progress" (llamando números)
    // CRÍTICO: Usar refs para acceder a valores actuales sin depender del closure
    const unsubscribeRoundStatusChanged = onRoundStatusChanged((data: any) => {
      if (!isMounted) return;

      // CRÍTICO: Usar refs para obtener valores actuales
      const currentRoomId = roomIdRef.current;
      const currentRoundValue = currentRoundRef.current;

      // Aceptar eventos para el round actual o para un round mayor (para manejar sincronización)
      if (data.room_id === currentRoomId && (data.round_number === currentRoundValue || data.round_number >= currentRoundValue)) {
        console.log(
          `[GameInProgress] Round ${data.round_number} cambió a status '${data.status}'`
        );

        // Si el round del evento es mayor, actualizar el round actual
        if (data.round_number > currentRoundValue) {
          console.log(
            `[GameInProgress] Actualizando round actual desde round-status-changed: Round ${data.round_number} (antes: Round ${currentRoundValue})`
          );
          setCurrentRound(data.round_number);
        }

        // Cuando el round cambia a "in_progress", el countdown terminó
        // Los números comenzarán a llamarse, así que limpiar el countdown y NO mostrar "Iniciando juego..."
        if (data.status === "in_progress") {
          // CRÍTICO: Limpiar estados inmediatamente sin delays
          setRoundTransitionCountdown(null);
          setRoundStartCountdownFinish(null);
          setRoundTransitionCountdownFinish(null);
          setRoundFinished(false);
          setRoundEnded(false);
          setIsGameStarting(false);
          
          // CRÍTICO: Cargar números llamados de forma asíncrona pero sin bloquear
          // Usar una promesa sin await para no bloquear el flujo
          getCalledNumbers(currentRoomId, data.round_number)
            .then((calledNumbersData) => {
              if (!isMounted) return;
              
              if (calledNumbersData.length > 0) {
                const calledSet = new Set(calledNumbersData.map((cn) => cn.number));
                setCalledNumbers(calledSet);

                const lastCalled = calledNumbersData[calledNumbersData.length - 1];
                setCurrentNumber(lastCalled.number);
                const timestamp = new Date(lastCalled.called_at).getTime();
                setLastCalledTimestamp(timestamp);
                lastCalledTimestampRef.current = timestamp;

                const lastThree = calledNumbersData
                  .slice(-3)
                  .reverse()
                  .map((cn) => cn.number);
                setLastNumbers(lastThree);

                setIsCallingNumber(true);
                setRoundEnded(false);
                setRoundFinished(false);
                setProgress(0);
              }
            })
            .catch((error) => {
              console.error(
                `[GameInProgress] Error al cargar números cuando round cambió a "in_progress":`,
                error
              );
            });
        }
      }
    });

    // Escuchar eventos de sala finalizada
    const unsubscribeRoomFinished = onRoomFinished(async (data) => {
      if (!isMounted) return;

      if (data.room_id === roomId) {
        console.log(
          `[GameInProgress] Sala ${data.room_name} finalizada. Cargando ganadores...`
        );

        // Marcar la sala como finalizada
        setRoomFinished(true);
        setRoundFinished(true);
        setRoundEnded(true);
        setIsCallingNumber(false);
        setProgress(0);
        setRoundTransitionCountdown(null);
        setNextRoundNumber(null);
        setBingoClaimCountdown(null);
        setTimeoutCountdown(null);
        setTimeoutStartTime(null);

        // Cargar ganadores de todas las rondas
        try {
          const winnersData = await getRoomWinners(roomId);
          setWinners(winnersData);

          // Convertir ganadores a cartones y crear mapa de números ganadores
          const winnerCards: BingoGrid[] = [];
          const winnerCardsData: Array<{ _id: string; code: string }> = [];
          const winningNumbers = new Map<number, Set<string>>();

          // Ordenar ganadores por round_number para asegurar orden correcto
          const sortedWinners = [...winnersData].sort(
            (a, b) => a.round_number - b.round_number
          );

          sortedWinners.forEach((winner, index) => {
            console.log(
              `[GameInProgress] Procesando ganador - Ronda ${winner.round_number}: Cartón ${winner.card_code} (ID: ${winner.card_id})`
            );
            winnerCards.push(convertCardNumbers(winner.card_numbers));
            winnerCardsData.push({
              _id: winner.card_id,
              code: winner.card_code,
            });
            winningNumbers.set(index, new Set(winner.bingo_numbers));
          });

          console.log(
            `[GameInProgress] Total ganadores cargados: ${winnerCards.length}`
          );
          console.log(
            `[GameInProgress] Códigos de cartones:`,
            winnerCardsData.map((c) => c.code)
          );

          setPlayerCards(winnerCards);
          setPlayerCardsData(winnerCardsData);
          setWinningNumbersMap(winningNumbers);

          // Cargar números llamados de todas las rondas para mostrar en los cartones ganadores
          const allCalledNumbers = new Set<string>();
          for (const winner of winnersData) {
            winner.called_numbers.forEach((num: string) =>
              allCalledNumbers.add(num)
            );
          }
          setCalledNumbers(allCalledNumbers);

          // Establecer el round actual al último round (ronda 3)
          setCurrentRound(totalRounds);
        } catch (error) {
          console.error(`[GameInProgress] Error al cargar ganadores:`, error);
        }
      }
    });

    // Verificar periódicamente el round actual (cada 5 segundos) para sincronizar
    const checkCurrentRound = async () => {
      if (!isMounted || !roomId) return;

      // IMPORTANTE: No verificar el round si hay un bingo reclamado (countdown activo)
      // Esto evita que el round retroceda cuando se reclama bingo
      if (bingoClaimCountdown !== null) {
        return;
      }

      try {
        const roundsData = await getRoomRounds(roomId);

        // Buscar round en starting, progreso o con bingo reclamado
        let newCurrentRoundData = roundsData.find((r) => {
          const status =
            typeof r.status_id === "object" && r.status_id
              ? r.status_id.name
              : "";
          return (
            status === "starting" ||
            status === "in_progress" ||
            status === "bingo_claimed"
          );
        });

        // Si no hay round en progreso, buscar el siguiente round en "pending" (a punto de iniciar)
        if (!newCurrentRoundData) {
          const pendingRounds = roundsData.filter((r) => {
            const status =
              typeof r.status_id === "object" && r.status_id
                ? r.status_id.name
                : "";
            return status === "pending";
          });

          if (pendingRounds.length > 0) {
            // Ordenar por round_number y tomar el menor (el siguiente a iniciar)
            pendingRounds.sort((a, b) => a.round_number - b.round_number);
            newCurrentRoundData = pendingRounds[0];
            console.log(
              `[GameInProgress] Round en 'pending' encontrado: Round ${newCurrentRoundData.round_number} (próximo a iniciar)`
            );
          }
        }

        // Si aún no hay round, buscar el último round finalizado
        if (!newCurrentRoundData) {
          const finishedRounds = roundsData.filter((r) => {
            const status =
              typeof r.status_id === "object" && r.status_id
                ? r.status_id.name
                : "";
            return status === "finished";
          });

          if (finishedRounds.length > 0) {
            finishedRounds.sort((a, b) => b.round_number - a.round_number);
            newCurrentRoundData = finishedRounds[0];
          }
        }

        // IMPORTANTE: Solo actualizar si el nuevo round es mayor o igual al actual
        // Esto evita que el round retroceda
        if (
          newCurrentRoundData &&
          newCurrentRoundData.round_number !== currentRound
        ) {
          // Solo actualizar si el nuevo round es mayor (avanzar) o si el round actual no existe en los datos
          const currentRoundExists = roundsData.some(
            (r) => r.round_number === currentRound
          );

          // CRÍTICO: También actualizar si el round del backend es igual al actual pero el estado es diferente
          // Esto maneja el caso donde el round está en transición pero el frontend aún muestra "FINALIZADA"
          const backendRoundStatus = typeof newCurrentRoundData.status_id === "object" && newCurrentRoundData.status_id
            ? newCurrentRoundData.status_id.name
            : "";
          
          // CRÍTICO: Si el round encontrado está en "pending" y es mayor al actual, actualizar
          // Esto permite que el frontend se actualice cuando el siguiente round está listo para iniciar
          const isPendingAndNext = backendRoundStatus === "pending" && newCurrentRoundData.round_number > currentRound;
          
          const shouldUpdate = 
            newCurrentRoundData.round_number > currentRound ||
            !currentRoundExists ||
            isPendingAndNext ||
            (newCurrentRoundData.round_number === currentRound && 
             (backendRoundStatus === "in_progress" || backendRoundStatus === "starting") && 
             roundFinished);

          if (shouldUpdate) {
            console.log(
              `[GameInProgress] Round actualizado desde verificación periódica: Round ${newCurrentRoundData.round_number} (antes: Round ${currentRound})`
            );
            setCurrentRound(newCurrentRoundData.round_number);

            // Si es un nuevo round, limpiar números
            if (newCurrentRoundData.round_number > currentRound) {
              setCalledNumbers(new Set());
              setCurrentNumber("");
              setLastNumbers([]);
              setLastCalledTimestamp(null);
              setMarkedNumbers(new Map());
              setRoundFinished(false);
              setRoundEnded(false);
              setIsCallingNumber(true);
              setProgress(0);

              // Cargar números de la nueva ronda
              try {
                const calledNumbersData = await getCalledNumbers(
                  roomId,
                  newCurrentRoundData.round_number
                );
                if (calledNumbersData.length > 0) {
                  const calledSet = new Set(
                    calledNumbersData.map((cn) => cn.number)
                  );
                  setCalledNumbers(calledSet);

                  const lastCalled =
                    calledNumbersData[calledNumbersData.length - 1];
                  setCurrentNumber(lastCalled.number);
                  setLastCalledTimestamp(
                    new Date(lastCalled.called_at).getTime()
                  );

                  const lastThree = calledNumbersData
                    .slice(-3)
                    .reverse()
                    .map((cn) => cn.number);
                  setLastNumbers(lastThree);
                }
              } catch (error) {
                console.error(
                  "Error al cargar números del round actualizado:",
                  error
                );
              }
            }
          } else {
            console.log(
              `[GameInProgress] Ignorando actualización de round (evitar retroceso): Round ${newCurrentRoundData.round_number} <= Round ${currentRound}`
            );
          }
        }
      } catch (error) {
        console.error("Error al verificar round actual:", error);
      }
    };

    // Verificar round actual cada 5 segundos
    const roundCheckInterval = setInterval(checkCurrentRound, 5000);

    // Cargar números llamados iniciales (solo una vez al montar)
    const loadInitialNumbers = async () => {
      try {
        const calledNumbersData = await getCalledNumbers(roomId, currentRound);

        if (calledNumbersData.length > 0) {
          const lastCalled = calledNumbersData[calledNumbersData.length - 1];
          const lastTimestamp = new Date(lastCalled.called_at).getTime();

          setLastCalledTimestamp(lastTimestamp);

          // Actualizar con todos los números llamados
          const numbersSet = new Set(calledNumbersData.map((cn) => cn.number));
          setCalledNumbers(numbersSet);

          // Establecer número actual
          setCurrentNumber(lastCalled.number);
          setLastNumbers(
            calledNumbersData
              .slice(-3)
              .reverse()
              .map((cn) => cn.number)
          );

          // Actualizar progress bar
          updateProgress();
        }
      } catch {
        // Error silencioso al cargar números iniciales
      }
    };

    // Cargar números iniciales
    loadInitialNumbers();

    // CRÍTICO: Sincronizar TODO el estado del juego periódicamente desde la BD
    // Esto asegura que todos los usuarios vean exactamente lo mismo en tiempo real
    // OPTIMIZADO: Reducir frecuencia a 2 segundos y hacer más eficiente
    const syncGameState = async () => {
      try {
        const currentRoomId = roomIdRef.current;
        const currentRoundValue = currentRoundRef.current;
        
        if (!currentRoomId || !currentRoundValue) {
          return;
        }
        
        // CRÍTICO: Ejecutar todas las sincronizaciones en paralelo para reducir delays
        const [calledNumbersData, roundsData, roomResponse] = await Promise.allSettled([
          getCalledNumbers(currentRoomId, currentRoundValue),
          getRoomRounds(currentRoomId),
          import("../Services/api").then(({ api }) => api.get(`/rooms/${currentRoomId}`)),
        ]);
        
        // 1. Sincronizar números llamados
        if (calledNumbersData.status === "fulfilled" && calledNumbersData.value.length > 0) {
          const data = calledNumbersData.value;
          const lastThree = data.slice(-3).reverse().map((cn) => cn.number);
          setLastNumbers(lastThree);
          
          const lastCalled = data[data.length - 1];
          setCurrentNumber(lastCalled.number);
          
          const calledTimestamp = new Date(lastCalled.called_at).getTime();
          setLastCalledTimestamp(calledTimestamp);
          lastCalledTimestampRef.current = calledTimestamp;
          
          const numbersSet = new Set(data.map((cn) => cn.number));
          setCalledNumbers(numbersSet);
          
          setIsCallingNumber(true);
          setIsGameStarting(false);
          setRoundEnded(false);
          setRoundFinished(false);
          setProgress(0);
        } else if (roundsData.status === "fulfilled") {
          // No hay números, verificar estado del round
          const currentRoundData = roundsData.value.find(
            (r) => r.round_number === currentRoundValue
          );
          
          if (currentRoundData) {
            const roundStatus =
              typeof currentRoundData.status_id === "object" && currentRoundData.status_id
                ? currentRoundData.status_id.name
                : "";
            
            if (roundStatus === "in_progress") {
              setIsCallingNumber(false);
              setIsGameStarting(true);
            } else if (roundStatus === "starting") {
              setIsCallingNumber(false);
              setIsGameStarting(true);
            } else if (roundStatus === "finished" || roundStatus === "bingo_claimed") {
              setIsCallingNumber(false);
              setIsGameStarting(false);
            }
          }
        }
        
        // 2. Sincronizar contador de jugadores
        if (roomResponse.status === "fulfilled" && roomResponse.value.data?.enrolled_users_count !== undefined) {
          setRoom((prevRoom) => {
            if (prevRoom && typeof prevRoom === "object") {
              return {
                ...prevRoom,
                enrolled_users_count: roomResponse.value.data.enrolled_users_count,
              };
            }
            return prevRoom;
          });
        }
      } catch (error) {
        console.error("[GameInProgress] Error al sincronizar estado del juego:", error);
      }
    };

    // Sincronizar cada 2 segundos (más frecuente) para reducir delays
    const syncInterval = setInterval(syncGameState, 2000);

    // NOTA: El intervalo del progressbar se maneja en un useEffect separado
    // que monitorea isCallingNumber para evitar problemas cuando el usuario
    // ya está en la sala antes de que comience el round

    return () => {
      isMounted = false; // Marcar como desmontado para evitar actualizaciones

      // Limpiar intervalos
      clearInterval(syncInterval);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (roundCheckInterval) {
        clearInterval(roundCheckInterval);
      }

      // Desuscribirse de eventos WebSocket
      unsubscribeNumberCalled();
      unsubscribeRoomStateSync();
      unsubscribeRoomPrizeUpdated();
      unsubscribeCardsEnrolled();
      unsubscribeTimeoutCountdown();
      unsubscribeBingoClaimed();
      unsubscribeBingoClaimCountdown();
      unsubscribeRoundStarted();
      unsubscribeRoundFinished();
      unsubscribeRoundTransitionCountdown();
      unsubscribeRoundStartCountdown();
      unsubscribeRoundCountdownStopped();
      unsubscribeRoundStatusChanged();
      unsubscribeRoomStartCountdown();
      unsubscribeRoomPending();
      unsubscribeRoomStatusUpdated();
      unsubscribeRoomPrizeUpdated();
      unsubscribeRoomFinished();

      // CRÍTICO: NO llamar leaveRoom aquí - se maneja en el efecto separado
      // Esto previene loops infinitos cuando los estados cambian
    };
    // Nota: Este efecto maneja muchos eventos WebSocket y tiene dependencias intencionalmente limitadas
    // para evitar re-ejecuciones innecesarias. Los setters son estables y no necesitan estar en las dependencias.
    // CRÍTICO: Solo incluir dependencias que realmente requieren re-registrar los listeners
    // NO incluir estados que cambian frecuentemente (isCallingNumber, lastCalledTimestamp, etc.)
    // porque causan que los listeners se remuevan y re-registren constantemente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameStarted,
    roomId,
    currentRound,
    // NO incluir: isCallingNumber, lastCalledTimestamp, timeoutCountdown, timeoutStartTime
    // porque estos cambian constantemente y causan re-registros innecesarios
  ]);

  // Hook para actualizar countdowns basados en timestamps del servidor
  // CRÍTICO: Usar refs para leer los valores actuales sin causar re-ejecuciones del useEffect
  const roomStartCountdownFinishRef = React.useRef(roomStartCountdownFinish);
  const roundStartCountdownFinishRef = React.useRef(roundStartCountdownFinish);
  const roundTransitionCountdownFinishRef = React.useRef(roundTransitionCountdownFinish);
  const bingoClaimCountdownFinishRef = React.useRef(bingoClaimCountdownFinish);

  // Actualizar refs cuando cambian los valores
  React.useEffect(() => {
    roomStartCountdownFinishRef.current = roomStartCountdownFinish;
  }, [roomStartCountdownFinish]);

  React.useEffect(() => {
    roundStartCountdownFinishRef.current = roundStartCountdownFinish;
  }, [roundStartCountdownFinish]);

  React.useEffect(() => {
    roundTransitionCountdownFinishRef.current = roundTransitionCountdownFinish;
  }, [roundTransitionCountdownFinish]);

  React.useEffect(() => {
    bingoClaimCountdownFinishRef.current = bingoClaimCountdownFinish;
  }, [bingoClaimCountdownFinish]);

  React.useEffect(() => {
    if (!gameStarted || !roomId) return;

    const updateCountdowns = () => {
      const now = Date.now();

      // Actualizar countdown de inicio de sala
      const roomFinish = roomStartCountdownFinishRef.current;
      if (roomFinish) {
        const remaining = Math.max(0, Math.floor((roomFinish - now) / 1000));
        if (remaining > 0) {
          setRoomStartCountdown(remaining);
        } else {
          setRoomStartCountdown(null);
          setRoomStartCountdownFinish(null);
        }
      }

      // Actualizar countdown de inicio de round (tiene prioridad sobre transición si ambos están activos)
      const roundFinish = roundStartCountdownFinishRef.current;
      if (roundFinish) {
        const remaining = Math.max(0, Math.floor((roundFinish - now) / 1000));
        if (remaining > 0) {
          // Solo actualizar si el valor cambió (evitar re-renders innecesarios)
          setRoundTransitionCountdown((prev) => {
            if (prev !== remaining) {
              return remaining;
            }
            return prev;
          });
        } else {
          // El countdown terminó
          setRoundTransitionCountdown(null);
          setRoundStartCountdownFinish(null);
        }
      } else {
        // Actualizar countdown de transición entre rounds (solo si no hay countdown de inicio de round)
        const transitionFinish = roundTransitionCountdownFinishRef.current;
        if (transitionFinish) {
          const remaining = Math.max(0, Math.floor((transitionFinish - now) / 1000));
        if (remaining > 0) {
          setRoundTransitionCountdown(remaining);
        } else {
          setRoundTransitionCountdown(null);
          setRoundTransitionCountdownFinish(null);
          }
        }
      }

      // Actualizar countdown de ventana de bingo
      const bingoFinish = bingoClaimCountdownFinishRef.current;
      if (bingoFinish) {
        const remaining = Math.max(0, Math.floor((bingoFinish - now) / 1000));
        if (remaining > 0) {
          setBingoClaimCountdown(remaining);
        } else {
          setBingoClaimCountdown(null);
          setBingoClaimCountdownFinish(null);
        }
      }
    };

    // Actualizar cada segundo
    const interval = setInterval(updateCountdowns, 1000);
    updateCountdowns(); // Ejecutar inmediatamente

    return () => clearInterval(interval);
  }, [gameStarted, roomId]);

  // CRÍTICO: useEffect separado para manejar el intervalo del progressbar
  // Esto asegura que el progressbar funcione correctamente cuando el usuario ya está en la sala
  // antes de que comience el round (cuando isCallingNumber cambia a true)
  React.useEffect(() => {
    const UPDATE_INTERVAL = 50; // Actualizar progress cada 50ms para suavidad

    // Función para actualizar el progress bar basado en el último timestamp o countdown
    const updateProgress = () => {
      // Solo actualizar si se están llamando números
      if (!isCallingNumber) {
        return;
      }

      // Si hay countdown de timeout activo, mostrar progreso del countdown
      if (timeoutCountdown !== null && timeoutStartTime !== null) {
        const now = Date.now();
        const elapsed = now - timeoutStartTime;
        const remaining = TIMEOUT_COUNTDOWN_DURATION - elapsed;
        const progressValue = Math.max(
          0,
          Math.min((elapsed / TIMEOUT_COUNTDOWN_DURATION) * 100, 100)
        );
        setProgress(progressValue);

        // Actualizar countdown cada segundo
        const secondsRemaining = Math.ceil(remaining / 1000);
        if (secondsRemaining !== timeoutCountdown && secondsRemaining >= 0) {
          setTimeoutCountdown(secondsRemaining);
        }

        // Si el countdown terminó, limpiar
        if (remaining <= 0) {
          setTimeoutCountdown(null);
          setTimeoutStartTime(null);
        }
        return;
      }

      // Progress bar normal para números
      if (!lastCalledTimestamp) {
        setProgress(0);
        return;
      }

      const now = Date.now();
      const timeSinceLastCall = now - lastCalledTimestamp;
      const progressValue = Math.min(
        (timeSinceLastCall / CALL_INTERVAL) * 100,
        100
      );
      setProgress(progressValue);
    };

    // Limpiar intervalo anterior si existe
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Crear nuevo intervalo solo si se están llamando números y el round no está finalizado
    if (isCallingNumber && !roundFinished && !roundEnded) {
      progressIntervalRef.current = setInterval(
        updateProgress,
        UPDATE_INTERVAL
      );
      // Ejecutar inmediatamente para actualizar el progress bar
      updateProgress();
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isCallingNumber, roundFinished, roundEnded, lastCalledTimestamp, timeoutCountdown, timeoutStartTime, CALL_INTERVAL, TIMEOUT_COUNTDOWN_DURATION]);

  // CRÍTICO: useEffect separado para manejar isGameStarting basado en countdowns activos
  // Esto previene el parpadeo asegurando que isGameStarting solo cambie cuando realmente no hay countdown activo
  React.useEffect(() => {
    // Verificar si la sala está en estado "pending"
    const isRoomPending = room?.status === "pending" || room?.status === "preparing";
    
    // Si hay un countdown activo (roomStartCountdown o roundTransitionCountdown), isGameStarting debe ser false
    const hasActiveCountdown = 
      (roomStartCountdown !== null && roomStartCountdown > 0) ||
      (roundTransitionCountdown !== null && roundTransitionCountdown > 0);

    if (hasActiveCountdown) {
      // CRÍTICO: Si hay un countdown activo, SIEMPRE establecer isGameStarting en false
      // Esto previene el parpadeo entre el countdown y "Iniciando juego..."
      setIsGameStarting(false);
    } else if (isRoomPending && !isCallingNumber && !currentNumber && !roundFinished && !roomFinished) {
      // CRÍTICO: Si la sala está en "pending", NO mostrar "Iniciando juego..." sin countdown
      // Esperar a que llegue el evento room-start-countdown del servidor
      setIsGameStarting(false);
    } else if (!isCallingNumber && !currentNumber && !roundFinished && !roomFinished && !isRoomPending) {
      // Solo mostrar "Iniciando juego..." si:
      // - No hay countdown activo
      // - La sala NO está en "pending"
      // - No se están llamando números
      // - No hay número actual
      // - El round no está finalizado
      // - La sala no está finalizada
      setIsGameStarting(true);
    } else {
      // En cualquier otro caso, no mostrar "Iniciando juego..."
      setIsGameStarting(false);
    }
  }, [
    roomStartCountdown,
    roundTransitionCountdown,
    isCallingNumber,
    currentNumber,
    roundFinished,
    roomFinished,
    room?.status,
  ]);

  // Obtener el pattern del round actual directamente desde roundsData
  // CRÍTICO: Usar la misma lógica que Home.tsx - buscar el round con status "in_progress" o "starting"
  // Esto asegura que siempre obtengamos el pattern correcto del round activo
  const currentBingoType: BingoType = React.useMemo(() => {
    // CRÍTICO: Buscar el round activo (in_progress o starting) en lugar de usar currentRound
    // Esto asegura que siempre obtengamos el pattern del round que realmente está corriendo
    const activeRound = roundsData.find((r) => {
      const status =
        typeof r.status_id === "object" && r.status_id ? r.status_id.name : "";
      return status === "in_progress" || status === "starting";
    });

    // Usar totalRounds del estado (obtenido de room.max_rounds)
    const maxRounds = totalRounds || 3;

    // Si hay un round activo, usar su pattern
    if (activeRound) {
      const pattern =
        typeof activeRound.pattern_id === "object" && activeRound.pattern_id
          ? activeRound.pattern_id.name
          : "";

      console.log(
        `[GameInProgress] Round activo encontrado: Round ${activeRound.round_number}/${maxRounds}, Pattern: ${pattern}`
      );

      // Validar que el pattern sea correcto según la ley
      const isLastRound = activeRound.round_number === maxRounds;

      if (!isLastRound) {
        // NO es la última ronda: NUNCA puede ser "full"
        if (pattern === "full") {
          console.warn(
            `[GameInProgress] ⚠️ LEY VIOLADA: Round ${activeRound.round_number} (NO es la última de ${maxRounds}) tiene pattern "full". Usando fallback seguro.`
          );
          return "horizontal"; // Pattern seguro para rounds que no son la última
        }
      } else {
        // Es la última ronda: SIEMPRE debe ser "full"
        if (pattern !== "full") {
          console.warn(
            `[GameInProgress] ⚠️ LEY VIOLADA: Round ${activeRound.round_number} (última ronda de ${maxRounds}) tiene pattern "${pattern}" en lugar de "full". Usando "fullCard".`
          );
          return "fullCard";
        }
      }

      const bingoType = mapPatternToBingoType(pattern);
      console.log(
        `[GameInProgress] ✅ Pattern correcto: Round ${activeRound.round_number} → ${bingoType}`
      );
      return bingoType;
    }

    // Si no hay round activo, buscar por currentRound como fallback
    const currentRoundData = roundsData.find(
      (r) => r.round_number === currentRound
    );

    if (currentRoundData) {
      const pattern =
        typeof currentRoundData.pattern_id === "object" &&
        currentRoundData.pattern_id
          ? currentRoundData.pattern_id.name
          : "";

      console.log(
        `[GameInProgress] Usando round ${currentRound}/${maxRounds} como fallback, Pattern: ${pattern}`
      );

      // Validar que el pattern sea correcto según la ley
      const isLastRound = currentRound === maxRounds;

      if (!isLastRound) {
        if (pattern === "full") {
          console.warn(
            `[GameInProgress] ⚠️ LEY VIOLADA: Round ${currentRound} (NO es la última de ${maxRounds}) tiene pattern "full". Usando fallback seguro.`
          );
          return "horizontal";
        }
      } else {
        if (pattern !== "full") {
          console.warn(
            `[GameInProgress] ⚠️ LEY VIOLADA: Round ${currentRound} (última ronda de ${maxRounds}) tiene pattern "${pattern}" en lugar de "full". Usando "fullCard".`
          );
          return "fullCard";
        }
      }

      return mapPatternToBingoType(pattern);
    }

    // Fallback: usar roundBingoTypes si roundsData no está disponible
    if (roundBingoTypes.length > 0 && roundBingoTypes[currentRound - 1]) {
      console.log(
        `[GameInProgress] Usando roundBingoTypes[${
          currentRound - 1
        }] como fallback`
      );
      return roundBingoTypes[currentRound - 1];
    }

    // Fallback final: pattern seguro según el round
    const isLastRound = currentRound === maxRounds;
    if (!isLastRound) {
      return "horizontal"; // Pattern seguro para rounds que no son la última
    } else {
      return "fullCard"; // Última ronda siempre es fullCard
    }
  }, [roundsData, roundBingoTypes, currentRound, totalRounds]);

  const getMarkedForCard = React.useCallback(
    (cardIndex: number): Set<string> => {
      return markedNumbers.get(cardIndex) || new Set();
    },
    [markedNumbers]
  );

  // NOTA: La detección automática de bingo ha sido eliminada.
  // El jugador debe presionar explícitamente el botón "BINGO" en el modal de vista previa del cartón.

  const roundPrizes = React.useMemo(
    () => calculateRoundPrizes(totalPot, totalRounds),
    [totalPot, totalRounds]
  );
  const currentRoundPrize = roundPrizes[currentRound - 1] || 0;

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
    if (playerCards.length === 0) return false;
    const card = playerCards[cardIndex];
    if (!card) return false;
    const cardMarked = getMarkedForCard(cardIndex);
    return hasBingo(card, cardMarked, currentBingoType);
  };

  // Calcular los números del patrón de bingo para cada cartón
  const bingoPatternNumbersMap = React.useMemo(() => {
    const map = new Map<number, Set<string>>();
    playerCards.forEach((card, index) => {
      const cardMarked = getMarkedForCard(index);
      if (hasBingo(card, cardMarked, currentBingoType)) {
        map.set(
          index,
          getBingoPatternNumbers(card, cardMarked, currentBingoType)
        );
      }
    });
    return map;
  }, [playerCards, currentBingoType, getMarkedForCard]);

  const handleCardClick = (index: number) => {
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

  const handlePreviousCard = () => {
    if (previewCardIndex !== null && previewCardIndex > 0) {
      setPreviewCardIndex(previewCardIndex - 1);
    }
  };

  const handleNextCard = () => {
    if (
      previewCardIndex !== null &&
      previewCardIndex < playerCards.length - 1
    ) {
      setPreviewCardIndex(previewCardIndex + 1);
    }
  };

  const handleBingo = async () => {
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
        handleCloseModal();

        // Actualizar estado
        // CRÍTICO: NO marcar el round como finalizado cuando el usuario canta bingo
        // El round solo se finaliza después de 45 segundos
        // setRoundFinished(true);  // REMOVIDO: El round NO está finalizado, solo en "bingo_claimed"
        setShowConfetti(true);

        // El modal de validación se abrirá cuando llegue el evento bingo-claimed
        // que se emite desde el backend para todos los usuarios

        // CRÍTICO: NO detener el juego cuando alguien canta bingo
        // El juego continúa durante la ventana de 45 segundos para que otros puedan cantar bingo
        // setRoundEnded(true);     // REMOVIDO: El round NO ha terminado, solo tiene bingo reclamado
        // setIsCallingNumber(false);  // REMOVIDO: Ya se detuvo cuando llegó el primer bingo
        // setProgress(0);  // REMOVIDO: No es necesario resetear el progress

        setTimeout(() => {
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
        <Container maxWidth="sm" sx={{ py: 4 }}>
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
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#1a1008", // Fondo de madera oscura
        color: "#f5e6d3", // Texto crema
        paddingBottom: "80px",
        position: "relative",
        overflow: "hidden",
        // Textura de madera de fondo (más sutil)
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            #1a1008 0px,
            #1f1309 1px,
            #2a1a0f 2px,
            #1f1309 3px,
            #1a1008 4px,
            #1a1008 8px,
            #1f1309 9px,
            #2a1a0f 10px,
            #1f1309 11px,
            #1a1008 12px
          ),
          linear-gradient(
            90deg,
            #1a1008 0%,
            #1f1309 15%,
            #2a1a0f 30%,
            #1f1309 45%,
            #1a1008 60%,
            #1f1309 75%,
            #2a1a0f 90%,
            #1a1008 100%
          ),
          radial-gradient(ellipse 200px 50px at 25% 30%, rgba(42, 26, 15, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse 150px 40px at 75% 60%, rgba(31, 19, 9, 0.25) 0%, transparent 50%)
        `,
        backgroundSize: `
          100% 16px,
          200% 100%,
          100% 100%,
          100% 100%
        `,
        // Capa de difuminado/vaho sobre el fondo
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse 600px 400px at 20% 30%, rgba(0, 0, 0, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 500px 350px at 80% 60%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 400px 300px at 50% 20%, rgba(0, 0, 0, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 350px 250px at 15% 70%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 450px 320px at 70% 15%, rgba(0, 0, 0, 0.1) 0%, transparent 60%)
          `,
          backdropFilter: "blur(8px) saturate(120%)",
          WebkitBackdropFilter: "blur(8px) saturate(120%)",
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <BackgroundStars />

      <Container maxWidth="sm" sx={{ py: 3, position: "relative", zIndex: 1 }}>
        <GameHeader
          currentRound={currentRound}
          currentRoundPrize={currentRoundPrize}
          currentBingoType={currentBingoType}
          isGameActive={!roundFinished && gameStarted}
          roomName={
            room && typeof room === "object" && "name" in room
              ? String(room.name)
              : undefined
          }
          roomFinished={roomFinished}
          totalPrize={totalPot}
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
              hasPrevious={previewCardIndex > 0}
              hasNext={previewCardIndex < playerCards.length - 1}
              previousHasBingo={
                previewCardIndex > 0 ? checkBingo(previewCardIndex - 1) : false
              }
              nextHasBingo={
                previewCardIndex < playerCards.length - 1
                  ? checkBingo(previewCardIndex + 1)
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

      <ConfettiFireworks active={showConfetti} />
    </Box>
  );
}
