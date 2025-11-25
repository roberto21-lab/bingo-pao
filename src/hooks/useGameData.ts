import { useState, useEffect } from "react";
import { api } from "../Services/api";
import { getCardsByRoomAndUser } from "../Services/cards.service";
import { getRoomRounds } from "../Services/rounds.service";
import { getCalledNumbers } from "../Services/calledNumbers.service";
import { getRoomWinners, type RoomWinner } from "../Services/bingo.service";
import type { BingoGrid } from "../utils/bingo";
import type { BingoType } from "../utils/bingoUtils";
import { mapPatternToBingoType } from "../utils/patternMapper";

function convertCardNumbers(numbers: (number | "FREE")[][]): number[][] {
  return numbers.map((row) => row.map((num) => (num === "FREE" ? 0 : num)));
}

function parseDecimal(decimal: unknown): number {
  if (!decimal) return 0;
  if (typeof decimal === "string") return parseFloat(decimal) || 0;
  if (typeof decimal === "object" && decimal !== null && "$numberDecimal" in decimal) {
    return parseFloat(String((decimal as { $numberDecimal: string }).$numberDecimal)) || 0;
  }
  return typeof decimal === "number" ? decimal : 0;
}

export interface UseGameDataReturn {
  loading: boolean;
  error: string | null;
  room: Record<string, unknown> | null;
  playerCards: BingoGrid[];
  playerCardsData: Array<{ _id: string; code: string }>;
  currentRound: number;
  totalRounds: number;
  totalPot: number;
  roundBingoTypes: BingoType[];
  roundsData: any[];
  calledNumbers: Set<string>;
  currentNumber: string;
  lastNumbers: string[];
  lastCalledTimestamp: number | null;
  gameStarted: boolean;
  isCallingNumber: boolean;
  roundEnded: boolean;
  roundFinished: boolean;
  roomFinished: boolean;
  winners: RoomWinner[];
  winningNumbersMap: Map<number, Set<string>>;
  roomScheduledAt: Date | null;
  serverTimeOffset: number;
  timeUntilStart: number | null;
  setCurrentRound: (round: number) => void;
  setCalledNumbers: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCurrentNumber: (num: string) => void;
  setLastNumbers: React.Dispatch<React.SetStateAction<string[]>>;
  setLastCalledTimestamp: (timestamp: number | null) => void;
  setGameStarted: (started: boolean) => void;
  setIsCallingNumber: (calling: boolean) => void;
  setRoundEnded: (ended: boolean) => void;
  setRoundFinished: (finished: boolean) => void;
  setRoundsData: React.Dispatch<React.SetStateAction<any[]>>;
  setRoundBingoTypes: React.Dispatch<React.SetStateAction<BingoType[]>>;
  setRoom: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>;
  setRoomFinished: (finished: boolean) => void;
  setWinners: React.Dispatch<React.SetStateAction<RoomWinner[]>>;
  setPlayerCards: React.Dispatch<React.SetStateAction<BingoGrid[]>>;
  setPlayerCardsData: React.Dispatch<React.SetStateAction<Array<{ _id: string; code: string }>>>;
  setWinningNumbersMap: React.Dispatch<React.SetStateAction<Map<number, Set<string>>>>;
  setTimeUntilStart: (time: number | null) => void;
}

export function useGameData(roomId: string | undefined): UseGameDataReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Record<string, unknown> | null>(null);
  const [playerCards, setPlayerCards] = useState<BingoGrid[]>([]);
  const [playerCardsData, setPlayerCardsData] = useState<Array<{ _id: string; code: string }>>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [totalPot, setTotalPot] = useState(0);
  const [roundBingoTypes, setRoundBingoTypes] = useState<BingoType[]>([]);
  const [roundsData, setRoundsData] = useState<any[]>([]);
  const [calledNumbers, setCalledNumbers] = useState<Set<string>>(new Set());
  const [currentNumber, setCurrentNumber] = useState<string>("");
  const [lastNumbers, setLastNumbers] = useState<string[]>([]);
  const [lastCalledTimestamp, setLastCalledTimestamp] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isCallingNumber, setIsCallingNumber] = useState(false);
  const [roundEnded, setRoundEnded] = useState(false);
  const [roundFinished, setRoundFinished] = useState(false);
  const [roomFinished, setRoomFinished] = useState(false);
  const [winners, setWinners] = useState<RoomWinner[]>([]);
  const [winningNumbersMap, setWinningNumbersMap] = useState<Map<number, Set<string>>>(new Map());
  const [roomScheduledAt, setRoomScheduledAt] = useState<Date | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!roomId) {
        setError("ID de sala no proporcionado");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const roomResponse = await api.get(`/rooms/${roomId}`);
        
        if (!roomResponse.data) {
          setError("Sala no encontrada");
          setLoading(false);
          return;
        }
        
        const roomData = roomResponse.data;
        if (!roomData) {
          setError("Sala no encontrada");
          setLoading(false);
          return;
        }
        
        setRoom(roomData);
        setTotalPot(parseDecimal(roomData.total_pot));
        setTotalRounds(roomData.max_rounds || 3);
        
        // Verificar si la sala está finalizada
        const roomStatus = roomData && typeof roomData.status_id === "object" && roomData.status_id
          ? roomData.status_id.name
          : "";
        
        // DEBUG: Log detallado del status
        console.log(`[useGameData] 🔍 Verificando status de sala ${roomData.name || roomId}:`);
        console.log(`[useGameData]    - status_id tipo:`, typeof roomData.status_id);
        console.log(`[useGameData]    - status_id valor:`, JSON.stringify(roomData.status_id, null, 2));
        console.log(`[useGameData]    - roomStatus extraído:`, roomStatus);
        
        const isRoomFinished = roomStatus === "finished";
        console.log(`[useGameData]    - isRoomFinished:`, isRoomFinished);
        
        if (isRoomFinished) {
          console.log(`[useGameData] ⚠️ Sala marcada como finalizada, pero verificando si realmente está finalizada...`);
        } else {
          console.log(`[useGameData] ✅ Sala NO está finalizada (status: ${roomStatus || "unknown"})`);
        }
        
        setRoomFinished(isRoomFinished);
        
        // Si la sala está finalizada, cargar ganadores
        if (isRoomFinished) {
          try {
            const winnersData = await getRoomWinners(roomId);
            setWinners(winnersData);
            
            const winnerCards: BingoGrid[] = [];
            const winnerCardsData: Array<{ _id: string; code: string }> = [];
            const winningNumbers = new Map<number, Set<string>>();
            
            const sortedWinners = [...winnersData].sort((a, b) => a.round_number - b.round_number);
            
            sortedWinners.forEach((winner, index) => {
              winnerCards.push(convertCardNumbers(winner.card_numbers));
              winnerCardsData.push({ _id: winner.card_id, code: winner.card_code });
              winningNumbers.set(index, new Set(winner.bingo_numbers));
            });
            
            setPlayerCards(winnerCards);
            setPlayerCardsData(winnerCardsData);
            setWinningNumbersMap(winningNumbers);
            
            const allCalledNumbers = new Set<string>();
            for (const winner of winnersData) {
              winner.called_numbers.forEach((num: string) => allCalledNumbers.add(num));
            }
            setCalledNumbers(allCalledNumbers);
            
            setCurrentRound(roomData.max_rounds || 3);
            setRoundFinished(true);
            setRoundEnded(true);
            setIsCallingNumber(false);
            setLoading(false);
            return;
          } catch (err) {
            console.error("Error al cargar ganadores:", err);
          }
        }
        
        // Guardar scheduled_at para el countdown de inicio
        if (roomData.scheduled_at) {
          const scheduledTime = new Date(roomData.scheduled_at);
          setRoomScheduledAt(scheduledTime);
          
          try {
            const serverTimeResponse = await api.get("/server-time");
            const serverTime = new Date(serverTimeResponse.data.serverTime);
            const clientTime = new Date();
            const offset = serverTime.getTime() - clientTime.getTime();
            setServerTimeOffset(offset);
            
            const adjustedClientTime = new Date(clientTime.getTime() + offset);
            const timeRemaining = Math.floor((scheduledTime.getTime() - adjustedClientTime.getTime()) / 1000);
            setTimeUntilStart(timeRemaining > 0 ? timeRemaining : null);
          } catch (error) {
            console.error("Error al obtener tiempo del servidor:", error);
            const now = new Date();
            const timeRemaining = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);
            setTimeUntilStart(timeRemaining > 0 ? timeRemaining : null);
          }
        }

        // Obtener rounds
        const roundsData = await getRoomRounds(roomId);
        const sortedRounds = [...roundsData].sort((a, b) => a.round_number - b.round_number);
        setRoundsData(sortedRounds);
        
        const bingoTypes = sortedRounds.map((round) => {
          const pattern = typeof round.pattern_id === "object" && round.pattern_id
            ? round.pattern_id.name
            : "";
          return mapPatternToBingoType(pattern);
        });
        setRoundBingoTypes(bingoTypes);

        // Encontrar round actual
        let currentRoundData = roundsData.find((r) => {
          const status = typeof r.status_id === "object" && r.status_id
            ? r.status_id.name
            : "";
          return status === "starting" || status === "in_progress";
        });
        
        if (!currentRoundData) {
          const finishedRounds = roundsData.filter((r) => {
            const status = typeof r.status_id === "object" && r.status_id
              ? r.status_id.name
              : "";
            return status === "finished";
          });
          
          if (finishedRounds.length > 0) {
            finishedRounds.sort((a, b) => b.round_number - a.round_number);
            currentRoundData = finishedRounds[0];
          }
        }
        
        if (currentRoundData) {
          setCurrentRound(currentRoundData.round_number);
          const status = typeof currentRoundData.status_id === "object" && currentRoundData.status_id
            ? currentRoundData.status_id.name
            : "";
          setRoundFinished(status === "finished");
          
          if (status === "starting") {
            setIsCallingNumber(false);
            setRoundEnded(false);
            setRoundFinished(false);
          } else if (status === "finished") {
            setRoundEnded(true);
            setIsCallingNumber(false);
          }
        } else {
          setCurrentRound(1);
        }

        const { getUserId } = await import("../Services/auth.service");
        const userId = getUserId() || "691c18597217196a8c31da37";
        const cardsData = await getCardsByRoomAndUser(roomId, userId);
        
        if (cardsData.length === 0) {
          setError("No tienes cartones asignados para esta sala");
          setLoading(false);
          return;
        }

        setPlayerCardsData(cardsData.map((card) => ({ _id: card._id, code: card.code })));
        const convertedCards = cardsData.map((card) => convertCardNumbers(card.numbers_json));
        setPlayerCards(convertedCards);
        
        // Cargar números ya llamados
        const calledNumbersData = await getCalledNumbers(roomId, currentRoundData?.round_number || 1);
        
        if (calledNumbersData.length > 0) {
          const calledSet = new Set(calledNumbersData.map(cn => cn.number));
          setCalledNumbers(calledSet);
          
          const lastCalled = calledNumbersData[calledNumbersData.length - 1];
          setCurrentNumber(lastCalled.number);
          
          const lastThree = calledNumbersData
            .slice(-3)
            .reverse()
            .map(cn => cn.number);
          setLastNumbers(lastThree);
          
          const timestamp = new Date(lastCalled.called_at).getTime();
          setLastCalledTimestamp(timestamp);
          
          setRoundEnded(false);
          setGameStarted(true);
          setIsCallingNumber(true);
        } else {
          if (currentRoundData) {
            const roundStatus = typeof currentRoundData.status_id === "object" && currentRoundData.status_id
              ? currentRoundData.status_id.name
              : "";
            
            if (roundStatus === "in_progress") {
              setCalledNumbers(new Set());
              setCurrentNumber("");
              setLastNumbers([]);
              setRoundEnded(false);
              setGameStarted(true);
            } else {
              setCalledNumbers(new Set());
              setCurrentNumber("");
              setLastNumbers([]);
              setRoundEnded(false);
              setGameStarted(true);
              setIsCallingNumber(false);
            }
          } else {
            setCalledNumbers(new Set());
            setCurrentNumber("");
            setLastNumbers([]);
            setRoundEnded(false);
            setGameStarted(true);
            setIsCallingNumber(false);
          }
        }

      } catch (err: unknown) {
        let errorMessage = "Error al cargar el juego. Por favor, intenta nuevamente.";
        
        if (err && typeof err === "object") {
          if ("response" in err && err.response && typeof err.response === "object") {
            const response = err.response as { 
              data?: { 
                message?: string;
                availableRooms?: Array<{ id: string; name: string }>;
              } 
            };
            if (response.data?.message) {
              errorMessage = response.data.message;
              
              if (response.data.availableRooms && response.data.availableRooms.length > 0) {
                const roomsList = response.data.availableRooms
                  .map(r => `- ${r.name} (ID: ${r.id})`)
                  .join("\n");
                errorMessage += `\n\nSalas disponibles:\n${roomsList}`;
              }
            }
          } else if ("message" in err && typeof err.message === "string") {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [roomId]);

  return {
    loading,
    error,
    room,
    playerCards,
    playerCardsData,
    currentRound,
    totalRounds,
    totalPot,
    roundBingoTypes,
    roundsData,
    calledNumbers,
    currentNumber,
    lastNumbers,
    lastCalledTimestamp,
    gameStarted,
    isCallingNumber,
    roundEnded,
    roundFinished,
    roomFinished,
    winners,
    winningNumbersMap,
    roomScheduledAt,
    serverTimeOffset,
    timeUntilStart,
    setCurrentRound,
    setCalledNumbers,
    setCurrentNumber,
    setLastNumbers,
    setLastCalledTimestamp,
    setGameStarted,
    setIsCallingNumber,
    setRoundEnded,
    setRoundFinished,
    setRoundsData,
    setRoundBingoTypes,
    setRoom,
    setRoomFinished,
    setWinners,
    setPlayerCards,
    setPlayerCardsData,
    setWinningNumbersMap,
    setTimeUntilStart,
  };
}

