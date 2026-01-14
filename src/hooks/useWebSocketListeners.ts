import { useEffect, useRef } from "react";
import { getRoomRounds } from "../Services/rounds.service";
import { getCalledNumbers } from "../Services/calledNumbers.service";
import { getRoomWinners, type RoomWinner } from "../Services/bingo.service";
import { mapPatternToBingoType } from "../utils/patternMapper";
import { hasBingo, getBingoPatternNumbers } from "../utils/bingoLogic";
import { numberToBingoFormat } from "../utils/bingoUtils";
import { convertCardNumbers } from "../utils/gameHelpers";
import type { BingoGrid } from "../utils/bingo";
import type { BingoType } from "../utils/bingoUtils";
import {
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
  onRoundCleanup,
  onRoundSync,
} from "../Services/socket.service";

// const CALL_INTERVAL = 7000;
// const TIMEOUT_COUNTDOWN_DURATION = 10000;

/**
 * Hook para manejar todos los listeners de WebSocket
 * Este hook centraliza toda la lógica de eventos en tiempo real
 */
export function useWebSocketListeners(
  gameStarted: boolean,
  roomId: string | undefined,
  currentRound: number,
  roundEnded: boolean,
  roundFinished: boolean,
  isCallingNumber: boolean,
  isGameStarting: boolean,
  roundTransitionCountdown: number | null,
  bingoClaimCountdown: number | null,
  lastCalledTimestamp: number | null,
  timeoutCountdown: number | null,
  timeoutStartTime: number | null,
  calledNumbers: Set<string>,
  playerCards: BingoGrid[],
  currentBingoType: BingoType,
  totalRounds: number,
  room: Record<string, unknown> | null,
  getMarkedForCard: (cardIndex: number) => Set<string>,
  lastNumbers: string[],
  // Setters
  setCurrentRound: (round: number) => void,
  setCalledNumbers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setCurrentNumber: (value: string) => void,
  setLastNumbers: (value: string[]) => void,
  setLastCalledTimestamp: (value: number | null) => void,
  setIsCallingNumber: (value: boolean) => void,
  setRoundEnded: (value: boolean) => void,
  setRoundFinished: (value: boolean) => void,
  setRoomFinished: (value: boolean) => void,
  setIsGameStarting: (value: boolean) => void,
  setProgress: (value: number) => void,
  setTimeoutCountdown: (value: number | null) => void,
  setTimeoutStartTime: (value: number | null) => void,
  setRoundTransitionCountdown: (value: number | null) => void,
  setRoundTransitionCountdownFinish: (value: number | null) => void,
  setRoundStartCountdownFinish: (value: number | null) => void,
  setBingoClaimCountdown: (value: number | null) => void,
  setBingoClaimCountdownFinish: (value: number | null) => void,
  setNextRoundNumber: (value: number | null) => void,
  setMarkedNumbers: React.Dispatch<React.SetStateAction<Map<number, Set<string>>>>,
  setRoundsData: React.Dispatch<React.SetStateAction<any[]>>,
  setRoundBingoTypes: React.Dispatch<React.SetStateAction<BingoType[]>>,
  setRoom: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>,
  setTotalPot: (value: number) => void,
  setEnrolledUsersCount: (value: number) => void,
  setWinners: React.Dispatch<React.SetStateAction<RoomWinner[]>>,
  setPlayerCards: React.Dispatch<React.SetStateAction<BingoGrid[]>>,
  setPlayerCardsData: React.Dispatch<React.SetStateAction<Array<{ _id: string; code: string }>>>,
  // ISSUE-8: Usa card_id como clave
  setWinningNumbersMap: React.Dispatch<React.SetStateAction<Map<string, Set<string>>>>,
  setModalOpen: (value: boolean) => void,
  setPreviewCardIndex: (value: number | null) => void,
  setBingoValidationOpen: (value: boolean) => void,
  setCurrentRoundWinners: React.Dispatch<React.SetStateAction<import("../Components/BingoValidationModal").WinnerData[]>>,
  setCurrentWinnerIndex: (value: number) => void,
  setShowConfetti: (value: boolean) => void,
  setShowLoserAnimation: (value: boolean) => void,
  // ISSUE-FIX: Estado para saber si el usuario ya cantó bingo en esta ronda
  hasClaimedBingoInRound: boolean,
  setRoomStartCountdown: (value: number | null) => void,
  setRoomStartCountdownFinish: (value: number | null) => void,
  progressIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
  // FASE 4: Para sincronización de progress bar con servidor
  setServerTimeOffset: (value: number) => void,
  setNextCallAt: (value: number | null) => void,
  // FIX-SYNC: Para bloquear interacción durante transición de rondas
  setIsTransitioning: (value: boolean) => void
) {
  // Refs para acceder a valores actuales sin causar re-registros
  const currentRoundRef = useRef(currentRound);
  const roomIdRef = useRef(roomId);
  const roundFinishedRef = useRef(roundFinished);
  const bingoClaimCountdownRef = useRef(bingoClaimCountdown);
  const isCallingNumberRef = useRef(isCallingNumber);
  const isGameStartingRef = useRef(isGameStarting);
  const roundTransitionCountdownRef = useRef(roundTransitionCountdown);
  const lastCalledTimestampRef = useRef(lastCalledTimestamp);
  const timeoutCountdownRef = useRef(timeoutCountdown);
  const timeoutStartTimeRef = useRef(timeoutStartTime);
  // FIX-1: Ref para lastNumbers - evita valor stale en callbacks WebSocket
  const lastNumbersRef = useRef(lastNumbers);
  // FIX-3: Ref para hasClaimedBingoInRound - evita "Mala Suerte" incorrecta
  const hasClaimedBingoInRoundRef = useRef(hasClaimedBingoInRound);
  // FIX-ROUND-RESET: Ref para trackear la última ronda para la cual procesamos números
  // Esto ayuda a detectar cuando necesitamos limpiar cartones al cambiar de ronda
  const lastProcessedRoundRef = useRef(currentRound);
  // FIX-CRITICAL: Ref para calledNumbers - CRUCIAL para que los handlers vean el valor actual
  // Sin esto, los handlers de WebSocket capturan el valor inicial (vacío) y nunca ven actualizaciones
  const calledNumbersRef = useRef(calledNumbers);
  // FIX-CRITICAL: Ref para saber si useGameData ya cargó datos iniciales
  const initialLoadCompleteRef = useRef(false);

  // Actualizar refs cuando cambian los valores
  useEffect(() => {
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
    // FIX-1 & FIX-3: Sincronizar refs adicionales
    lastNumbersRef.current = lastNumbers;
    hasClaimedBingoInRoundRef.current = hasClaimedBingoInRound;
    // FIX-CRITICAL: Sincronizar calledNumbersRef para que handlers vean valor actual
    calledNumbersRef.current = calledNumbers;
    // FIX-CRITICAL: Marcar si ya tenemos datos cargados
    if (calledNumbers.size > 0) {
      initialLoadCompleteRef.current = true;
    }
  // FIX-CRITICAL: calledNumbers DEBE estar en las dependencias para sincronizar la ref correctamente
  }, [currentRound, roomId, roundFinished, bingoClaimCountdown, isCallingNumber, isGameStarting, roundTransitionCountdown, lastCalledTimestamp, timeoutCountdown, timeoutStartTime, lastNumbers, hasClaimedBingoInRound, calledNumbers]);

  // NUEVO: useEffect separado para eventos que necesitan funcionar ANTES de que empiece el juego
  // Estos listeners se registran siempre que haya un roomId, independientemente de gameStarted
  useEffect(() => {
    if (!roomId) {
      return;
    }

    console.log(`[GameInProgress] 🔌 Configurando listeners de pre-juego para room ${roomId}`);

    let isMounted = true;

    // Escuchar actualizaciones de premio en tiempo real (funciona antes de que empiece el juego)
    const unsubscribePrizeUpdated = onRoomPrizeUpdated((data) => {
      if (!isMounted) return;

      if (data.room_id === roomId) {
        console.log(
          `[GameInProgress] 💰 Premio actualizado (pre-juego): Total pot: ${data.total_pot}, Prize pool: ${data.total_prize}, Usuarios: ${data.enrolled_users_count || 0}`
        );
        setTotalPot(data.total_prize);
        
        if (data.enrolled_users_count !== undefined) {
          setEnrolledUsersCount(data.enrolled_users_count);
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

    // Escuchar eventos de cartones inscritos (funciona antes de que empiece el juego)
    const unsubscribeCardsEnrolledPre = onCardsEnrolled((data) => {
      if (!isMounted) return;

      if (data.room_id === roomId && data.enrolled_users_count !== undefined) {
        console.log(
          `[GameInProgress] 🎴 Cartones inscritos (pre-juego): ${data.enrolled_count} cartones, Total usuarios: ${data.enrolled_users_count}`
        );
        setEnrolledUsersCount(data.enrolled_users_count);
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

    return () => {
      isMounted = false;
      unsubscribePrizeUpdated();
      unsubscribeCardsEnrolledPre();
    };
  }, [roomId, setTotalPot, setEnrolledUsersCount, setRoom]);

  useEffect(() => {
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
    const unsubscribeRoomStateSync = onRoomStateSync((data) => {
      if (!isMounted || data.room_id !== roomId) {
        return;
      }

      if (data.round) {
        const roundStatus = data.round.status;
        console.log(
          `[GameInProgress] 🔄 Sincronizando estado: Round ${data.round.round_number}, status: ${roundStatus}, ${data.round.called_count || 0} números llamados`
        );

        // Actualizar round actual
        if (data.round.round_number !== currentRoundRef.current) {
          setCurrentRound(data.round.round_number);
        }

        if (roundStatus === "starting") {
          console.log(
            `[GameInProgress] Round ${data.round.round_number} está en countdown (starting), esperando...`
          );
          setIsCallingNumber(false);
          setRoundEnded(false);
          setRoundFinished(false);
          setRoomFinished(false);
        } else if (roundStatus === "in_progress") {
          const serverNumbersCount = data.round.called_numbers?.length || 0;
          console.log(
            `[GameInProgress] 🔄 Sincronizando estado: Round ${data.round.round_number}, ${serverNumbersCount} números del servidor`
          );
          
          // FIX-RELOAD: Sincronizar números SOLO si el servidor tiene MÁS que nosotros
          // Esto previene que datos incompletos del servidor sobrescriban nuestro estado local
          if (data.round.called_numbers && Array.isArray(data.round.called_numbers) && data.round.called_numbers.length > 0) {
            const syncedNumbers = new Set(
              data.round.called_numbers.map((cn: { number: string }) => cn.number)
            );
            
            // FIX-RELOAD: Solo actualizar si el servidor tiene más números o es una ronda diferente
            // FIX-CRITICAL: Usar REF para ver valor actual, no el capturado en closure
            if (syncedNumbers.size >= calledNumbersRef.current.size || data.round.round_number !== currentRoundRef.current) {
            setCalledNumbers(syncedNumbers);
            
            // Actualizar número actual y últimos números
              const lastCalled = data.round.called_numbers[data.round.called_numbers.length - 1];
              setCurrentNumber(lastCalled.number);
              
              if (lastCalled.called_at) {
                const timestamp = new Date(lastCalled.called_at).getTime();
                setLastCalledTimestamp(timestamp);
                lastCalledTimestampRef.current = timestamp;
              }
              
              // Actualizar últimos 3 números
              const lastThree = data.round.called_numbers
                .slice(-3)
                .reverse()
                .map((cn: { number: string }) => cn.number);
              setLastNumbers(lastThree);
            
            console.log(
                `[GameInProgress] ✅ FIX-RELOAD: ${syncedNumbers.size} número(s) sincronizado(s) desde servidor`
              );
            } else {
              console.log(
                `[GameInProgress] ⚠️ FIX-RELOAD: Ignorando sync (local: ${calledNumbersRef.current.size}, servidor: ${syncedNumbers.size})`
              );
            }
          } else {
            console.log(
              `[GameInProgress] ⚠️ FIX-RELOAD: Servidor sin números para ronda ${data.round.round_number}, manteniendo estado local`
            );
          }
          
          // Activar estados de juego
          setIsCallingNumber(true);
          setRoundEnded(false);
          setRoundFinished(false);
          setRoomFinished(false);
          setIsGameStarting(false);
          setProgress(0);
        } else if (roundStatus === "finished") {
          setIsCallingNumber(false);
          setRoundEnded(true);
          setRoundFinished(true);
        } else if (roundStatus === "bingo_claimed") {
          setIsCallingNumber(false);
          setRoundEnded(false);
          setRoundFinished(false);
        } else {
          setIsCallingNumber(false);
          setRoomFinished(false);
        }
      } else {
        // FIX-RELOAD: NO limpiar números si no hay data de ronda del servidor
        // El servidor puede no enviar data de ronda pero eso no significa que debamos
        // borrar el estado local que ya tenemos cargado
        console.log(`[GameInProgress] ⚠️ FIX-RELOAD: No hay data de ronda en room-state-sync, manteniendo estado local`);
        // Solo actualizar estados de UI, NO borrar números
        setIsCallingNumber(false);
        setRoundEnded(false);
        setRoundFinished(false);
      }
    });

    // Escuchar eventos de números llamados en tiempo real
    const unsubscribeNumberCalled = onNumberCalled((data) => {
      if (!isMounted) {
        return;
      }

      if (data.room_id !== roomIdRef.current) {
        return;
      }

      // FIX-CRITICAL: Detectar si es un número de una ronda diferente
      // PERO solo limpiar si:
      // 1. Es una transición hacia ADELANTE (nueva ronda > anterior)
      // 2. Y NO tenemos números de esa ronda ya cargados
      const isNewRoundNumber = data.round_number !== lastProcessedRoundRef.current;
      const isForwardTransition = data.round_number > lastProcessedRoundRef.current;
      
      // FIX-CRITICAL: Usar REF para ver el valor actual, no el capturado en closure
      const alreadyHaveNumbers = calledNumbersRef.current.size > 0;
      
      if (isNewRoundNumber && isForwardTransition && !alreadyHaveNumbers) {
        console.log(
          `[GameInProgress] 🔄 FIX-ROUND-RESET: Nueva ronda detectada (${lastProcessedRoundRef.current} → ${data.round_number}), sin números previos. Limpiando...`
        );
        
        // Limpiar TODO antes de procesar el número de la nueva ronda
        setCalledNumbers(new Set());
        setCurrentNumber("");
        setLastNumbers([]);
        setLastCalledTimestamp(null);
        setMarkedNumbers(new Map());
        setProgress(0);
        
        // Resetear estados de ronda
        setRoundFinished(false);
        setRoundEnded(false);
        
        // Limpiar countdowns de la ronda anterior
        setRoundTransitionCountdown(null);
        setRoundTransitionCountdownFinish(null);
        setRoundStartCountdownFinish(null);
        setBingoClaimCountdown(null);
        setBingoClaimCountdownFinish(null);
        setTimeoutCountdown(null);
        setTimeoutStartTime(null);
        
        // Cerrar modales
        setBingoValidationOpen(false);
        setCurrentRoundWinners([]);
        setShowConfetti(false);
        setShowLoserAnimation(false);
        setModalOpen(false);
        setPreviewCardIndex(null);
        
        // Actualizar la ronda actual y la última procesada
        setCurrentRound(data.round_number);
        lastProcessedRoundRef.current = data.round_number;
        
        console.log(
          `[GameInProgress] ✅ FIX-ROUND-RESET: Limpieza completa. Procesando primer número de Round ${data.round_number}: ${data.number}`
        );
      } else if (isNewRoundNumber) {
        // FIX-CRITICAL: Solo actualizar refs sin limpiar números
        console.log(
          `[GameInProgress] 📝 FIX-CRITICAL: Actualizando refs de ronda (${lastProcessedRoundRef.current} → ${data.round_number}) SIN limpiar (ya hay ${calledNumbersRef.current.size} números)`
        );
        lastProcessedRoundRef.current = data.round_number;
        if (data.round_number !== currentRoundRef.current) {
          setCurrentRound(data.round_number);
        }
      }

      // FIX-REALTIME: Log detallado para diagnosticar números perdidos
      console.log(
        `[GameInProgress] 📥 number_called recibido: ${data.number}, Round ${data.round_number} (currentRoundRef: ${currentRoundRef.current})`
      );

      // Ignorar números de rondas anteriores (no de la actual)
      if (data.round_number !== currentRoundRef.current && !isNewRoundNumber) {
        console.log(
          `[GameInProgress] ⚠️ FIX-REALTIME: Número ${data.number} ignorado - ronda diferente (evento: ${data.round_number}, actual: ${currentRoundRef.current})`
        );
        return;
      }

      // FIX-REALTIME: NO ignorar números durante bingo_claimed
      // El usuario debe ver TODOS los números que salieron antes del bingo
      if (roundFinishedRef.current) {
        console.log(
          `[GameInProgress] ⚠️ FIX-REALTIME: Número ${data.number} ignorado - ronda finalizada`
        );
        return;
      }
      
      // FIX-REALTIME: Durante ventana de bingo, AÑADIR el número pero no resetear UI
      // Esto es importante porque los números pueden seguir saliendo durante la ventana
      if (bingoClaimCountdownRef.current !== null) {
        console.log(
          `[GameInProgress] ⚠️ FIX-REALTIME: Número ${data.number} durante ventana de bingo - añadiendo sin resetear UI`
        );
        // Añadir el número al set pero no continuar con el resto del procesamiento
        setCalledNumbers((prev) => {
          if (prev.has(data.number)) {
            return prev;
          }
          return new Set([...prev, data.number]);
        });
        return;
      }

      const calledTimestamp = new Date(data.called_at).getTime();
      
      lastCalledTimestampRef.current = calledTimestamp;
      
      // FASE 4: Procesar server_time y next_call_at para sincronización de progress bar
      if (data.server_time) {
        const clientNow = Date.now();
        const offset = data.server_time - clientNow;
        setServerTimeOffset(offset);
      }
      
      if (data.next_call_at) {
        setNextCallAt(data.next_call_at);
      }
      
      // CRITICAL-FIX: Detectar desincronización usando total_called del servidor
      // Si el servidor dice que hay más números de los que tenemos localmente, hay desincronización
      const localCount = calledNumbersRef.current.size;
      const serverTotalCalled = (data as any).total_called;
      
      // Si después de agregar este número, todavía tenemos menos que el servidor, hay desincronización
      const expectedLocalCount = localCount + (calledNumbersRef.current.has(data.number) ? 0 : 1);
      const hasDesync = serverTotalCalled && expectedLocalCount < serverTotalCalled;
      
      if (hasDesync) {
        console.warn(
          `[GameInProgress] ⚠️ CRITICAL-FIX: Desincronización detectada en number-called! Local: ${expectedLocalCount}, Servidor: ${serverTotalCalled}, Faltantes: ${serverTotalCalled - expectedLocalCount}`
        );
        
        // Forzar recarga de números desde el servidor
        getCalledNumbers(roomIdRef.current!, data.round_number)
          .then((calledNumbersData) => {
            if (!isMounted) return;
            
            if (calledNumbersData.length > calledNumbersRef.current.size) {
              console.log(
                `[GameInProgress] ✅ CRITICAL-FIX: Sincronizando ${calledNumbersData.length} números desde servidor (teníamos ${calledNumbersRef.current.size})`
              );
              
              const syncedNumbers = new Set(calledNumbersData.map((cn) => cn.number));
              setCalledNumbers(syncedNumbers);
              
              const lastCalled = calledNumbersData[calledNumbersData.length - 1];
              setCurrentNumber(lastCalled.number);
              
              if (lastCalled.called_at) {
                const timestamp = new Date(lastCalled.called_at).getTime();
                setLastCalledTimestamp(timestamp);
              }
              
              const lastThree = calledNumbersData
                .slice(-3)
                .reverse()
                .map((cn) => cn.number);
              setLastNumbers(lastThree);
            }
          })
          .catch((error) => {
            console.error(`[GameInProgress] Error al recargar números por desincronización:`, error);
          });
      } else {
        // Sin desincronización, agregar el número normalmente
        setCalledNumbers((prev) => {
          if (prev.has(data.number)) {
            return prev;
          }
          return new Set([...prev, data.number]);
        });
      }

      setCurrentNumber(data.number);
      setLastCalledTimestamp(calledTimestamp);
      
      // FIX-LAST-NUMBERS: Usar los últimos números del servidor para sincronización
      // Si el servidor envía last_three_numbers, usarlos directamente
      // Esto garantiza que todos los clientes vean los mismos números
      if (data.last_three_numbers && Array.isArray(data.last_three_numbers)) {
        setLastNumbers(data.last_three_numbers);
      } else if (!hasDesync) {
        // Fallback: construir localmente si el servidor no envía (compatibilidad)
        // Solo si NO hay desincronización (si la hay, ya se actualizó arriba)
        const currentLast = lastNumbersRef.current || [];
        const updated = [data.number, ...currentLast].slice(0, 3);
        setLastNumbers(updated);
      }

      setProgress(0);

      if (!isCallingNumberRef.current) {
        setIsCallingNumber(true);
        setRoundEnded(false);
      }

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
    const unsubscribeRoundStarted = onRoundStarted(async (data) => {
      if (!isMounted) return;

      if (data.room_id !== roomIdRef.current) {
        return;
      }

      const currentRoundValue = currentRoundRef.current;
      
      // FIX-CRITICAL: Ignorar si es una ronda anterior O si es la misma ronda y ya tenemos datos
      // Esto previene que un round-started del servidor borre números que ya cargamos
      const isOldRound = data.round_number < currentRoundValue;
      const isSameRoundWithData = data.round_number === currentRoundValue && calledNumbersRef.current.size > 0;
      
      if (isOldRound) {
        console.log(
          `[GameInProgress] ⏭️ Ignorando round-started para Round ${data.round_number} (round actual: ${currentRoundValue})`
        );
        return;
      }
      
      if (isSameRoundWithData) {
        console.log(
          `[GameInProgress] ⏭️ FIX-CRITICAL: Ignorando round-started para Round ${data.round_number} - ya tenemos ${calledNumbersRef.current.size} números cargados`
        );
        // Solo actualizar refs y estados de UI, NO borrar números
        setIsTransitioning(false);
        lastProcessedRoundRef.current = data.round_number;
        return;
      }

      console.log(
        `[GameInProgress] 🆕 Nueva ronda iniciada: Round ${data.round_number} (round anterior: ${currentRoundValue})`
      );
      console.log(
        `[GameInProgress] 🧹 Ejecutando RESET COMPLETO de UI para nueva ronda...`
      );

      // FIX-SYNC: Desactivar modo transición - la nueva ronda está lista
      setIsTransitioning(false);
      console.log(`[GameInProgress] 🔓 Modo transición DESACTIVADO - interacción permitida`);

      // ========================================
      // RESET COMPLETO DE UI - NUEVA RONDA
      // ========================================
      
      // 1. RESET de números y estado de juego (INMEDIATO)
      setCalledNumbers(new Set());
      setCurrentNumber("");
      setLastNumbers([]);
      setLastCalledTimestamp(null);
      setMarkedNumbers(new Map());
      
      // 2. RESET de estados de round
      setRoundFinished(false);
      setRoundEnded(false);
      setIsCallingNumber(false);
      setProgress(0);
      setCurrentRound(data.round_number);
      // FIX-ROUND-RESET: Actualizar la última ronda procesada
      lastProcessedRoundRef.current = data.round_number;
      
      // 3. RESET de todos los countdowns
      setRoundTransitionCountdown(null);
      setNextRoundNumber(null);
      setRoundTransitionCountdownFinish(null);
      setRoundStartCountdownFinish(null);
      setTimeoutCountdown(null);
      setTimeoutStartTime(null);
      setBingoClaimCountdown(null);
      setBingoClaimCountdownFinish(null);
      setRoomStartCountdown(null);
      setRoomStartCountdownFinish(null);
      
      // 4. RESET de modales y animaciones (CRÍTICO para el issue)
      setBingoValidationOpen(false);
      setCurrentRoundWinners([]);
      setCurrentWinnerIndex(0);
      setShowConfetti(false);
      setShowLoserAnimation(false);
      setModalOpen(false);
      setPreviewCardIndex(null);
      
      // 5. RESET del estado de game starting
      setIsGameStarting(false);
      
      // FIX-PATTERN: Si el evento incluye pattern, actualizar inmediatamente el bingo type
      // Esto evita mostrar el patrón de la ronda anterior mientras carga desde el servidor
      if (data.pattern) {
        console.log(
          `[GameInProgress] 🎯 Actualizando pattern desde round-started: ${data.pattern} para Round ${data.round_number}`
        );
        
        // Actualizar roundsData inmediatamente para que currentBingoType se recalcule
        setRoundsData((prevRounds) => {
          const updatedRounds = prevRounds.map((round) => {
            if (round.round_number === data.round_number) {
              return {
                ...round,
                status_id: { name: "in_progress", category: "round" },
                pattern_id: { name: data.pattern },
              };
            }
            // Marcar rondas anteriores como finished
            if (round.round_number < data.round_number) {
              return {
                ...round,
                status_id: { name: "finished", category: "round" },
              };
            }
            return round;
          });
          return updatedRounds;
        });

        // También actualizar roundBingoTypes directamente
        const newBingoType = mapPatternToBingoType(data.pattern);
        setRoundBingoTypes((prevTypes) => {
          const updatedTypes = [...prevTypes];
          updatedTypes[data.round_number - 1] = newBingoType;
          return updatedTypes;
        });
      }
      
      console.log(
        `[GameInProgress] ✅ Reset completo ejecutado para Round ${data.round_number}`
      );

      // Cargar datos de la nueva ronda
      try {
        const updatedRoundsData = await getRoomRounds(roomIdRef.current);
        const sortedUpdatedRounds = [...updatedRoundsData].sort(
          (a, b) => a.round_number - b.round_number
        );

        setRoundsData(sortedUpdatedRounds);

        const updatedBingoTypes = sortedUpdatedRounds.map((round) => {
          const pattern =
            typeof round.pattern_id === "object" && round.pattern_id
              ? round.pattern_id.name
              : "";
          return mapPatternToBingoType(pattern);
        });
        setRoundBingoTypes(updatedBingoTypes);

        // FIX-PATTERN: Incluir "bingo_claimed" para detectar rondas activas correctamente
        const activeRound = sortedUpdatedRounds.find((r) => {
          const status =
            typeof r.status_id === "object" && r.status_id
              ? r.status_id.name
              : "";
          return status === "in_progress" || status === "starting" || status === "bingo_claimed";
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
          if (activeRound.round_number !== currentRoundRef.current) {
            setCurrentRound(activeRound.round_number);
          }
        } else {
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

      // Cargar números llamados de la nueva ronda (si ya hay algunos)
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

      if (
        data.room_id === roomId &&
        (data.round_number === currentRound ||
          data.round_number >= currentRound)
      ) {
        const winnerName = data.winner.user_name || 'Un jugador';
        const winnerCardCode = data.winner.card_code || data.winner.card_id;
        
        console.log(
          `[GameInProgress] Bingo reclamado en round ${data.round_number}${
            data.winner.is_first
              ? " (PRIMER BINGO - iniciando ventana de 45s)"
              : " (bingo adicional durante ventana)"
          }`
        );
        console.log(
          `[GameInProgress] Ganador: ${winnerName} con cartón ${winnerCardCode}`
        );

        if (data.round_number > currentRound) {
          console.log(
            `[GameInProgress] Actualizando round actual desde bingo reclamado: Round ${data.round_number} (antes: Round ${currentRound})`
          );
          setCurrentRound(data.round_number);
        }

        if (data.winner.is_first) {
          setIsCallingNumber(false);
          setProgress(0);
          setTimeoutCountdown(null);
          setTimeoutStartTime(null);

          setModalOpen(false);
          setPreviewCardIndex(null);

          // ISSUE-FIX: Verificar si el usuario tiene bingo o si ya cantó bingo en esta ronda
          let userHasBingo = false;
          for (let i = 0; i < playerCards.length; i++) {
            const card = playerCards[i];
            const cardMarked = getMarkedForCard(i);
            if (hasBingo(card, cardMarked, currentBingoType)) {
              userHasBingo = true;
              break;
            }
          }

          // FIX-3: Solo mostrar "Mala Suerte" si el usuario:
          // 1. NO tiene bingo en sus cartones
          // 2. NO ha cantado bingo en esta ronda
          // Si el usuario ya cantó bingo, no debe ver "Mala Suerte" aunque otro gane
          // Usamos ref para obtener valor actualizado (evita closure stale)
          const hasClaimedCurrentRound = hasClaimedBingoInRoundRef.current;
          if (!userHasBingo && !hasClaimedCurrentRound) {
            setShowLoserAnimation(true);
            console.log(`[GameInProgress] 😢 Mostrando animación "Mala Suerte" - usuario no tiene bingo ni cantó bingo`);
            setTimeout(() => {
              setShowLoserAnimation(false);
            }, 3000);
          } else if (hasClaimedCurrentRound) {
            console.log(`[GameInProgress] ✅ Usuario ya cantó bingo en esta ronda, no se muestra "Mala Suerte"`);
          }

          try {
            console.log(
              `[GameInProgress] Obteniendo ganadores para Round ${data.round_number}...`
            );
            const winnersData = await getRoomWinners(roomId!);
            const roundWinners = winnersData.filter(
              (w) => w.round_number === data.round_number
            );
            console.log(
              `[GameInProgress] Encontrados ${roundWinners.length} ganador(es) para Round ${data.round_number}`
            );

            let allCalledNumbers = calledNumbers;
            try {
              const calledNumbersData = await getCalledNumbers(
                roomId!,
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

            const winnersForModal: import("../Components/BingoValidationModal").WinnerData[] =
              [];

            for (const winner of roundWinners) {
              try {
                const { api } = await import("../Services/api");
                const cardResponse = await api.get(`/cards/${winner.card_id}`);

                if (cardResponse.data) {
                  const cardData = cardResponse.data;
                  
                  // FIX-2: Validar que numbers_json existe y es un array antes de convertir
                  if (!cardData.numbers_json || !Array.isArray(cardData.numbers_json)) {
                    console.error(
                      `[GameInProgress] ⚠️ Cartón ${winner.card_id} no tiene numbers_json válido:`,
                      cardData.numbers_json
                    );
                    continue; // Saltar este cartón y continuar con el siguiente
                  }
                  
                  const cardNumbers = convertCardNumbers(cardData.numbers_json);
                  const cardMarked = new Set<string>();

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

      if (
        data.room_id === roomId &&
        (data.round_number === currentRound ||
          data.round_number >= currentRound)
      ) {
        // SYNC-FIX: Sincronizar offset con server_time del evento
        if (data.server_time) {
          const clientNow = Date.now();
          const offset = data.server_time - clientNow;
          setServerTimeOffset(offset);
        }
        
        console.log(
          `[GameInProgress] Countdown de ventana de bingo: ${data.seconds_remaining}s restantes para Round ${data.round_number}`
        );

        if (data.round_number > currentRound) {
          console.log(
            `[GameInProgress] Actualizando round actual desde countdown de bingo: Round ${data.round_number} (antes: Round ${currentRound})`
          );
          setCurrentRound(data.round_number);
        }

        if (data.finish_timestamp) {
          setBingoClaimCountdownFinish(data.finish_timestamp);
        } else if (data.seconds_remaining > 0) {
          setBingoClaimCountdown(data.seconds_remaining);
        } else {
          console.log(
            `[GameInProgress] Ventana de bingo cerrada. Finalizando round ${data.round_number}...`
          );
          setBingoClaimCountdown(null);
          setBingoClaimCountdownFinish(null);
          
          // FIX-4: Safety net - cerrar modal si aún está abierto cuando countdown termina
          // Esto previene que el modal quede abierto si round-cleanup no llega
          console.log(
            `[GameInProgress] 🧹 Safety net: Cerrando modal de bingo al finalizar ventana de 45s`
          );
          setBingoValidationOpen(false);
          setShowConfetti(false);
          setShowLoserAnimation(false);
        }
      }
    });

    // Escuchar eventos de round finalizado
    const unsubscribeRoundFinished = onRoundFinished(async (data) => {
      if (!isMounted) return;

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
        setBingoClaimCountdown(null);
        
        // FIX-ROOM-FINISH: Safety net para detectar cuando la última ronda termina
        // Si esta es la última ronda, marcar la sala como finalizada después de un timeout
        // Esto previene que el usuario quede en un estado inconsistente si room-finished no llega
        const isLastRound = data.round_number === totalRounds;
        if (isLastRound) {
          console.log(
            `[GameInProgress] ⚠️ FIX-ROOM-FINISH: Última ronda (${data.round_number}/${totalRounds}) finalizada. Activando safety net...`
          );
          
          // Esperar 10 segundos para dar tiempo al evento room-finished
          // Si no llega, cargar ganadores y marcar la sala como finalizada manualmente
          setTimeout(async () => {
            if (!isMounted) return;
            
            // Verificar si la sala ya fue marcada como finalizada por el evento room-finished
            // Si roomFinished ya es true, no hacer nada (el evento llegó)
            // Usamos una llamada al API para verificar el estado actual
            try {
              console.log(
                `[GameInProgress] 🔄 FIX-ROOM-FINISH: Verificando estado de la sala después de última ronda...`
              );
              
              const winnersData = await getRoomWinners(roomIdRef.current!);
              
              // Si hay ganadores para la última ronda, la sala está finalizada
              const hasLastRoundWinner = winnersData.some(w => w.round_number === totalRounds);
              
              if (hasLastRoundWinner) {
                console.log(
                  `[GameInProgress] ✅ FIX-ROOM-FINISH: Detectado ganador de última ronda. Marcando sala como finalizada...`
                );
                
                setRoomFinished(true);
                setWinners(winnersData);
                
                const winnerCards: BingoGrid[] = [];
                const winnerCardsData: Array<{ _id: string; code: string }> = [];
                const winningNumbers = new Map<string, Set<string>>();
                
                const sortedWinners = [...winnersData].sort((a, b) => a.round_number - b.round_number);
                
                sortedWinners.forEach((winner) => {
                  console.log(
                    `[GameInProgress] FIX-ROOM-FINISH: Procesando ganador - Ronda ${winner.round_number}: Pattern=${winner.pattern}, Cartón ${winner.card_code}, bingo_numbers: ${winner.bingo_numbers?.length || 0}`
                  );
                  winnerCards.push(convertCardNumbers(winner.card_numbers));
                  winnerCardsData.push({ _id: winner.card_id, code: winner.card_code });
                  // FIX-WINNING-MAP: Usar clave compuesta para cuando el mismo cartón gana múltiples rondas
                  const mapKey = `${winner.card_id}_round_${winner.round_number}`;
                  winningNumbers.set(mapKey, new Set(winner.bingo_numbers));
                });
                
                setPlayerCards(winnerCards);
                setPlayerCardsData(winnerCardsData);
                setWinningNumbersMap(winningNumbers);
                
                const allCalledNumbers = new Set<string>();
                for (const winner of winnersData) {
                  winner.called_numbers.forEach((num: string) => allCalledNumbers.add(num));
                }
                setCalledNumbers(allCalledNumbers);
                setCurrentRound(totalRounds);
                
                console.log(
                  `[GameInProgress] ✅ FIX-ROOM-FINISH: Sala marcada como finalizada con ${winnersData.length} ganadores`
                );
              } else {
                console.log(
                  `[GameInProgress] ⏳ FIX-ROOM-FINISH: No se encontró ganador de última ronda aún, esperando...`
                );
              }
            } catch (error) {
              console.error(
                `[GameInProgress] ❌ FIX-ROOM-FINISH: Error al verificar estado de sala:`, error
              );
            }
          }, 10000); // Esperar 10 segundos
        }
      }
    });

    // Escuchar eventos de countdown de transición entre rondas
    const unsubscribeRoundTransitionCountdown = onRoundTransitionCountdown(
      (data) => {
        if (!isMounted) return;

        if (data.room_id !== roomIdRef.current) {
          return;
        }

        // SYNC-FIX: Sincronizar offset con server_time del evento
        if (data.server_time) {
          const clientNow = Date.now();
          const offset = data.server_time - clientNow;
          setServerTimeOffset(offset);
        }

        console.log(
          `[GameInProgress] Countdown de transición: ${data.seconds_remaining}s para Round ${data.next_round_number}`
        );
        
        setRoundFinished(false);
        setRoundEnded(false);
        
        const currentRoundValue = currentRoundRef.current;
        if (data.next_round_number && data.next_round_number > currentRoundValue) {
          console.log(
            `[GameInProgress] Actualizando round actual durante transición: Round ${data.next_round_number} (antes: Round ${currentRoundValue})`
          );
          
          // ========================================
          // FIX-MODE: Actualizar roundsData para que currentBingoType use el pattern correcto
          // Marcar rondas anteriores como "finished" para que no sean consideradas "activas"
          // ========================================
          setRoundsData((prevRounds) => {
            const updatedRounds = prevRounds.map((round) => {
              // Marcar todas las rondas anteriores a la nueva como "finished"
              if (round.round_number < data.next_round_number) {
                const currentStatus = typeof round.status_id === "object" && round.status_id
                  ? round.status_id.name
                  : "";
                // Solo actualizar si NO está ya como "finished"
                if (currentStatus !== "finished") {
                  console.log(
                    `[GameInProgress] 🎯 FIX-MODE (transition): Marcando Round ${round.round_number} como finished`
                  );
                  return {
                    ...round,
                    status_id: { name: "finished", category: "round" },
                  };
                }
              }
              return round;
            });
            return updatedRounds;
          });
          
          setCurrentRound(data.next_round_number);
        }
        
        if (data.finish_timestamp) {
          // Solo actualizar si no es la misma ronda
          if (data.next_round_number !== currentRoundRef.current) {
            setRoundTransitionCountdownFinish(data.finish_timestamp);
          }
          setNextRoundNumber(data.next_round_number);
          setIsCallingNumber(false);
        } else if (data.seconds_remaining > 0) {
          setRoundTransitionCountdown(data.seconds_remaining);
          setNextRoundNumber(data.next_round_number);
          setIsCallingNumber(false);
        } else {
          console.log(
            `[GameInProgress] Countdown de transición completado. Esperando inicio de Round ${data.next_round_number}...`
          );
          setRoundTransitionCountdown(null);
          setNextRoundNumber(null);
          setRoundTransitionCountdownFinish(null);
        }
      }
    );

    // Escuchar eventos de limpieza entre rondas
    const unsubscribeRoundCleanup = onRoundCleanup((data) => {
      if (!isMounted) return;

      if (data.room_id === roomIdRef.current) {
        // FIX-CRITICAL: Solo procesar si la transición es HACIA ADELANTE desde nuestra ronda actual
        // Esto previene que eventos de transiciones pasadas (por reconexión) borren datos
        const isRelevantTransition = data.previous_round_number === currentRoundRef.current && 
                                      data.next_round_number > currentRoundRef.current;
        
        if (!isRelevantTransition) {
          console.log(
            `[GameInProgress] ⏭️ FIX-CRITICAL: Ignorando round-cleanup irrelevante (prev: ${data.previous_round_number}, next: ${data.next_round_number}, current: ${currentRoundRef.current})`
          );
          return;
        }
        
        console.log(
          `[GameInProgress] 🧹 Preparando transición: Round ${data.previous_round_number} → Round ${data.next_round_number}`
        );

        // FIX-SYNC: Activar modo transición para bloquear interacción
        // Esto previene que el usuario cante bingo con datos viejos
        setIsTransitioning(true);
        console.log(`[GameInProgress] 🔒 Modo transición ACTIVADO - interacción bloqueada`);

        // ========================================
        // FIX-MODE: Actualizar roundsData para que currentBingoType use el pattern correcto
        // CRÍTICO: Sin esto, el useMemo de currentBingoType sigue viendo la ronda anterior
        // como "activa" y muestra el pattern incorrecto
        // ========================================
        setRoundsData((prevRounds) => {
          const updatedRounds = prevRounds.map((round) => {
            // Marcar la ronda anterior como "finished" para que ya no sea considerada "activa"
            if (round.round_number === data.previous_round_number) {
              console.log(
                `[GameInProgress] 🎯 FIX-MODE: Marcando Round ${round.round_number} como finished`
              );
              return {
                ...round,
                status_id: { name: "finished", category: "round" },
              };
            }
            return round;
          });
          return updatedRounds;
        });
        console.log(
          `[GameInProgress] ✅ FIX-MODE: roundsData actualizado - Round ${data.previous_round_number} marcado como finished`
        );

        // ========================================
        // ISSUE-2 FIX: Limpiar TODO ANTES de la transición
        // El usuario quiere ver los cartones limpios ANTES de pasar a la siguiente ronda
        // Esto evita confusión sobre qué números son de la ronda actual vs anterior
        // ========================================
        
        // 1. LIMPIAR números llamados y marcados AHORA (antes de la transición)
        setCalledNumbers(new Set());
        setCurrentNumber("");
        setLastNumbers([]);
        setLastCalledTimestamp(null);
        setMarkedNumbers(new Map());
        
        setProgress(0);
        
        // 2. RESET de estados de round
        setIsCallingNumber(false);
        setRoundFinished(false);
        setRoundEnded(false);
        
        // 3. RESET de countdowns
        setTimeoutCountdown(null);
        setTimeoutStartTime(null);
        setBingoClaimCountdown(null);
        setBingoClaimCountdownFinish(null);
        
        // 4. RESET de modales y animaciones (CRÍTICO)
        setBingoValidationOpen(false);
        setCurrentRoundWinners([]);
        setCurrentWinnerIndex(0);
        setShowConfetti(false);
        setShowLoserAnimation(false);
        setModalOpen(false);
        setPreviewCardIndex(null);
        
        console.log(
          `[GameInProgress] ✅ ISSUE-2 FIX: Cartones y números LIMPIADOS antes de la transición`
        );

        // Actualizar al siguiente round
        if (data.next_round_number > currentRoundRef.current) {
          setCurrentRound(data.next_round_number);
          // FIX-ROUND-RESET: Actualizar la última ronda procesada
          lastProcessedRoundRef.current = data.next_round_number;
        }
      }
    });

    // ISSUE-3 + FASE 5: Escuchar evento de sincronización completa de ronda
    // Este evento se recibe cuando una nueva ronda está lista y también
    // cada 10 números para recalibrar el progress bar
    const unsubscribeRoundSync = onRoundSync((data) => {
      if (!isMounted) return;

      if (data.room_id !== roomIdRef.current) {
        return;
      }

      // FASE 5: Procesar server_time y next_call_at para sincronización de progress bar
      if (data.server_time) {
        const clientNow = Date.now();
        const offset = data.server_time - clientNow;
        setServerTimeOffset(offset);
      }
      
      if (data.next_call_at) {
        setNextCallAt(data.next_call_at);
      }

      console.log(
        `[GameInProgress] 🔄 Sincronización de ronda recibida: Round ${data.round_number}, status: ${data.status}, called_count: ${data.called_count}`
      );

      // Detectar si es una nueva ronda (cambio de round)
      const isNewRound = data.round_number !== currentRoundRef.current;
      
      // Actualizar el round actual si es diferente
      if (isNewRound) {
        console.log(
          `[GameInProgress] 🆕 Detectada nueva ronda en round-sync: ${currentRoundRef.current} → ${data.round_number}`
        );
        setCurrentRound(data.round_number);
        // FIX-ROUND-RESET: Actualizar la última ronda procesada
        lastProcessedRoundRef.current = data.round_number;
      }

      // FIX-PATTERN: Actualizar roundsData con el pattern del evento para que currentBingoType se actualice correctamente
      if (data.pattern && (isNewRound || data.status === "in_progress")) {
        console.log(
          `[GameInProgress] 🎯 Actualizando pattern desde round-sync: ${data.pattern} para Round ${data.round_number}`
        );
        
        // Actualizar roundsData para que el cálculo de currentBingoType use el pattern correcto
        setRoundsData((prevRounds) => {
          const updatedRounds = prevRounds.map((round) => {
            if (round.round_number === data.round_number) {
              return {
                ...round,
                status_id: { name: data.status, category: "round" },
                pattern_id: { name: data.pattern },
              };
            }
            // Marcar rondas anteriores como finished si es una nueva ronda
            if (isNewRound && round.round_number < data.round_number) {
              return {
                ...round,
                status_id: { name: "finished", category: "round" },
              };
            }
            return round;
          });
          return updatedRounds;
        });

        // También actualizar roundBingoTypes directamente
        const newBingoType = mapPatternToBingoType(data.pattern);
        setRoundBingoTypes((prevTypes) => {
          const updatedTypes = [...prevTypes];
          updatedTypes[data.round_number - 1] = newBingoType;
          return updatedTypes;
        });
      }

      // Si el round está en progreso, preparar la UI
      if (data.status === "in_progress") {
        // FIX-SYNC: Desactivar modo transición si está activo
        setIsTransitioning(false);
        
        // ========================================
        // RESET CONDICIONAL - FIX-SYNC
        // ========================================
        
        // FIX-SYNC: Solo limpiar números si es una nueva ronda Y tenemos menos números localmente
        // Esto previene que events con called_count=0 borren números que ya tenemos
        // FIX-CRITICAL: Usar REF para ver valor actual
        const shouldClearNumbers = isNewRound && calledNumbersRef.current.size === 0;
        
        if (shouldClearNumbers) {
          console.log(`[GameInProgress] 🧹 FIX-SYNC: Limpiando números para nueva ronda ${data.round_number}`);
          setCalledNumbers(new Set());
          setCurrentNumber("");
          setLastNumbers([]);
          setLastCalledTimestamp(null);
          setMarkedNumbers(new Map());
        } else if (data.called_count === 0 && calledNumbersRef.current.size > 0) {
          // FIX-SYNC: No limpiar si ya tenemos números localmente
          console.log(`[GameInProgress] ⚠️ FIX-SYNC: Ignorando reset - ya tenemos ${calledNumbersRef.current.size} números localmente`);
        }
        setProgress(0);
        
        // 2. Limpiar countdowns
        setRoundTransitionCountdown(null);
        setRoundTransitionCountdownFinish(null);
        setRoundStartCountdownFinish(null);
        setNextRoundNumber(null);
        setBingoClaimCountdown(null);
        setBingoClaimCountdownFinish(null);
        setTimeoutCountdown(null);
        setTimeoutStartTime(null);
        
        // 3. Actualizar estados de juego
        setRoundFinished(false);
        setRoundEnded(false);
        setIsGameStarting(false);
        
        // 4. RESET de modales y animaciones (CRÍTICO - siempre en nueva ronda)
        if (isNewRound) {
          setBingoValidationOpen(false);
          setCurrentRoundWinners([]);
          setCurrentWinnerIndex(0);
          setShowConfetti(false);
          setShowLoserAnimation(false);
          setModalOpen(false);
          setPreviewCardIndex(null);
          console.log(
            `[GameInProgress] 🧹 Reset completo de UI ejecutado en round-sync`
          );
        }
        
        // CRITICAL-FIX: Detectar desincronización comparando conteos
        const localCount = calledNumbersRef.current.size;
        const serverCount = data.called_count || (data.called_numbers?.length || 0);
        const serverHasMoreNumbers = serverCount > localCount;
        
        // Si hay números llamados Y (el servidor tiene más O es nueva ronda), sincronizarlos
        if (data.called_numbers && data.called_numbers.length > 0) {
          // CRITICAL-FIX: Si el servidor tiene más números que nosotros, FORZAR sincronización
          if (serverHasMoreNumbers || isNewRound) {
            console.log(
              `[GameInProgress] 🔄 CRITICAL-FIX: Sincronizando números - Local: ${localCount}, Servidor: ${serverCount}, Diferencia: ${serverCount - localCount}`
            );
            
            const syncedNumbers = new Set(
              data.called_numbers.map((cn) => cn.number)
            );
            setCalledNumbers(syncedNumbers);
            
            const lastCalled = data.called_numbers[data.called_numbers.length - 1];
            setCurrentNumber(lastCalled.number);
            
            if (lastCalled.called_at) {
              const timestamp = new Date(lastCalled.called_at).getTime();
              setLastCalledTimestamp(timestamp);
            }
            
            const lastThree = data.called_numbers
              .slice(-3)
              .reverse()
              .map((cn) => cn.number);
            setLastNumbers(lastThree);
            
            setIsCallingNumber(true);
            
            console.log(
              `[GameInProgress] ✅ CRITICAL-FIX: Sincronización forzada completada - Ahora tenemos ${syncedNumbers.size} números`
            );
          } else {
            console.log(
              `[GameInProgress] ⏭️ Sync no necesario - Local: ${localCount}, Servidor: ${serverCount}`
            );
          }
        } else if (serverHasMoreNumbers && serverCount > 0) {
          // CRITICAL-FIX: El servidor dice que tiene más números pero no los envió
          // Esto no debería pasar con el fix del backend, pero por seguridad logueamos
          console.warn(
            `[GameInProgress] ⚠️ CRITICAL-FIX: Servidor tiene más números (${serverCount}) que local (${localCount}) pero no envió called_numbers`
          );
        }
        
        console.log(
          `[GameInProgress] ✅ Sincronización completada para Round ${data.round_number} (${calledNumbersRef.current.size} números)`
        );
      }
    });

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
        setRoundFinished(true);
        setRoundEnded(true);
        setIsCallingNumber(false);
        setProgress(0);
        setBingoClaimCountdown(null);
        setRoundTransitionCountdown(null);
        setNextRoundNumber(data.next_round_number || null);
      }
    });

    // Escuchar actualizaciones de status de sala en tiempo real
    const unsubscribeRoomStatusUpdated = onRoomStatusUpdated((data) => {
      if (!isMounted) return;

      if (data.room_id === roomId) {
        console.log(
          `[GameInProgress] Status de sala actualizado: ${data.status}`
        );

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

    // NOTA: Los listeners de room-prize-updated y cards-enrolled se manejan 
    // en el useEffect de pre-juego para que funcionen antes y después de que empiece el juego

    // Escuchar eventos de countdown de inicio de sala
    const unsubscribeRoomStartCountdown = onRoomStartCountdown((data: any) => {
      if (!isMounted) return;

      if (data.room_id === roomId) {
        // SYNC-FIX: Sincronizar offset con server_time del evento
        if (data.server_time) {
          const clientNow = Date.now();
          const offset = data.server_time - clientNow;
          setServerTimeOffset(offset);
        }
        
        if (roundTransitionCountdown !== null && roundTransitionCountdown > 0) {
          console.log(
            `[GameInProgress] Ignorando countdown de inicio de sala: hay countdown de transición activo (${roundTransitionCountdown}s)`
          );
          return;
        }
        
        if (data.finish_timestamp) {
          // Solo actualizar si no hay un finish_timestamp previo
          setRoomStartCountdownFinish(data.finish_timestamp);
          console.log(
            `[GameInProgress] Iniciando countdown de inicio de sala: ${data.seconds_remaining}s (finish: ${new Date(data.finish_timestamp).toISOString()})`
          );
        }
        
        if (data.seconds_remaining > 0) {
          setRoomStartCountdown(data.seconds_remaining);
          if (!data.finish_timestamp) {
            const estimatedFinish = Date.now() + (data.seconds_remaining * 1000);
            // Solo establecer si no hay uno previo
            setRoomStartCountdownFinish(estimatedFinish);
            console.log(
              `[GameInProgress] Estableciendo finish_timestamp estimado para countdown de inicio de sala: ${data.seconds_remaining}s`
            );
          }
        } else if (data.seconds_remaining === 0) {
          setRoomStartCountdown(null);
          setRoomStartCountdownFinish(null);
        }
      }
    });

    // Escuchar eventos de countdown antes de empezar a llamar números
    const unsubscribeRoundStartCountdown = onRoundStartCountdown((data: any) => {
      if (!isMounted) return;

      if (
        data.room_id === roomId &&
        (data.round_number === currentRound ||
          data.round_number >= currentRound)
      ) {
        // SYNC-FIX: Sincronizar offset con server_time del evento
        if (data.server_time) {
          const clientNow = Date.now();
          const offset = data.server_time - clientNow;
          setServerTimeOffset(offset);
        }
        
        if (data.round_number > currentRound) {
          console.log(
            `[GameInProgress] Actualizando round actual desde countdown: Round ${data.round_number} (antes: Round ${currentRound})`
          );
          setCurrentRound(data.round_number);
        }

        if (data.finish_timestamp) {
          // Solo actualizar si es para la ronda actual
          if (data.round_number === currentRound) {
            setRoundStartCountdownFinish(data.finish_timestamp);
            console.log(
              `[GameInProgress] Iniciando countdown para Round ${data.round_number}: ${data.seconds_remaining}s (finish: ${new Date(data.finish_timestamp).toISOString()})`
            );
          }
          setNextRoundNumber(data.round_number);
          setIsCallingNumber(false);
        } else if (data.seconds_remaining === 0) {
          console.log(
            `[GameInProgress] Countdown de inicio completado para Round ${data.round_number}. Los números comenzarán a llamarse...`
          );
          setRoundTransitionCountdown(null);
          setNextRoundNumber(null);
          setRoundStartCountdownFinish(null);
        }
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
    const unsubscribeRoundStatusChanged = onRoundStatusChanged((data: any) => {
      if (!isMounted) return;

      const currentRoomId = roomIdRef.current;
      const currentRoundValue = currentRoundRef.current;

      if (data.room_id === currentRoomId && data.round_number !== undefined && (data.round_number === currentRoundValue || data.round_number >= currentRoundValue)) {
        console.log(
          `[GameInProgress] Round ${data.round_number} cambió a status '${data.status}'`
        );

        if (data.round_number !== undefined && data.round_number > currentRoundValue) {
          console.log(
            `[GameInProgress] Actualizando round actual desde round-status-changed: Round ${data.round_number} (antes: Round ${currentRoundValue})`
          );
          setCurrentRound(data.round_number);
        }

        if (data.status === "in_progress") {
          setRoundTransitionCountdown(null);
          setRoundStartCountdownFinish(null);
          setRoundTransitionCountdownFinish(null);
          setRoundFinished(false);
          setRoundEnded(false);
          setIsGameStarting(false);
          
          if (currentRoomId && data.round_number !== undefined && typeof data.round_number === 'number') {
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
      }
    });

    // Escuchar eventos de sala finalizada
    const unsubscribeRoomFinished = onRoomFinished(async (data) => {
      if (!isMounted) return;

      if (data.room_id === roomId) {
        console.log(
          `[GameInProgress] 🏁 ========== EVENTO ROOM-FINISHED RECIBIDO ==========`
        );
        console.log(
          `[GameInProgress] 🏁 Sala ${data.room_name} finalizada. Cargando ganadores...`
        );

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

        try {
          const winnersData = await getRoomWinners(roomId);
          console.log(
            `[GameInProgress] 🏆 Ganadores obtenidos del servidor:`, 
            winnersData.map(w => ({ round: w.round_number, pattern: w.pattern, card: w.card_code }))
          );
          setWinners(winnersData);

          const winnerCards: BingoGrid[] = [];
          const winnerCardsData: Array<{ _id: string; code: string }> = [];
          // ISSUE-8: Usar card_id como clave para que miniaturas y modal usen la misma fuente de datos
          const winningNumbers = new Map<string, Set<string>>();

          const sortedWinners = [...winnersData].sort(
            (a, b) => a.round_number - b.round_number
          );

          sortedWinners.forEach((winner) => {
            // FIX-PATTERN-LOG: Log detallado incluyendo el patrón para diagnóstico
            console.log(
              `[GameInProgress] 🎯 Procesando ganador - Ronda ${winner.round_number}: Pattern="${winner.pattern}", Cartón ${winner.card_code} (ID: ${winner.card_id}), bingo_numbers: ${winner.bingo_numbers?.length || 0}`
            );
            winnerCards.push(convertCardNumbers(winner.card_numbers));
            winnerCardsData.push({
              _id: winner.card_id,
              code: winner.card_code,
            });
            // FIX-WINNING-MAP: Usar clave compuesta para cuando el mismo cartón gana múltiples rondas
            const mapKey = `${winner.card_id}_round_${winner.round_number}`;
            winningNumbers.set(mapKey, new Set(winner.bingo_numbers));
          });

          console.log(
            `[GameInProgress] ✅ Total ganadores cargados: ${winnerCards.length}`
          );
          console.log(
            `[GameInProgress] 📋 Resumen de ganadores:`,
            sortedWinners.map(w => `R${w.round_number}: ${w.pattern} (${w.card_code})`).join(', ')
          );

          setPlayerCards(winnerCards);
          setPlayerCardsData(winnerCardsData);
          setWinningNumbersMap(winningNumbers);

          const allCalledNumbers = new Set<string>();
          for (const winner of winnersData) {
            winner.called_numbers.forEach((num: string) =>
              allCalledNumbers.add(num)
            );
          }
          setCalledNumbers(allCalledNumbers);

          setCurrentRound(totalRounds);
          
          console.log(
            `[GameInProgress] 🏁 ========== SALA FINALIZADA CORRECTAMENTE ==========`
          );
        } catch (error) {
          console.error(`[GameInProgress] ❌ Error al cargar ganadores:`, error);
        }
      }
    });

    // FIX-RELOAD: NO cargar números iniciales aquí si useGameData ya los cargó
    // useGameData ya carga los números en la carga inicial de la página
    // Esta función causaba una condición de carrera donde sobrescribía los números
    // con una versión potencialmente más vieja o incompleta
    //
    // Solo cargamos si NO tenemos números aún (para casos de reconexión rápida)
    const loadInitialNumbers = async () => {
      // FIX-RELOAD: Verificar si ya tenemos números antes de cargar
      // Usamos calledNumbers del closure para verificar el estado actual
      // FIX-CRITICAL: Usar REF para ver valor actual, no el capturado en closure
      if (calledNumbersRef.current.size > 0 || initialLoadCompleteRef.current) {
        console.log(`[GameInProgress] ⏭️ FIX-RELOAD: Ya tenemos ${calledNumbersRef.current.size} números (initialLoadComplete: ${initialLoadCompleteRef.current}), saltando loadInitialNumbers`);
        return;
      }
      
      try {
        console.log(`[GameInProgress] 📥 FIX-RELOAD: Cargando números iniciales para Round ${currentRound}...`);
        const calledNumbersData = await getCalledNumbers(roomId!, currentRound);

        if (calledNumbersData.length > 0) {
          const lastCalled = calledNumbersData[calledNumbersData.length - 1];
          const lastTimestamp = new Date(lastCalled.called_at).getTime();

          setLastCalledTimestamp(lastTimestamp);
          lastCalledTimestampRef.current = lastTimestamp;

          const numbersSet = new Set(calledNumbersData.map((cn) => cn.number));
          setCalledNumbers(numbersSet);

          setCurrentNumber(lastCalled.number);
          setLastNumbers(
            calledNumbersData
              .slice(-3)
              .reverse()
              .map((cn) => cn.number)
          );
          
          console.log(`[GameInProgress] ✅ FIX-RELOAD: Cargados ${numbersSet.size} números iniciales`);
        }
      } catch {
        // Error silencioso al cargar números iniciales
      }
    };

    loadInitialNumbers();

    return () => {
      isMounted = false;

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      unsubscribeNumberCalled();
      unsubscribeRoomStateSync();
      // Los listeners de room-prize-updated y cards-enrolled se manejan en el useEffect de pre-juego
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
      unsubscribeRoundCleanup();
      unsubscribeRoundSync();
      unsubscribeRoomStatusUpdated();
      unsubscribeRoomFinished();
    };
    // FIX-REALTIME: Removido currentRound de las dependencias
    // Los handlers usan currentRoundRef que se actualiza automáticamente
    // Esto previene que los listeners se re-registren cuando cambia la ronda,
    // lo cual causaba que se perdieran eventos durante la re-suscripción
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameStarted,
    roomId,
    // currentRound - REMOVIDO: usar currentRoundRef.current dentro de los handlers
  ]);
}

