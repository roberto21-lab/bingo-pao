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
  setWinningNumbersMap: React.Dispatch<React.SetStateAction<Map<number, Set<string>>>>,
  setModalOpen: (value: boolean) => void,
  setPreviewCardIndex: (value: number | null) => void,
  setBingoValidationOpen: (value: boolean) => void,
  setCurrentRoundWinners: React.Dispatch<React.SetStateAction<import("../Components/BingoValidationModal").WinnerData[]>>,
  setCurrentWinnerIndex: (value: number) => void,
  setShowConfetti: (value: boolean) => void,
  setShowLoserAnimation: (value: boolean) => void,
  setRoomStartCountdown: (value: number | null) => void,
  setRoomStartCountdownFinish: (value: number | null) => void,
  progressIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
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
  }, [currentRound, roomId, roundFinished, bingoClaimCountdown, isCallingNumber, isGameStarting, roundTransitionCountdown, lastCalledTimestamp, timeoutCountdown, timeoutStartTime]);

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
          console.log(
            `[GameInProgress] 🔄 Sincronizando estado: Round ${data.round.round_number}, ${data.round.called_count || 0} números llamados`
          );
          
          // CRÍTICO: Sincronizar números llamados desde el estado recibido
          if (data.round.called_numbers && Array.isArray(data.round.called_numbers)) {
            const syncedNumbers = new Set(
              data.round.called_numbers.map((cn: { number: string }) => cn.number)
            );
            setCalledNumbers(syncedNumbers);
            
            // Actualizar número actual y últimos números
            if (data.round.called_numbers.length > 0) {
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
            }
            
            console.log(
              `[GameInProgress] ✅ ${syncedNumbers.size} número(s) sincronizado(s) desde estado del servidor`
            );
          }
          
          // Activar estados de juego
          setIsCallingNumber(true);
          setRoundEnded(false);
          setRoundFinished(false);
          setRoomFinished(false);
          setIsGameStarting(false);
          setProgress(0);
          
          console.log(
            `[GameInProgress] ✅ Estado sincronizado completamente para Round ${data.round.round_number}`
          );

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

          setIsGameStarting(false);
          setIsCallingNumber(true);
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
        console.log(`[GameInProgress] No hay ronda activa en la sala`);
        setCurrentRound(1);
        setCalledNumbers(new Set());
        setCurrentNumber("");
        setLastNumbers([]);
        setLastCalledTimestamp(null);
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

      if (data.round_number !== currentRoundRef.current || data.room_id !== roomIdRef.current) {
        return;
      }

      if (roundFinishedRef.current || bingoClaimCountdownRef.current !== null) {
        return;
      }

      const calledTimestamp = new Date(data.called_at).getTime();
      
      lastCalledTimestampRef.current = calledTimestamp;
      
      setCalledNumbers((prev) => {
        if (prev.has(data.number)) {
          return prev;
        }
        return new Set([...prev, data.number]);
      });

      setCurrentNumber(data.number);
      setLastCalledTimestamp(calledTimestamp);
      
      // Usar el estado actual de lastNumbers pasado como parámetro
      const currentLast = lastNumbers || [];
      const updated = [data.number, ...currentLast].slice(0, 3);
      setLastNumbers(updated);

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
      if (data.round_number < currentRoundValue) {
        console.log(
          `[GameInProgress] Ignorando round-started para Round ${data.round_number} (round actual: ${currentRoundValue})`
        );
        return;
      }

      console.log(
        `[GameInProgress] Nueva ronda iniciada: Round ${data.round_number} (round anterior: ${currentRoundValue})`
      );

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

      setRoundTransitionCountdown(null);
      setNextRoundNumber(null);
      setRoundTransitionCountdownFinish(null);
      setRoundStartCountdownFinish(null);

      setCurrentRound(data.round_number);

      setCalledNumbers(new Set());
      setCurrentNumber("");
      setLastNumbers([]);
      setLastCalledTimestamp(null);

      setMarkedNumbers(new Map());

      setRoundFinished(false);
      setRoundEnded(false);
      setIsCallingNumber(false);
      setProgress(0);
      setTimeoutCountdown(null);
      setTimeoutStartTime(null);
      setBingoClaimCountdown(null);
      setBingoClaimCountdownFinish(null);
      setShowConfetti(false);
      setBingoValidationOpen(false);
      setRoomStartCountdown(null);
      setRoomStartCountdownFinish(null);

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

          let userHasBingo = false;
          for (let i = 0; i < playerCards.length; i++) {
            const card = playerCards[i];
            const cardMarked = getMarkedForCard(i);
            if (hasBingo(card, cardMarked, currentBingoType)) {
              userHasBingo = true;
              break;
            }
          }

          if (!userHasBingo) {
            setShowLoserAnimation(true);
            setTimeout(() => {
              setShowLoserAnimation(false);
            }, 3000);
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
        }
      }
    });

    // Escuchar eventos de round finalizado
    const unsubscribeRoundFinished = onRoundFinished((data) => {
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
      }
    });

    // Escuchar eventos de countdown de transición entre rondas
    const unsubscribeRoundTransitionCountdown = onRoundTransitionCountdown(
      (data) => {
        if (!isMounted) return;

        if (data.room_id !== roomIdRef.current) {
          return;
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
        console.log(
          `[GameInProgress] Limpieza entre rondas: Round ${data.previous_round_number} → Round ${data.next_round_number}`
        );

        if (data.previous_round_number === currentRoundRef.current) {
          setCalledNumbers(new Set());
          setCurrentNumber("");
          setLastNumbers([]);
          setProgress(0);
          setIsCallingNumber(false);
          setRoundFinished(false);
          setRoundEnded(false);
          console.log(
            `[GameInProgress] ✅ Números y estados limpiados para transición a Round ${data.next_round_number}`
          );
        }

        if (data.next_round_number > currentRoundRef.current) {
          setCurrentRound(data.next_round_number);
        }
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

    // Escuchar actualizaciones de premio en tiempo real
    const unsubscribeRoomPrizeUpdated = onRoomPrizeUpdated((data) => {
      if (!isMounted) return;

      if (data.room_id === roomId) {
        console.log(
          `[GameInProgress] Premio actualizado: Total pot: ${data.total_pot}, Prize pool: ${data.total_prize}, Usuarios inscritos: ${data.enrolled_users_count || 0}`
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

    // Escuchar eventos de cartones inscritos
    const unsubscribeCardsEnrolled = onCardsEnrolled((data) => {
      if (!isMounted) return;

      if (data.room_id === roomId && data.enrolled_users_count !== undefined) {
        console.log(
          `[GameInProgress] Cartones inscritos: ${data.enrolled_count} cartones por usuario ${data.user_id}, Total usuarios: ${data.enrolled_users_count}`
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

    // Escuchar eventos de countdown de inicio de sala
    const unsubscribeRoomStartCountdown = onRoomStartCountdown((data: any) => {
      if (!isMounted) return;

      if (data.room_id === roomId) {
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
          `[GameInProgress] Sala ${data.room_name} finalizada. Cargando ganadores...`
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
          setWinners(winnersData);

          const winnerCards: BingoGrid[] = [];
          const winnerCardsData: Array<{ _id: string; code: string }> = [];
          const winningNumbers = new Map<number, Set<string>>();

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

          const allCalledNumbers = new Set<string>();
          for (const winner of winnersData) {
            winner.called_numbers.forEach((num: string) =>
              allCalledNumbers.add(num)
            );
          }
          setCalledNumbers(allCalledNumbers);

          setCurrentRound(totalRounds);
        } catch (error) {
          console.error(`[GameInProgress] Error al cargar ganadores:`, error);
        }
      }
    });

    // Cargar números llamados iniciales (solo una vez al montar)
    const loadInitialNumbers = async () => {
      try {
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
      unsubscribeRoundCleanup();
      unsubscribeRoomStatusUpdated();
      unsubscribeRoomFinished();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameStarted,
    roomId,
    currentRound,
  ]);
}
