import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook para manejar todos los countdowns del juego
 * SYNC-FIX: Todos los countdowns usan serverTimeOffset para sincronización
 * - Countdown de inicio de sala
 * - Countdown de transición entre rounds
 * - Countdown de inicio de round
 * - Countdown de ventana de bingo
 */
export function useCountdowns(
  gameStarted: boolean,
  roomId: string | undefined,
  roomScheduledAt: Date | null,
  serverTimeOffset: number,
  currentRound: number,
  roundFinished: boolean,
  calledNumbers: Set<string>
) {
  // Estados de countdowns
  const [roomStartCountdown, setRoomStartCountdown] = useState<number | null>(null);
  const [roomStartCountdownFinish, setRoomStartCountdownFinish] = useState<number | null>(null);
  const [roundTransitionCountdown, setRoundTransitionCountdown] = useState<number | null>(null);
  const [roundTransitionCountdownFinish, setRoundTransitionCountdownFinish] = useState<number | null>(null);
  const [roundStartCountdownFinish, setRoundStartCountdownFinish] = useState<number | null>(null);
  const [bingoClaimCountdown, setBingoClaimCountdown] = useState<number | null>(null);
  const [bingoClaimCountdownFinish, setBingoClaimCountdownFinish] = useState<number | null>(null);
  const [nextRoundNumber, setNextRoundNumber] = useState<number | null>(null);
  const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null);

  // Refs para timestamps - SYNC-FIX: usar refs para evitar stale closures
  const roomStartCountdownFinishRef = useRef(roomStartCountdownFinish);
  const roundStartCountdownFinishRef = useRef(roundStartCountdownFinish);
  const roundTransitionCountdownFinishRef = useRef(roundTransitionCountdownFinish);
  const bingoClaimCountdownFinishRef = useRef(bingoClaimCountdownFinish);
  // SYNC-FIX: Ref para serverTimeOffset para sincronización precisa
  const serverTimeOffsetRef = useRef(serverTimeOffset);

  // Refs para valores actuales de countdown (evita re-renders innecesarios)
  const currentRoomStartCountdownRef = useRef(roomStartCountdown);
  const currentRoundTransitionCountdownRef = useRef(roundTransitionCountdown);
  const currentBingoClaimCountdownRef = useRef(bingoClaimCountdown);

  // Actualizar refs cuando cambian los valores
  useEffect(() => {
    roomStartCountdownFinishRef.current = roomStartCountdownFinish;
  }, [roomStartCountdownFinish]);

  useEffect(() => {
    roundStartCountdownFinishRef.current = roundStartCountdownFinish;
  }, [roundStartCountdownFinish]);

  useEffect(() => {
    roundTransitionCountdownFinishRef.current = roundTransitionCountdownFinish;
  }, [roundTransitionCountdownFinish]);

  useEffect(() => {
    bingoClaimCountdownFinishRef.current = bingoClaimCountdownFinish;
  }, [bingoClaimCountdownFinish]);

  // SYNC-FIX: Actualizar ref de serverTimeOffset
  useEffect(() => {
    serverTimeOffsetRef.current = serverTimeOffset;
  }, [serverTimeOffset]);

  // SYNC-FIX: Actualizar refs de valores actuales
  useEffect(() => {
    currentRoomStartCountdownRef.current = roomStartCountdown;
  }, [roomStartCountdown]);

  useEffect(() => {
    currentRoundTransitionCountdownRef.current = roundTransitionCountdown;
  }, [roundTransitionCountdown]);

  useEffect(() => {
    currentBingoClaimCountdownRef.current = bingoClaimCountdown;
  }, [bingoClaimCountdown]);

  // SYNC-FIX: Función helper para obtener tiempo ajustado del servidor
  const getServerAdjustedTime = useCallback(() => {
    return Date.now() + serverTimeOffsetRef.current;
  }, []);

  // Countdown de inicio de sala (solo para la primera ronda, antes de que comience el juego)
  useEffect(() => {
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
  ]);

  // SYNC-FIX: Actualizar countdowns basados en timestamps del servidor
  // Usa serverTimeOffset para que todos los clientes vean el mismo tiempo
  useEffect(() => {
    if (!gameStarted || !roomId) return;

    const updateCountdowns = () => {
      // SYNC-FIX: Usar tiempo ajustado del servidor para sincronización entre clientes
      const serverNow = getServerAdjustedTime();

      // Actualizar countdown de inicio de sala
      const roomFinish = roomStartCountdownFinishRef.current;
      if (roomFinish) {
        const remaining = Math.max(0, Math.floor((roomFinish - serverNow) / 1000));
        // SYNC-FIX: Solo actualizar si el valor cambió (evita intermitencia)
        if (remaining > 0) {
          if (currentRoomStartCountdownRef.current !== remaining) {
            setRoomStartCountdown(remaining);
          }
        } else {
          if (currentRoomStartCountdownRef.current !== null) {
            setRoomStartCountdown(null);
            setRoomStartCountdownFinish(null);
          }
        }
      }

      // Actualizar countdown de inicio de round (tiene prioridad sobre transición si ambos están activos)
      const roundFinish = roundStartCountdownFinishRef.current;
      if (roundFinish) {
        const remaining = Math.max(0, Math.floor((roundFinish - serverNow) / 1000));
        if (remaining > 0) {
          // SYNC-FIX: Solo actualizar si el valor cambió (evita intermitencia)
          if (currentRoundTransitionCountdownRef.current !== remaining) {
            setRoundTransitionCountdown(remaining);
          }
        } else {
          // El countdown terminó
          if (currentRoundTransitionCountdownRef.current !== null) {
            setRoundTransitionCountdown(null);
            setRoundStartCountdownFinish(null);
          }
        }
      } else {
        // Actualizar countdown de transición entre rounds (solo si no hay countdown de inicio de round)
        const transitionFinish = roundTransitionCountdownFinishRef.current;
        if (transitionFinish) {
          const remaining = Math.max(0, Math.floor((transitionFinish - serverNow) / 1000));
          if (remaining > 0) {
            // SYNC-FIX: Solo actualizar si el valor cambió (evita intermitencia)
            if (currentRoundTransitionCountdownRef.current !== remaining) {
              setRoundTransitionCountdown(remaining);
            }
          } else {
            if (currentRoundTransitionCountdownRef.current !== null) {
              setRoundTransitionCountdown(null);
              setRoundTransitionCountdownFinish(null);
            }
          }
        }
      }

      // Actualizar countdown de ventana de bingo
      const bingoFinish = bingoClaimCountdownFinishRef.current;
      if (bingoFinish) {
        const remaining = Math.max(0, Math.floor((bingoFinish - serverNow) / 1000));
        if (remaining > 0) {
          // SYNC-FIX: Solo actualizar si el valor cambió (evita intermitencia)
          if (currentBingoClaimCountdownRef.current !== remaining) {
            setBingoClaimCountdown(remaining);
          }
        } else {
          if (currentBingoClaimCountdownRef.current !== null) {
            setBingoClaimCountdown(null);
            setBingoClaimCountdownFinish(null);
          }
        }
      }
    };

    // SYNC-FIX: Actualizar cada segundo con precisión
    const interval = setInterval(updateCountdowns, 1000);
    updateCountdowns(); // Ejecutar inmediatamente

    return () => clearInterval(interval);
  }, [gameStarted, roomId, getServerAdjustedTime]);

  return {
    roomStartCountdown,
    setRoomStartCountdown,
    roomStartCountdownFinish,
    setRoomStartCountdownFinish,
    roundTransitionCountdown,
    setRoundTransitionCountdown,
    roundTransitionCountdownFinish,
    setRoundTransitionCountdownFinish,
    roundStartCountdownFinish,
    setRoundStartCountdownFinish,
    bingoClaimCountdown,
    setBingoClaimCountdown,
    bingoClaimCountdownFinish,
    setBingoClaimCountdownFinish,
    nextRoundNumber,
    setNextRoundNumber,
    timeUntilStart,
    setTimeUntilStart,
  };
}
