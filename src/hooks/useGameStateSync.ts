import { useEffect, useRef } from "react";
import * as React from "react";
import { getCalledNumbers } from "../Services/calledNumbers.service";
import { getRoomRounds } from "../Services/rounds.service";
import { api } from "../Services/api";
import { useGameContext } from "../contexts/GameContext";

// P9-FIX: Constantes de configuración de polling optimizadas
// FIX-CRITICAL: Reducir intervalos para detectar inconsistencias más rápido
const ROUND_CHECK_INTERVAL = 30000; // 30 segundos - verificar estado de ronda
const GAME_STATE_SYNC_INTERVAL = 15000; // 15 segundos - sync más frecuente para detectar números perdidos
const FRESH_DATA_THRESHOLD = 10000; // 10 segundos - threshold reducido para mayor frescura
// const DESYNC_CHECK_INTERVAL = 30000; // 30 segundos - verificar desincronización (reservado para futuro uso)

/**
 * Hook para sincronizar el estado del juego periódicamente desde la BD
 * P9-FIX: Optimizado para reducir polling cuando WebSocket funciona correctamente
 * Este polling es ahora solo un fallback en caso de que los sockets fallen
 */
export function useGameStateSync(
  gameStarted: boolean,
  roomId: string | undefined,
  currentRound: number,
  bingoClaimCountdown: number | null,
  setCurrentRound: (round: number) => void,
  setCalledNumbers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setCurrentNumber: (value: string) => void,
  setLastNumbers: (value: string[]) => void,
  setLastCalledTimestamp: (value: number | null) => void,
  setMarkedNumbers: React.Dispatch<React.SetStateAction<Map<number, Set<string>>>>,
  setRoundFinished: (value: boolean) => void,
  setRoundEnded: (value: boolean) => void,
  setIsCallingNumber: (value: boolean) => void,
  setProgress: (value: number) => void,
  setRoom: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>,
  roundFinished: boolean,
  // P9-FIX: Parámetro para saber cuándo se recibió el último dato del WebSocket
  lastWebSocketDataTimestamp?: number,
  // P8-FIX: Callback para notificar desincronización
  onDesyncDetected?: (serverCount: number, localCount: number) => void
) {
  const currentRoundRef = useRef(currentRound);
  const roomIdRef = useRef(roomId);
  // P9-FIX: Ref para trackear cuándo se sincronizó por última vez
  const lastSyncRef = useRef<number>(0);
  // P9-FIX: Ref para evitar polling concurrente
  const isPollingRef = useRef<boolean>(false);
  // P8-FIX: Ref para trackear número de números llamados localmente
  const localNumberCountRef = useRef<number>(0);
  
  // P6-FIX: Usar GameContext para actualizar sync state
  const { updateSyncTimestamp, checkDesynchronization } = useGameContext();

  // Actualizar refs cuando cambian los valores
  useEffect(() => {
    currentRoundRef.current = currentRound;
    roomIdRef.current = roomId;
  }, [currentRound, roomId]);
  
  // P9-FIX: Actualizar lastSyncRef cuando llegan datos del WebSocket
  useEffect(() => {
    if (lastWebSocketDataTimestamp) {
      lastSyncRef.current = lastWebSocketDataTimestamp;
      updateSyncTimestamp('websocket');
    }
  }, [lastWebSocketDataTimestamp, updateSyncTimestamp]);

  // Verificar periódicamente el round actual (cada 15 segundos)
  useEffect(() => {
    if (!gameStarted || !roomId) return;

    const checkCurrentRound = async () => {
      const currentRoomId = roomIdRef.current;
      if (!currentRoomId) return;

      // IMPORTANTE: No verificar el round si hay un bingo reclamado (countdown activo)
      // Esto evita que el round retroceda cuando se reclama bingo
      if (bingoClaimCountdown !== null) {
        return;
      }

      try {
        const roundsData = await getRoomRounds(currentRoomId);

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
          newCurrentRoundData.round_number !== currentRoundRef.current
        ) {
          // Solo actualizar si el nuevo round es mayor (avanzar) o si el round actual no existe en los datos
          const currentRoundExists = roundsData.some(
            (r) => r.round_number === currentRoundRef.current
          );

          // CRÍTICO: También actualizar si el round del backend es igual al actual pero el estado es diferente
          // Esto maneja el caso donde el round está en transición pero el frontend aún muestra "FINALIZADA"
          const backendRoundStatus = typeof newCurrentRoundData.status_id === "object" && newCurrentRoundData.status_id
            ? newCurrentRoundData.status_id.name
            : "";
          
          // CRÍTICO: Si el round encontrado está en "pending" y es mayor al actual, actualizar
          // Esto permite que el frontend se actualice cuando el siguiente round está listo para iniciar
          const isPendingAndNext = backendRoundStatus === "pending" && newCurrentRoundData.round_number > currentRoundRef.current;
          
          const shouldUpdate = 
            newCurrentRoundData.round_number > currentRoundRef.current ||
            !currentRoundExists ||
            isPendingAndNext ||
            (newCurrentRoundData.round_number === currentRoundRef.current && 
             (backendRoundStatus === "in_progress" || backendRoundStatus === "starting") && 
             roundFinished);

          if (shouldUpdate) {
            setCurrentRound(newCurrentRoundData.round_number);

            // FIX-CRITICAL: Si es un nuevo round, cargar números PRIMERO antes de limpiar
            // Esto evita el parpadeo de "0 números" -> "X números"
            if (newCurrentRoundData.round_number > currentRoundRef.current) {
              // Cargar números de la nueva ronda ANTES de limpiar
              try {
                const calledNumbersData = await getCalledNumbers(
                  currentRoomId,
                  newCurrentRoundData.round_number
                );
                
                // FIX-CRITICAL: Solo limpiar si la nueva ronda tiene datos diferentes
                // Esto previene borrar números que ya tenemos si la API retorna los mismos
                const localNumbersCount = localNumberCountRef.current;
                const serverNumbersCount = calledNumbersData.length;
                
                // Solo actualizar si el servidor tiene MÁS números o estamos sin datos
                if (serverNumbersCount > 0 || localNumbersCount === 0) {
                  setCalledNumbers(new Set(calledNumbersData.map((cn) => cn.number)));
                  setMarkedNumbers(new Map());
                  setRoundFinished(false);
                  setRoundEnded(false);
                  setIsCallingNumber(true);
                  setProgress(0);
                  localNumberCountRef.current = serverNumbersCount;

                  if (calledNumbersData.length > 0) {
                    const lastCalled = calledNumbersData[calledNumbersData.length - 1];
                    setCurrentNumber(lastCalled.number);
                    setLastCalledTimestamp(new Date(lastCalled.called_at).getTime());

                    const lastThree = calledNumbersData.slice(-3).reverse().map((cn) => cn.number);
                    setLastNumbers(lastThree);
                  } else {
                    setCurrentNumber("");
                    setLastNumbers([]);
                    setLastCalledTimestamp(null);
                  }
                  
                  console.log(`[useGameStateSync] ✅ FIX-CRITICAL: Round ${newCurrentRoundData.round_number} cargado (${serverNumbersCount} números)`);
                } else {
                  console.log(`[useGameStateSync] ⚠️ FIX-CRITICAL: Ignorando actualización - manteniendo ${localNumbersCount} números locales`);
                }
              } catch (error) {
                console.error(
                  "Error al cargar números del round actualizado:",
                  error
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("Error al verificar round actual:", error);
      }
    };

    // FASE 5: Verificar round actual cada 30 segundos (aumentado de 15s)
    // Los sockets deberían manejar la mayoría de las actualizaciones
    // Este polling es solo un fallback en caso de que los sockets fallen
    const roundCheckInterval = setInterval(checkCurrentRound, ROUND_CHECK_INTERVAL);

    return () => clearInterval(roundCheckInterval);
  }, [gameStarted, roomId, bingoClaimCountdown, setCurrentRound, setCalledNumbers, setCurrentNumber, setLastNumbers, setLastCalledTimestamp, setMarkedNumbers, setRoundFinished, setRoundEnded, setIsCallingNumber, setProgress, roundFinished]);

  // P9-FIX: Sincronizar TODO el estado del juego periódicamente desde la BD
  // Este polling es ahora solo un fallback en caso de que los sockets fallen
  useEffect(() => {
    if (!gameStarted || !roomId) return;

    const syncGameState = async () => {
      // P9-FIX: Evitar polling concurrente
      if (isPollingRef.current) {
        return;
      }
      
      try {
        isPollingRef.current = true;
        
        const currentRoomId = roomIdRef.current;
        const currentRoundValue = currentRoundRef.current;
        
        if (!currentRoomId || !currentRoundValue) {
          return;
        }
        
        // P9-FIX: Evitar polling si hay datos recientes del WebSocket
        const timeSinceLastSync = Date.now() - lastSyncRef.current;
        if (timeSinceLastSync < FRESH_DATA_THRESHOLD) {
          return;
        }
        
        // P9-FIX: Ejecutar todas las sincronizaciones en paralelo
        const [calledNumbersData, roundsData, roomResponse] = await Promise.allSettled([
          getCalledNumbers(currentRoomId, currentRoundValue),
          getRoomRounds(currentRoomId),
          api.get(`/rooms/${currentRoomId}`),
        ]);
        
        // P9-FIX: Actualizar timestamp de polling
        updateSyncTimestamp('polling');
        
        // 1. Sincronizar números llamados
        if (calledNumbersData.status === "fulfilled" && calledNumbersData.value.length > 0) {
          const data = calledNumbersData.value;
          
          // P8-FIX: Verificar desincronización
          const serverCount = data.length;
          const localCount = localNumberCountRef.current;
          
          // FIX-SYNC: Solo actualizar si el servidor tiene MÁS números que localmente
          // Esto previene que datos incompletos (de ronda equivocada) sobrescriban datos correctos
          if (serverCount < localCount) {
            console.log(
              `[useGameStateSync] ⚠️ FIX-SYNC: Ignorando sync con menos números (local: ${localCount}, servidor: ${serverCount})`
            );
            return; // No sobrescribir
          }
          
          if (serverCount !== localCount && Math.abs(serverCount - localCount) > 2) {
            // Desincronización detectada
            checkDesynchronization(serverCount, localCount);
            
            if (onDesyncDetected) {
              onDesyncDetected(serverCount, localCount);
            }
            
            console.warn(`P8-FIX: Desincronización detectada, resincronizando... (servidor: ${serverCount}, local: ${localCount})`);
          }
          
          localNumberCountRef.current = data.length;
          
          const lastThree = data.slice(-3).reverse().map((cn) => cn.number);
          setLastNumbers(lastThree);
          
          const lastCalled = data[data.length - 1];
          setCurrentNumber(lastCalled.number);
          
          const calledTimestamp = new Date(lastCalled.called_at).getTime();
          setLastCalledTimestamp(calledTimestamp);
          
          const numbersSet = new Set(data.map((cn) => cn.number));
          setCalledNumbers(numbersSet);
          
          setIsCallingNumber(true);
          setRoundEnded(false);
          setRoundFinished(false);
          setProgress(0);
          
          console.log(
            `[useGameStateSync] ✅ FIX-SYNC: Números sincronizados (${serverCount} números)`
          );
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
            } else if (roundStatus === "starting") {
              setIsCallingNumber(false);
            } else if (roundStatus === "finished" || roundStatus === "bingo_claimed") {
              setIsCallingNumber(false);
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
        console.error("[GameInProgress] P9-FIX: Error al sincronizar estado del juego:", error);
      } finally {
        isPollingRef.current = false;
      }
    };

    // P9-FIX: Sincronizar cada 60 segundos (aumentado de 30s)
    // Los sockets deberían manejar la mayoría de las actualizaciones en tiempo real
    const syncInterval = setInterval(syncGameState, GAME_STATE_SYNC_INTERVAL);

    return () => clearInterval(syncInterval);
  }, [gameStarted, roomId, setCalledNumbers, setCurrentNumber, setLastNumbers, setLastCalledTimestamp, setIsCallingNumber, setRoundEnded, setRoundFinished, setProgress, setRoom, lastWebSocketDataTimestamp, updateSyncTimestamp, checkDesynchronization, onDesyncDetected]);
}
