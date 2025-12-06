/**
 * Hook para resetear el estado de la UI al cambiar de ronda
 * 
 * ISSUE: Cuando comienza una nueva ronda, la UI debe resetearse completamente.
 * Este hook centraliza toda la lógica de reset para asegurar consistencia.
 * 
 * Responsabilidades:
 * 1. Cerrar todos los modales de bingo
 * 2. Limpiar lista de números llamados y últimos números
 * 3. Resetear cartones visualmente (desmarcar números)
 * 4. Limpiar todos los countdowns
 * 5. Resetear estados de animación (confetti, etc.)
 */

import { useCallback, useRef } from "react";
import type { WinnerData } from "../Components/BingoValidationModal";

export interface RoundResetOptions {
  // Estados de números
  setCalledNumbers: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCurrentNumber: (value: string) => void;
  setLastNumbers: (value: string[]) => void;
  setLastCalledTimestamp: (value: number | null) => void;
  setMarkedNumbers: React.Dispatch<React.SetStateAction<Map<number, Set<string>>>>;
  
  // Estados de round
  setCurrentRound: (round: number) => void;
  setRoundFinished: (value: boolean) => void;
  setRoundEnded: (value: boolean) => void;
  setIsCallingNumber: (value: boolean) => void;
  setIsGameStarting: (value: boolean) => void;
  setProgress: (value: number) => void;
  
  // Estados de countdowns
  setRoundTransitionCountdown: (value: number | null) => void;
  setRoundTransitionCountdownFinish: (value: number | null) => void;
  setRoundStartCountdownFinish: (value: number | null) => void;
  setNextRoundNumber: (value: number | null) => void;
  setBingoClaimCountdown: (value: number | null) => void;
  setBingoClaimCountdownFinish: (value: number | null) => void;
  setTimeoutCountdown: (value: number | null) => void;
  setTimeoutStartTime: (value: number | null) => void;
  setRoomStartCountdown: (value: number | null) => void;
  setRoomStartCountdownFinish: (value: number | null) => void;
  
  // Estados de modales y animaciones
  setBingoValidationOpen: (value: boolean) => void;
  setCurrentRoundWinners: React.Dispatch<React.SetStateAction<WinnerData[]>>;
  setCurrentWinnerIndex: (value: number) => void;
  setShowConfetti: (value: boolean) => void;
  setShowLoserAnimation: (value: boolean) => void;
  setModalOpen: (value: boolean) => void;
  setPreviewCardIndex: (value: number | null) => void;
}

export interface RoundResetResult {
  /**
   * Ejecuta un reset completo de la UI para una nueva ronda
   * @param newRoundNumber - El número de la nueva ronda
   * @param options - Configuración opcional del reset
   */
  executeFullReset: (
    newRoundNumber: number,
    options?: {
      preserveCountdowns?: boolean;
      source?: string;
    }
  ) => void;
  
  /**
   * Resetea solo los números y estado de juego
   */
  resetNumbersAndGameState: () => void;
  
  /**
   * Resetea solo los modales y animaciones
   */
  resetModalsAndAnimations: () => void;
  
  /**
   * Resetea solo los countdowns
   */
  resetAllCountdowns: () => void;
  
  /**
   * Ref para verificar si un reset está en progreso
   */
  isResetting: React.MutableRefObject<boolean>;
  
  /**
   * Ref del último round para el que se ejecutó un reset
   */
  lastResetRound: React.MutableRefObject<number>;
}

/**
 * Hook que proporciona funciones para resetear el estado de la UI al cambiar de ronda.
 * 
 * @example
 * ```tsx
 * const { executeFullReset, resetModalsAndAnimations } = useRoundReset({
 *   setCalledNumbers,
 *   setCurrentNumber,
 *   // ... otros setters
 * });
 * 
 * // Al recibir evento round-started:
 * onRoundStarted((data) => {
 *   executeFullReset(data.round_number, { source: 'round-started' });
 * });
 * ```
 */
export function useRoundReset(options: RoundResetOptions): RoundResetResult {
  const {
    // Estados de números
    setCalledNumbers,
    setCurrentNumber,
    setLastNumbers,
    setLastCalledTimestamp,
    setMarkedNumbers,
    
    // Estados de round
    setCurrentRound,
    setRoundFinished,
    setRoundEnded,
    setIsCallingNumber,
    setIsGameStarting,
    setProgress,
    
    // Estados de countdowns
    setRoundTransitionCountdown,
    setRoundTransitionCountdownFinish,
    setRoundStartCountdownFinish,
    setNextRoundNumber,
    setBingoClaimCountdown,
    setBingoClaimCountdownFinish,
    setTimeoutCountdown,
    setTimeoutStartTime,
    setRoomStartCountdown,
    setRoomStartCountdownFinish,
    
    // Estados de modales y animaciones
    setBingoValidationOpen,
    setCurrentRoundWinners,
    setCurrentWinnerIndex,
    setShowConfetti,
    setShowLoserAnimation,
    setModalOpen,
    setPreviewCardIndex,
  } = options;

  // Refs para control de estado
  const isResetting = useRef(false);
  const lastResetRound = useRef(0);

  /**
   * Resetea números y estado de juego
   */
  const resetNumbersAndGameState = useCallback(() => {
    console.log("[useRoundReset] 🔢 Reseteando números y estado de juego...");
    
    // Limpiar números
    setCalledNumbers(new Set());
    setCurrentNumber("");
    setLastNumbers([]);
    setLastCalledTimestamp(null);
    
    // Limpiar marcas de cartones
    setMarkedNumbers(new Map());
    
    // Resetear progress bar
    setProgress(0);
    
    console.log("[useRoundReset] ✅ Números y estado de juego reseteados");
  }, [
    setCalledNumbers,
    setCurrentNumber,
    setLastNumbers,
    setLastCalledTimestamp,
    setMarkedNumbers,
    setProgress,
  ]);

  /**
   * Resetea modales y animaciones
   */
  const resetModalsAndAnimations = useCallback(() => {
    console.log("[useRoundReset] 🎭 Reseteando modales y animaciones...");
    
    // Cerrar modal de validación de bingo
    setBingoValidationOpen(false);
    setCurrentRoundWinners([]);
    setCurrentWinnerIndex(0);
    
    // Cerrar modal de preview de cartón
    setModalOpen(false);
    setPreviewCardIndex(null);
    
    // Detener animaciones
    setShowConfetti(false);
    setShowLoserAnimation(false);
    
    console.log("[useRoundReset] ✅ Modales y animaciones reseteados");
  }, [
    setBingoValidationOpen,
    setCurrentRoundWinners,
    setCurrentWinnerIndex,
    setModalOpen,
    setPreviewCardIndex,
    setShowConfetti,
    setShowLoserAnimation,
  ]);

  /**
   * Resetea todos los countdowns
   */
  const resetAllCountdowns = useCallback(() => {
    console.log("[useRoundReset] ⏱️ Reseteando todos los countdowns...");
    
    // Countdown de transición entre rondas
    setRoundTransitionCountdown(null);
    setRoundTransitionCountdownFinish(null);
    setRoundStartCountdownFinish(null);
    setNextRoundNumber(null);
    
    // Countdown de ventana de bingo
    setBingoClaimCountdown(null);
    setBingoClaimCountdownFinish(null);
    
    // Countdown de timeout
    setTimeoutCountdown(null);
    setTimeoutStartTime(null);
    
    // Countdown de inicio de sala
    setRoomStartCountdown(null);
    setRoomStartCountdownFinish(null);
    
    console.log("[useRoundReset] ✅ Todos los countdowns reseteados");
  }, [
    setRoundTransitionCountdown,
    setRoundTransitionCountdownFinish,
    setRoundStartCountdownFinish,
    setNextRoundNumber,
    setBingoClaimCountdown,
    setBingoClaimCountdownFinish,
    setTimeoutCountdown,
    setTimeoutStartTime,
    setRoomStartCountdown,
    setRoomStartCountdownFinish,
  ]);

  /**
   * Ejecuta un reset completo de la UI
   */
  const executeFullReset = useCallback((
    newRoundNumber: number,
    resetOptions?: {
      preserveCountdowns?: boolean;
      source?: string;
    }
  ) => {
    const { preserveCountdowns = false, source = "unknown" } = resetOptions || {};
    
    // Evitar resets duplicados para la misma ronda
    if (lastResetRound.current === newRoundNumber) {
      console.log(
        `[useRoundReset] ⏭️ Ignorando reset duplicado para Round ${newRoundNumber} (source: ${source})`
      );
      return;
    }
    
    // Evitar resets concurrentes
    if (isResetting.current) {
      console.log(
        `[useRoundReset] ⏭️ Reset en progreso, encolando para Round ${newRoundNumber} (source: ${source})`
      );
      // Programar el reset para después
      setTimeout(() => {
        executeFullReset(newRoundNumber, resetOptions);
      }, 100);
      return;
    }
    
    isResetting.current = true;
    lastResetRound.current = newRoundNumber;
    
    console.log(
      `[useRoundReset] 🚀 EJECUTANDO RESET COMPLETO para Round ${newRoundNumber} (source: ${source})`
    );
    
    try {
      // ========================================
      // RESET COMPLETO DE UI - NUEVA RONDA
      // ========================================
      
      // 1. RESET de números y estado de juego (INMEDIATO)
      resetNumbersAndGameState();
      
      // 2. RESET de estados de round
      setRoundFinished(false);
      setRoundEnded(false);
      setIsCallingNumber(false);
      setIsGameStarting(false);
      setCurrentRound(newRoundNumber);
      
      // 3. RESET de todos los countdowns (opcional)
      if (!preserveCountdowns) {
        resetAllCountdowns();
      }
      
      // 4. RESET de modales y animaciones (CRÍTICO para el issue)
      resetModalsAndAnimations();
      
      console.log(
        `[useRoundReset] ✅ RESET COMPLETO EXITOSO para Round ${newRoundNumber}`
      );
    } catch (error) {
      console.error(
        `[useRoundReset] ❌ Error durante reset para Round ${newRoundNumber}:`,
        error
      );
    } finally {
      isResetting.current = false;
    }
  }, [
    setCurrentRound,
    setRoundFinished,
    setRoundEnded,
    setIsCallingNumber,
    setIsGameStarting,
    resetNumbersAndGameState,
    resetAllCountdowns,
    resetModalsAndAnimations,
  ]);

  return {
    executeFullReset,
    resetNumbersAndGameState,
    resetModalsAndAnimations,
    resetAllCountdowns,
    isResetting,
    lastResetRound,
  };
}

export default useRoundReset;
