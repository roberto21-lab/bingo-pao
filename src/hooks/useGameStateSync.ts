import { useEffect, useRef } from "react";
import * as React from "react";
import { getCalledNumbers } from "../Services/calledNumbers.service";
import { getRoomRounds } from "../Services/rounds.service";
import { api } from "../Services/api";

/**
 * Hook para sincronizar el estado del juego periódicamente desde la BD
 * Esto asegura que todos los usuarios vean exactamente lo mismo en tiempo real
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
  roundFinished: boolean
) {
  const currentRoundRef = useRef(currentRound);
  const roomIdRef = useRef(roomId);

  // Actualizar refs cuando cambian los valores
  useEffect(() => {
    currentRoundRef.current = currentRound;
    roomIdRef.current = roomId;
  }, [currentRound, roomId]);

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

            // Si es un nuevo round, limpiar números
            if (newCurrentRoundData.round_number > currentRoundRef.current) {
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
                  currentRoomId,
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
          }
        }
      } catch (error) {
        console.error("Error al verificar round actual:", error);
      }
    };

    // Verificar round actual cada 15 segundos (reducido de 5s)
    // Los sockets deberían manejar la mayoría de las actualizaciones
    // Este polling es solo un fallback en caso de que los sockets fallen
    const roundCheckInterval = setInterval(checkCurrentRound, 15000);

    return () => clearInterval(roundCheckInterval);
  }, [gameStarted, roomId, bingoClaimCountdown, setCurrentRound, setCalledNumbers, setCurrentNumber, setLastNumbers, setLastCalledTimestamp, setMarkedNumbers, setRoundFinished, setRoundEnded, setIsCallingNumber, setProgress, roundFinished]);

  // CRÍTICO: Sincronizar TODO el estado del juego periódicamente desde la BD
  // Esto asegura que todos los usuarios vean exactamente lo mismo en tiempo real
  // OPTIMIZADO: Reducir frecuencia a 10 segundos y hacer más eficiente
  useEffect(() => {
    if (!gameStarted || !roomId) return;

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
          api.get(`/rooms/${currentRoomId}`),
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
          
          const numbersSet = new Set(data.map((cn) => cn.number));
          setCalledNumbers(numbersSet);
          
          setIsCallingNumber(true);
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
        console.error("[GameInProgress] Error al sincronizar estado del juego:", error);
      }
    };

    // Sincronizar cada 10 segundos (reducido de 2s)
    // Los sockets deberían manejar la mayoría de las actualizaciones en tiempo real
    // Este polling es solo un fallback en caso de que los sockets fallen
    const syncInterval = setInterval(syncGameState, 10000);

    return () => clearInterval(syncInterval);
  }, [gameStarted, roomId, setCalledNumbers, setCurrentNumber, setLastNumbers, setLastCalledTimestamp, setIsCallingNumber, setRoundEnded, setRoundFinished, setProgress, setRoom]);
}
