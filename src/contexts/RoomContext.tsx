import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { RoomStatus } from "../types/roomDetail.types";

interface RoomContextType {
  roomStatus: RoomStatus | null;
  roomTitle: string | null;
  setRoomStatus: (status: RoomStatus | null) => void;
  setRoomTitle: (title: string | null) => void;
  clearRoomState: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
  const [roomTitle, setRoomTitle] = useState<string | null>(null);

  const clearRoomState = useCallback(() => {
    setRoomStatus(null);
    setRoomTitle(null);
  }, []);

  return (
    <RoomContext.Provider
      value={{
        roomStatus,
        roomTitle,
        setRoomStatus,
        setRoomTitle,
        clearRoomState,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (!context) {
    return {
      roomStatus: null,
      roomTitle: null,
      setRoomStatus: () => {},
      setRoomTitle: () => {},
      clearRoomState: () => {},
    };
  }
  return context;
};
