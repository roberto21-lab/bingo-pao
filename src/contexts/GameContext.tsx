import React, { createContext, useContext, useState, type ReactNode } from "react";

interface GameContextType {
  enrolledUsersCount: number;
  setEnrolledUsersCount: (count: number) => void;
  isGameActive: boolean;
  setIsGameActive: (active: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [enrolledUsersCount, setEnrolledUsersCount] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);

  return (
    <GameContext.Provider
      value={{
        enrolledUsersCount,
        setEnrolledUsersCount,
        isGameActive,
        setIsGameActive,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    return {
      enrolledUsersCount: 0,
      setEnrolledUsersCount: () => {},
      isGameActive: false,
      setIsGameActive: () => {},
    };
  }
  return context;
};


