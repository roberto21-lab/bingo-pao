import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/**
 * P6-FIX: GameContext mejorado y centralizado
 * Este contexto ahora maneja más estado del juego de forma centralizada
 */

// P6-FIX: Tipos para premios centralizados
export interface RoundPrize {
  round_number: number;
  percent: number;
  amount: number;
}

export interface PrizeState {
  totalPot: number;
  adminFee: number;
  prizePool: number;
  totalPrize: number;
  roundPrizes: RoundPrize[];
  lastUpdated: number | null;
}

// P6-FIX: Tipos para estado de sincronización
export interface SyncState {
  lastWebSocketTimestamp: number | null;
  lastPollingTimestamp: number | null;
  isDesynchronized: boolean;
  serverNumberCount: number | null;
}

interface GameContextType {
  // Estado original
  enrolledUsersCount: number;
  setEnrolledUsersCount: (count: number) => void;
  isGameActive: boolean;
  setIsGameActive: (active: boolean) => void;
  
  // P6-FIX: Estado de premios centralizado (P2-FIX)
  prizeState: PrizeState;
  setPrizeState: (state: PrizeState) => void;
  updatePrizeFromServer: (data: Partial<PrizeState>) => void;
  
  // P6-FIX: Estado de sincronización (P8-FIX)
  syncState: SyncState;
  updateSyncTimestamp: (type: 'websocket' | 'polling') => void;
  checkDesynchronization: (serverCount: number, localCount: number) => boolean;
  
  // P6-FIX: Timestamp del servidor para sincronización de tiempo
  serverTimeOffset: number;
  setServerTimeOffset: (offset: number) => void;
  getAdjustedTime: () => number;
}

const defaultPrizeState: PrizeState = {
  totalPot: 0,
  adminFee: 0,
  prizePool: 0,
  totalPrize: 0,
  roundPrizes: [],
  lastUpdated: null,
};

const defaultSyncState: SyncState = {
  lastWebSocketTimestamp: null,
  lastPollingTimestamp: null,
  isDesynchronized: false,
  serverNumberCount: null,
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [enrolledUsersCount, setEnrolledUsersCount] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  
  // P6-FIX: Estado de premios centralizado
  const [prizeState, setPrizeState] = useState<PrizeState>(defaultPrizeState);
  
  // P6-FIX: Estado de sincronización
  const [syncState, setSyncState] = useState<SyncState>(defaultSyncState);
  
  // P6-FIX: Offset de tiempo del servidor
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  
  // P6-FIX: Función para actualizar premios desde el servidor
  const updatePrizeFromServer = useCallback((data: Partial<PrizeState>) => {
    setPrizeState(prev => ({
      ...prev,
      ...data,
      lastUpdated: Date.now(),
    }));
  }, []);
  
  // P6-FIX: Función para actualizar timestamp de sincronización
  const updateSyncTimestamp = useCallback((type: 'websocket' | 'polling') => {
    const now = Date.now();
    setSyncState(prev => ({
      ...prev,
      [type === 'websocket' ? 'lastWebSocketTimestamp' : 'lastPollingTimestamp']: now,
    }));
  }, []);
  
  // P8-FIX: Función para detectar desincronización
  const checkDesynchronization = useCallback((serverCount: number, localCount: number): boolean => {
    const isDesync = Math.abs(serverCount - localCount) > 2; // Tolerancia de 2 números
    
    setSyncState(prev => ({
      ...prev,
      serverNumberCount: serverCount,
      isDesynchronized: isDesync,
    }));
    
    if (isDesync) {
      console.warn(`P8-FIX: Desincronización detectada - servidor: ${serverCount}, local: ${localCount}`);
    }
    
    return isDesync;
  }, []);
  
  // P6-FIX: Función para obtener tiempo ajustado con offset del servidor
  const getAdjustedTime = useCallback(() => {
    return Date.now() + serverTimeOffset;
  }, [serverTimeOffset]);

  return (
    <GameContext.Provider
      value={{
        enrolledUsersCount,
        setEnrolledUsersCount,
        isGameActive,
        setIsGameActive,
        prizeState,
        setPrizeState,
        updatePrizeFromServer,
        syncState,
        updateSyncTimestamp,
        checkDesynchronization,
        serverTimeOffset,
        setServerTimeOffset,
        getAdjustedTime,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    // P6-FIX: Valores por defecto más completos
    return {
      enrolledUsersCount: 0,
      setEnrolledUsersCount: () => {},
      isGameActive: false,
      setIsGameActive: () => {},
      prizeState: defaultPrizeState,
      setPrizeState: () => {},
      updatePrizeFromServer: () => {},
      syncState: defaultSyncState,
      updateSyncTimestamp: () => {},
      checkDesynchronization: () => false,
      serverTimeOffset: 0,
      setServerTimeOffset: () => {},
      getAdjustedTime: () => Date.now(),
    };
  }
  return context;
};


