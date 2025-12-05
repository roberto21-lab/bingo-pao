import { useEffect } from "react";

/**
 * Hook para manejar el estado isGameStarting basado en countdowns activos
 * Esto previene el parpadeo asegurando que isGameStarting solo cambie cuando realmente no hay countdown activo
 */
export function useGameStarting(
  room: Record<string, unknown> | null,
  roomStartCountdown: number | null,
  roundTransitionCountdown: number | null,
  isCallingNumber: boolean,
  currentNumber: string,
  roundFinished: boolean,
  roomFinished: boolean,
  setIsGameStarting: (value: boolean) => void
) {
  useEffect(() => {
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
    room?.status,
    roomStartCountdown,
    roundTransitionCountdown,
    isCallingNumber,
    currentNumber,
    roundFinished,
    roomFinished,
    setIsGameStarting,
  ]);
}
