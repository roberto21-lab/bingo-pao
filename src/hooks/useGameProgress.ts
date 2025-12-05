import { useEffect, useRef, useState } from "react";

const CALL_INTERVAL = 7000;
const TIMEOUT_COUNTDOWN_DURATION = 10000;
const UPDATE_INTERVAL = 50; // Actualizar progress cada 50ms para suavidad

/**
 * Hook para manejar el progress bar y la lógica de números llamados
 */
export function useGameProgress(
  isCallingNumber: boolean,
  roundFinished: boolean,
  roundEnded: boolean,
  lastCalledTimestamp: number | null,
  timeoutCountdown: number | null,
  timeoutStartTime: number | null,
  setTimeoutCountdown: (value: number | null) => void,
  setTimeoutStartTime: (value: number | null) => void
) {
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs para acceder a valores actuales sin depender del closure
  const lastCalledTimestampRef = useRef(lastCalledTimestamp);
  const timeoutCountdownRef = useRef(timeoutCountdown);
  const timeoutStartTimeRef = useRef(timeoutStartTime);
  const isCallingNumberRef = useRef(isCallingNumber);

  // Actualizar refs cuando cambian los valores
  useEffect(() => {
    lastCalledTimestampRef.current = lastCalledTimestamp;
    timeoutCountdownRef.current = timeoutCountdown;
    timeoutStartTimeRef.current = timeoutStartTime;
    isCallingNumberRef.current = isCallingNumber;
  }, [lastCalledTimestamp, timeoutCountdown, timeoutStartTime, isCallingNumber]);

  // useEffect separado para manejar el intervalo del progressbar
  useEffect(() => {
    const updateProgress = () => {
      // Solo actualizar si se están llamando números
      if (!isCallingNumberRef.current) {
        return;
      }

      // Si hay countdown de timeout activo, mostrar progreso del countdown
      if (timeoutCountdownRef.current !== null && timeoutStartTimeRef.current !== null) {
        const now = Date.now();
        const elapsed = now - timeoutStartTimeRef.current;
        const remaining = TIMEOUT_COUNTDOWN_DURATION - elapsed;
        const progressValue = Math.max(
          0,
          Math.min((elapsed / TIMEOUT_COUNTDOWN_DURATION) * 100, 100)
        );
        setProgress(progressValue);

        // Actualizar countdown cada segundo
        const secondsRemaining = Math.ceil(remaining / 1000);
        if (secondsRemaining !== timeoutCountdownRef.current && secondsRemaining >= 0) {
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
      if (!lastCalledTimestampRef.current) {
        setProgress(0);
        return;
      }

      const now = Date.now();
      const timeSinceLastCall = now - lastCalledTimestampRef.current;
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
  }, [isCallingNumber, roundFinished, roundEnded, setTimeoutCountdown, setTimeoutStartTime]);

  return {
    progress,
    setProgress,
    progressIntervalRef,
  };
}
