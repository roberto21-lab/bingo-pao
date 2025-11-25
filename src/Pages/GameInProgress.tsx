import { Box, Container, CircularProgress, Alert } from "@mui/material";
import * as React from "react";
import { useParams } from "react-router-dom";
import type { BingoType } from "../utils/bingoUtils";
import { calculateRoundPrizes } from "../utils/bingoUtils";
import { hasBingo, getBingoPatternNumbers } from "../utils/bingoLogic";
import { numberToBingoFormat } from "../utils/bingoUtils";
import type { BingoGrid } from "../utils/bingo";
import GameHeader from "../Componets/GameHeader";
import GameStatusCard from "../Componets/GameStatusCard";
import CardList from "../Componets/CardList";
import CardPreviewModal from "../Componets/CardPreviewModal";
import BingoValidationModal from "../Componets/BingoValidationModal";
import ConfettiFireworks from "../Componets/ConfettiFireworks";
import BackgroundStars from "../Componets/BackgroundStars";
import { api } from "../Services/api";
import { getCardsByRoomAndUser } from "../Services/cards.service";
import { getRoomRounds } from "../Services/rounds.service";
import { getCalledNumbers } from "../Services/calledNumbers.service";
import { claimBingo, getRoomWinners, type RoomWinner } from "../Services/bingo.service";
import {
  connectSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  onNumberCalled,
  onRoundStarted,
  onRoundFinished,
  onTimeoutCountdown,
  onRoundTransitionCountdown,
  onBingoClaimCountdown,
  onBingoClaimed,
  onRoomStateSync,
  onRoundStartCountdown,
} from "../Services/socket.service";

function mapPatternToBingoType(patternName?: string): BingoType {
  switch (patternName) {
    case "horizontal":
      return "horizontal";
    case "vertical":
      return "vertical";
    case "cross_small":
      return "smallCross";
    case "full":
      return "fullCard";
    default:
      return "fullCard";
  }
}

function parseDecimal(decimal: unknown): number {
  if (!decimal) return 0;
  if (typeof decimal === "string") return parseFloat(decimal) || 0;
  if (typeof decimal === "object" && decimal !== null && "$numberDecimal" in decimal) {
    return parseFloat(String((decimal as { $numberDecimal: string }).$numberDecimal)) || 0;
  }
  return typeof decimal === "number" ? decimal : 0;
}

function convertCardNumbers(numbers: (number | "FREE")[][]): number[][] {
  return numbers.map((row) => row.map((num) => (num === "FREE" ? 0 : num)));
}

export default function GameInProgress() {
  React.useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);
  const { roomId } = useParams<{ roomId: string }>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Datos del juego
  const [room, setRoom] = React.useState<Record<string, unknown> | null>(null);
  const [playerCards, setPlayerCards] = React.useState<BingoGrid[]>([]);
  const [playerCardsData, setPlayerCardsData] = React.useState<Array<{ _id: string; code: string }>>([]);
  
  // Estado del juego
  const [currentRound, setCurrentRound] = React.useState(1);
  const [totalRounds, setTotalRounds] = React.useState(3);
  const [totalPot, setTotalPot] = React.useState(0);
  const [roundBingoTypes, setRoundBingoTypes] = React.useState<BingoType[]>([]);
  const [roundsData, setRoundsData] = React.useState<any[]>([]); // Almacenar rounds para obtener pattern directamente

  // Estados del juego
  const [calledNumbers, setCalledNumbers] = React.useState<Set<string>>(new Set());
  const [markedNumbers, setMarkedNumbers] = React.useState<Map<number, Set<string>>>(
    new Map()
  );

  const [modalOpen, setModalOpen] = React.useState(false);
  const [previewCardIndex, setPreviewCardIndex] = React.useState<number | null>(null);
  const [bingoValidationOpen, setBingoValidationOpen] = React.useState(false);
  const [winningCardIndex, setWinningCardIndex] = React.useState<number | null>(null);
  const [showConfetti, setShowConfetti] = React.useState(false);

  // Estado de números llamados (se irán agregando progresivamente)
  const [currentNumber, setCurrentNumber] = React.useState<string>("");
  const [lastNumbers, setLastNumbers] = React.useState<string[]>([]);
  const [gameStarted, setGameStarted] = React.useState(false);
  
  // Estados para countdown y progress bar
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [isCallingNumber, setIsCallingNumber] = React.useState(false);
  const [roundEnded, setRoundEnded] = React.useState(false);
  const [roundFinished, setRoundFinished] = React.useState(false); // Estado del round desde el backend

  // Estado para el timestamp del último número llamado (desde el backend)
  const [lastCalledTimestamp, setLastCalledTimestamp] = React.useState<number | null>(null);
  const CALL_INTERVAL = 7000; // 7 segundos entre números
  const TIMEOUT_COUNTDOWN_DURATION = 10000; // 10 segundos de countdown
  
  // Estado para el countdown de timeout
  const [timeoutCountdown, setTimeoutCountdown] = React.useState<number | null>(null);
  const [timeoutStartTime, setTimeoutStartTime] = React.useState<number | null>(null);
  
  // Estado para el countdown de transición entre rondas
  const [roundTransitionCountdown, setRoundTransitionCountdown] = React.useState<number | null>(null);
  const [nextRoundNumber, setNextRoundNumber] = React.useState<number | null>(null);
  
  // Estado para el countdown de ventana de bingo (45 segundos después de que alguien canta bingo)
  const [bingoClaimCountdown, setBingoClaimCountdown] = React.useState<number | null>(null);
  
  // Estado para el countdown de inicio de sala (solo para la primera ronda)
  const [roomStartCountdown, setRoomStartCountdown] = React.useState<number | null>(null);
  const [roomScheduledAt, setRoomScheduledAt] = React.useState<Date | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = React.useState<number>(0); // Offset entre cliente y servidor
  const [timeUntilStart, setTimeUntilStart] = React.useState<number | null>(null); // Tiempo restante en segundos
  
  // Estado para indicar que el juego está iniciando (después de round-started pero antes del primer número)
  const [isGameStarting, setIsGameStarting] = React.useState(false);
  
  // Estado para salas finalizadas - ganadores
  const [roomFinished, setRoomFinished] = React.useState(false);
  const [winners, setWinners] = React.useState<RoomWinner[]>([]);
  const [winningNumbersMap, setWinningNumbersMap] = React.useState<Map<number, Set<string>>>(new Map());

  // Refs para controlar la sincronización con el backend
  const progressIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Cargar datos del juego
  React.useEffect(() => {
    const fetchGameData = async () => {
      if (!roomId) {
        setError("ID de sala no proporcionado");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // El backend devuelve un objeto directo, no envuelto en { success, data }
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
        const isRoomFinished = roomStatus === "finished";
        setRoomFinished(isRoomFinished);
        
        // Si la sala está finalizada, cargar ganadores en lugar de cartones del usuario
        if (isRoomFinished) {
          try {
            const winnersData = await getRoomWinners(roomId);
            setWinners(winnersData);
            
            // Convertir ganadores a cartones y crear mapa de números ganadores
            const winnerCards: BingoGrid[] = [];
            const winnerCardsData: Array<{ _id: string; code: string }> = [];
            const winningNumbers = new Map<number, Set<string>>();
            
            // Ordenar ganadores por round_number para asegurar orden correcto
            const sortedWinners = [...winnersData].sort((a, b) => a.round_number - b.round_number);
            
            sortedWinners.forEach((winner, index) => {
              console.log(`[GameInProgress] Procesando ganador - Ronda ${winner.round_number}: Cartón ${winner.card_code} (ID: ${winner.card_id})`);
              winnerCards.push(convertCardNumbers(winner.card_numbers));
              winnerCardsData.push({ _id: winner.card_id, code: winner.card_code });
              winningNumbers.set(index, new Set(winner.bingo_numbers));
            });
            
            console.log(`[GameInProgress] Total ganadores cargados: ${winnerCards.length}`);
            console.log(`[GameInProgress] Códigos de cartones:`, winnerCardsData.map(c => c.code));
            
            setPlayerCards(winnerCards);
            setPlayerCardsData(winnerCardsData);
            setWinningNumbersMap(winningNumbers);
            
            // Cargar números llamados de todas las rondas para mostrar en los cartones ganadores
            const allCalledNumbers = new Set<string>();
            for (const winner of winnersData) {
              winner.called_numbers.forEach((num: string) => allCalledNumbers.add(num));
            }
            setCalledNumbers(allCalledNumbers);
            
            // Establecer el round actual al último round (ronda 3)
            setCurrentRound(roomData.max_rounds || 3);
            setRoundFinished(true);
            setRoundEnded(true);
            setIsCallingNumber(false);
            setProgress(0);
            setLoading(false);
            return;
          } catch (err) {
            console.error("Error al cargar ganadores:", err);
            // Continuar con el flujo normal si hay error
          }
        }
        
        // Guardar scheduled_at para el countdown de inicio
        if (roomData.scheduled_at) {
          const scheduledTime = new Date(roomData.scheduled_at);
          setRoomScheduledAt(scheduledTime);
          
          // Obtener tiempo del servidor para sincronización precisa
          try {
            const { api } = await import("../Services/api");
            const serverTimeResponse = await api.get("/server-time");
            const serverTime = new Date(serverTimeResponse.data.serverTime);
            const clientTime = new Date();
            const offset = serverTime.getTime() - clientTime.getTime();
            setServerTimeOffset(offset);
            console.log(`[GameInProgress] Offset del servidor: ${offset}ms`);
            
            // Calcular tiempo restante usando tiempo del servidor
            const adjustedClientTime = new Date(clientTime.getTime() + offset);
            const timeRemaining = Math.floor((scheduledTime.getTime() - adjustedClientTime.getTime()) / 1000);
            setTimeUntilStart(timeRemaining > 0 ? timeRemaining : null);
          } catch (error) {
            console.error("Error al obtener tiempo del servidor, usando tiempo local:", error);
            // Fallback: usar tiempo local
            const now = new Date();
            const timeRemaining = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);
            setTimeUntilStart(timeRemaining > 0 ? timeRemaining : null);
          }
        }

        // Obtener rounds
        const roundsData = await getRoomRounds(roomId);
        
        // IMPORTANTE: Ordenar rounds por round_number para asegurar que el índice corresponda al round
        const sortedRounds = [...roundsData].sort((a, b) => a.round_number - b.round_number);
        
        // Guardar rounds para obtener pattern directamente
        setRoundsData(sortedRounds);
        
        // Mapear tipos de bingo desde los rounds ordenados
        const bingoTypes = sortedRounds.map((round) => {
          const pattern = typeof round.pattern_id === "object" && round.pattern_id
            ? round.pattern_id.name
            : "";
          return mapPatternToBingoType(pattern);
        });
        setRoundBingoTypes(bingoTypes);

        // Encontrar round actual (priorizar "starting" o "in_progress" sobre "finished")
        // Si hay un round en "starting" o "in_progress", usar ese
        // Si no, usar el round "finished" con el número más alto
        let currentRoundData = roundsData.find((r) => {
          const status = typeof r.status_id === "object" && r.status_id
            ? r.status_id.name
            : "";
          return status === "starting" || status === "in_progress";
        });
        
        // Si no hay round en progreso o starting, buscar el último round finalizado
        if (!currentRoundData) {
          const finishedRounds = roundsData.filter((r) => {
            const status = typeof r.status_id === "object" && r.status_id
              ? r.status_id.name
              : "";
            return status === "finished";
          });
          
          if (finishedRounds.length > 0) {
            // Ordenar por round_number descendente y tomar el más reciente
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
          
          console.log(`[GameInProgress] Round actual detectado: Round ${currentRoundData.round_number} (${status})`);
          
          // Si el round está en "starting", mostrar countdown y no llamar números
          if (status === "starting") {
            setIsCallingNumber(false);
            setIsGameStarting(true);
            setRoundEnded(false);
            setRoundFinished(false);
            // El countdown se manejará con el evento round-start-countdown
          } else if (status === "finished") {
            // Si el round está finalizado, detener el juego
            setRoundEnded(true);
            setIsCallingNumber(false);
            setProgress(0);
          }
        } else {
          // Si no se encuentra ningún round, usar el round 1 por defecto
          console.log(`[GameInProgress] No se encontró round activo, usando Round 1 por defecto`);
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

        // Guardar datos completos de los cartones (incluyendo código)
        setPlayerCardsData(cardsData.map((card) => ({ _id: card._id, code: card.code })));

        // Convertir cartones del backend al formato del frontend
        const convertedCards = cardsData.map((card) => convertCardNumbers(card.numbers_json));
        setPlayerCards(convertedCards);

        // Inicializar datos del juego
        setMarkedNumbers(new Map());
        
        // Cargar números ya llamados desde el backend (historial persistente)
        const calledNumbersData = await getCalledNumbers(roomId, currentRoundData?.round_number);
        
        if (calledNumbersData.length > 0) {
          // Hay números ya llamados, restaurar el estado del juego
          const calledSet = new Set(calledNumbersData.map(cn => cn.number));
          setCalledNumbers(calledSet);
          
          // Actualizar número actual y últimos números
          const lastCalled = calledNumbersData[calledNumbersData.length - 1];
          setCurrentNumber(lastCalled.number);
          
          // Últimos 3 números
          const lastThree = calledNumbersData
            .slice(-3)
            .reverse()
            .map(cn => cn.number);
          setLastNumbers(lastThree);
          
          // Establecer timestamp del último número llamado (sincronización con backend)
          const timestamp = new Date(lastCalled.called_at).getTime();
          setLastCalledTimestamp(timestamp);
          
          // Si hay números llamados, el juego ya está en progreso
          // Continuar llamando números sin countdown
          setProgress(0);
          setRoundEnded(false);
          setGameStarted(true);
          setIsCallingNumber(true);
          setCountdown(null); // No mostrar countdown si ya hay números llamados
        } else {
          // No hay números llamados aún, verificar si el round está en progreso
          // Verificar que currentRoundData existe antes de acceder a sus propiedades
          if (currentRoundData) {
            const roundStatus = typeof currentRoundData.status_id === "object" && currentRoundData.status_id
              ? currentRoundData.status_id.name
              : "";
            
            // Si el round está en progreso pero no hay números llamados, iniciar countdown
            if (roundStatus === "in_progress") {
              setCalledNumbers(new Set());
              setCurrentNumber("");
              setLastNumbers([]);
              setProgress(0);
              setRoundEnded(false);
              
              // Iniciar countdown antes de comenzar
              setCountdown(5);
              setGameStarted(true);
            } else {
              // El round no está en progreso, no iniciar countdown
              setCalledNumbers(new Set());
              setCurrentNumber("");
              setLastNumbers([]);
              setProgress(0);
              setRoundEnded(false);
              setCountdown(null);
              setGameStarted(true);
              setIsCallingNumber(false);
            }
          } else {
            // No hay round data, inicializar valores por defecto
            setCalledNumbers(new Set());
            setCurrentNumber("");
            setLastNumbers([]);
            setProgress(0);
            setRoundEnded(false);
            setCountdown(null);
            setGameStarted(true);
            setIsCallingNumber(false);
          }
        }

      } catch (err: unknown) {
        // Extraer mensaje de error del backend si está disponible
        let errorMessage = "Error al cargar el juego. Por favor, intenta nuevamente.";
        
        if (err && typeof err === "object") {
          if ("response" in err && err.response && typeof err.response === "object") {
            const response = err.response as { 
              data?: { 
                message?: string;
                requestedId?: string;
                availableRooms?: Array<{ id: string; name: string }>;
              } 
            };
            if (response.data?.message) {
              errorMessage = response.data.message;
              
              // Si hay salas disponibles, agregar esa información
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


  // Countdown de inicio de sala (solo para la primera ronda, antes de que comience el juego)
  React.useEffect(() => {
    // Solo mostrar countdown si:
    // 1. Es la primera ronda (currentRound === 1)
    // 2. El juego aún no ha comenzado (no hay números llamados)
    // 3. Hay una fecha programada (roomScheduledAt)
    // 4. El round no está finalizado
    if (currentRound !== 1 || roundFinished || !roomScheduledAt || calledNumbers.size > 0) {
      setRoomStartCountdown(null);
      setTimeUntilStart(null);
      return;
    }

    const updateCountdown = () => {
      // Usar tiempo del cliente ajustado con el offset del servidor para mayor precisión
      const now = new Date();
      const adjustedNow = new Date(now.getTime() + serverTimeOffset);
      const scheduledTime = new Date(roomScheduledAt);
      const timeRemaining = Math.floor((scheduledTime.getTime() - adjustedNow.getTime()) / 1000);

      // Actualizar tiempo restante siempre
      setTimeUntilStart(timeRemaining > 0 ? timeRemaining : null);

      if (timeRemaining <= 0) {
        // El tiempo ya pasó, limpiar countdown
        setRoomStartCountdown(null);
        setTimeUntilStart(null);
        return;
      }

      if (timeRemaining <= 45) {
        // Mostrar countdown cuando queden 45 segundos o menos
        setRoomStartCountdown(timeRemaining);
      } else {
        // Si faltan más de 45 segundos, no mostrar countdown pero mantener el tiempo restante
        setRoomStartCountdown(null);
      }
    };

    // Actualizar inmediatamente
    updateCountdown();

    // Actualizar cada segundo
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [currentRound, roundFinished, roomScheduledAt, calledNumbers.size, serverTimeOffset]);

  // Countdown antes de comenzar (countdown interno de 5 segundos cuando el juego está listo)
  React.useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        setCountdown(0);
        // Comenzar el juego después del countdown
        setTimeout(() => {
          setCountdown(null);
          setIsCallingNumber(true);
          // Si no hay timestamp, establecer uno inicial para que se llame el primer número inmediatamente
          if (!lastCalledTimestamp) {
            // Establecer timestamp inicial (hace 7 segundos) para que se llame el primer número inmediatamente
            setLastCalledTimestamp(Date.now() - CALL_INTERVAL);
          }
        }, 500);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, lastCalledTimestamp, CALL_INTERVAL]);

  // NO hacer polling de rounds - usar solo eventos de Socket.IO
  // El evento 'round-finished' ya maneja la finalización del round

  // Conexión WebSocket y sincronización en tiempo real
  // IMPORTANTE: Este efecto debe continuar escuchando eventos incluso cuando roundFinished es true
  // para poder recibir eventos de transición y de inicio de nueva ronda
  React.useEffect(() => {
    // Si el juego no ha comenzado o no hay roomId, no hacer nada
    if (!gameStarted || !roomId) {
      return;
    }
    
    // Si hay countdown activo, no iniciar el efecto de WebSocket todavía
    if (countdown !== null) {
      return;
    }
    
    // Si el round está finalizado o no se está llamando números, limpiar progress bar pero seguir escuchando eventos
    if (roundEnded || roundFinished || !isCallingNumber) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // NO retornar aquí - necesitamos seguir escuchando eventos de transición
    }

    let isMounted = true; // Flag para evitar actualizaciones después de desmontar

    // Conectar WebSocket y unirse a la room
    const socket = connectSocket();
    
    // Asegurarse de unirse a la room cuando el socket esté conectado
    if (socket.connected) {
      joinRoom(roomId);
    } else {
      socket.once("connect", () => {
        joinRoom(roomId);
      });
    }

    // IMPORTANTE: Sincronizar estado completo cuando te unes a una sala con juego activo
    // Esto asegura que todos los usuarios vean exactamente lo mismo
    const unsubscribeRoomStateSync = onRoomStateSync((data) => {
      if (!isMounted || data.room_id !== roomId) {
        return;
      }

      if (data.round) {
        const roundStatus = data.round.status;
        console.log(`[GameInProgress] 🔄 Sincronizando estado: Round ${data.round.round_number}, status: ${roundStatus}`);
        
        // Actualizar round actual
        if (data.round.round_number !== currentRound) {
          setCurrentRound(data.round.round_number);
        }

        if (roundStatus === "starting") {
          // Round está en countdown, no mostrar números aún
          console.log(`[GameInProgress] Round ${data.round.round_number} está en countdown (starting), esperando...`);
          setIsCallingNumber(false);
          setIsGameStarting(true);
          setRoundEnded(false);
          setRoundFinished(false);
          // El countdown se manejará con el evento round-start-countdown
        } else if (roundStatus === "in_progress") {
          console.log(`[GameInProgress] 🔄 Sincronizando estado: Round ${data.round.round_number}, ${data.round.called_count} números llamados`);
          
          // Sincronizar números llamados
          if (data.round.called_numbers.length > 0) {
            const calledSet = new Set(data.round.called_numbers.map(cn => cn.number));
            setCalledNumbers(calledSet);
            
            // Actualizar último número llamado
            const lastCalled = data.round.called_numbers[data.round.called_numbers.length - 1];
            setCurrentNumber(lastCalled.number);
            
            if (data.round.last_called_at) {
              setLastCalledTimestamp(new Date(data.round.last_called_at).getTime());
            }
            
            // Actualizar últimos 3 números
            const lastThree = data.round.called_numbers
              .slice(-3)
              .reverse()
              .map((cn) => cn.number);
            setLastNumbers(lastThree);
          }
          
          // El juego ya está en progreso
          setIsGameStarting(false);
          setIsCallingNumber(true);
        } else if (roundStatus === "finished" || roundStatus === "bingo_claimed") {
          // Round finalizado o con bingo reclamado
          setIsCallingNumber(false);
          setRoundEnded(true);
          setRoundFinished(roundStatus === "finished");
        } else {
          // Estado desconocido o pending
          setIsCallingNumber(false);
          setIsGameStarting(true);
        }
      } else {
        // No hay ronda activa
        console.log(`[GameInProgress] No hay ronda activa en la sala`);
        setCurrentRound(1);
        setCalledNumbers(new Set());
        setCurrentNumber("");
        setLastNumbers([]);
        setLastCalledTimestamp(null);
        setIsGameStarting(true);
        setIsCallingNumber(false);
        setRoundEnded(false);
        setRoundFinished(false);
      }
    });

    const UPDATE_INTERVAL = 50; // Actualizar progress cada 50ms para suavidad

    // Función para actualizar el progress bar basado en el último timestamp o countdown
    // Solo se ejecuta si isCallingNumber es true
    const updateProgress = () => {
      // Solo actualizar si se están llamando números
      if (!isCallingNumber) {
        return;
      }

      // Si hay countdown de timeout activo, mostrar progreso del countdown
      if (timeoutCountdown !== null && timeoutStartTime !== null) {
        const now = Date.now();
        const elapsed = now - timeoutStartTime;
        const remaining = TIMEOUT_COUNTDOWN_DURATION - elapsed;
        const progressValue = Math.max(0, Math.min((elapsed / TIMEOUT_COUNTDOWN_DURATION) * 100, 100));
        setProgress(progressValue);
        
        // Actualizar countdown cada segundo
        const secondsRemaining = Math.ceil(remaining / 1000);
        if (secondsRemaining !== timeoutCountdown && secondsRemaining >= 0) {
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
      if (!lastCalledTimestamp) {
        setProgress(0);
        return;
      }

      const now = Date.now();
      const timeSinceLastCall = now - lastCalledTimestamp;
      const progressValue = Math.min((timeSinceLastCall / CALL_INTERVAL) * 100, 100);
      setProgress(progressValue);
    };

    // Escuchar eventos de números llamados en tiempo real
    const unsubscribeNumberCalled = onNumberCalled((data) => {
      // Verificar flag antes de procesar
      if (!isMounted) {
        return;
      }

      if (data.round_number !== currentRound || data.room_id !== roomId) {
        return;
      }

      // No procesar si el round está finalizado o hay bingo claim activo
      if (roundFinished || bingoClaimCountdown !== null) {
        return;
      }

      // IMPORTANTE: Verificar si el número ya está en el set antes de procesarlo
      // Esto evita duplicados cuando se carga con getCalledNumbers y luego llega el evento
      setCalledNumbers((prev) => {
        // Si el número ya está en el set, no hacer nada (evitar duplicados)
        if (prev.has(data.number)) {
          console.log(`[GameInProgress] Número ${data.number} ya está en el set, ignorando para evitar duplicado`);
          return prev; // Retornar el mismo set sin cambios
        }
        
        // El número es nuevo, procesarlo
        const calledTimestamp = new Date(data.called_at).getTime();
        setLastCalledTimestamp(calledTimestamp);
        
        // Actualizar número actual y últimos números
        setCurrentNumber(data.number);
        setLastNumbers((prevLast) => {
          const updated = [data.number, ...prevLast].slice(0, 3);
          return updated;
        });
        
        setProgress(0);
        
        // Si se recibe un número y isCallingNumber es false, activarlo automáticamente
        if (!isCallingNumber) {
          console.log(`[GameInProgress] Recibido número ${data.number} pero isCallingNumber es false. Activando...`);
          setIsCallingNumber(true);
          setRoundEnded(false);
        }

        // IMPORTANTE: Cuando llega el primer número, limpiar el estado de "iniciando"
        if (isGameStarting) {
          console.log(`[GameInProgress] Primer número recibido: ${data.number}. El juego ha comenzado.`);
          setIsGameStarting(false);
        }
        
        // Agregar el número al set
        return new Set([...prev, data.number]);
      });
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

      if (data.room_id === roomId) {
        console.log(`[GameInProgress] Nueva ronda iniciada: Round ${data.round_number}`);
        
        // IMPORTANTE: Recargar rounds para obtener el pattern actualizado del nuevo round
        try {
          const updatedRoundsData = await getRoomRounds(roomId);
          // IMPORTANTE: Ordenar rounds por round_number para asegurar que el índice corresponda al round
          const sortedUpdatedRounds = [...updatedRoundsData].sort((a, b) => a.round_number - b.round_number);
          
          // Guardar rounds actualizados
          setRoundsData(sortedUpdatedRounds);
          
          const updatedBingoTypes = sortedUpdatedRounds.map((round) => {
            const pattern = typeof round.pattern_id === "object" && round.pattern_id
              ? round.pattern_id.name
              : "";
            return mapPatternToBingoType(pattern);
          });
          setRoundBingoTypes(updatedBingoTypes);
          console.log(`[GameInProgress] Patterns actualizados para ${sortedUpdatedRounds.length} rounds`);
        } catch (error) {
          console.error(`[GameInProgress] Error al recargar rounds para actualizar patterns:`, error);
        }
        
        // IMPORTANTE: Limpiar el countdown de transición PRIMERO antes de cualquier otra cosa
        // Esto asegura que el UI muestre "Iniciando juego..." en lugar del countdown
        setRoundTransitionCountdown(null);
        setNextRoundNumber(null);
        
        // Actualizar round actual
        setCurrentRound(data.round_number);
        
        // Limpiar todos los números llamados localmente
        setCalledNumbers(new Set());
        setCurrentNumber("");
        setLastNumbers([]);
        setLastCalledTimestamp(null);
        
        // Limpiar números marcados en todos los cartones
        setMarkedNumbers(new Map());
        
        // Resetear estados de la ronda
        setRoundFinished(false);
        setRoundEnded(false);
        setIsCallingNumber(false); // IMPORTANTE: NO activar isCallingNumber hasta que llegue el primer número
        setProgress(0);
        setTimeoutCountdown(null);
        setTimeoutStartTime(null);
        setBingoClaimCountdown(null); // Limpiar countdown de bingo claim
        setWinningCardIndex(null);
        setShowConfetti(false);
        setBingoValidationOpen(false);
        setRoomStartCountdown(null); // Limpiar countdown de inicio de sala
        
        // IMPORTANTE: Indicar que el juego está iniciando (mostrar "Iniciando juego...")
        // Esto se limpiará cuando llegue el primer número
        setIsGameStarting(true);
        
        // IMPORTANTE: NO cargar números llamados aquí para rondas > 1
        // Solo esperar a que lleguen los eventos en tiempo real para evitar duplicados
        // Solo cargar números si es la primera ronda y el usuario se conecta tarde
        if (data.round_number === 1) {
          try {
            const calledNumbersData = await getCalledNumbers(roomId, data.round_number);
            if (calledNumbersData.length > 0) {
              const calledSet = new Set(calledNumbersData.map(cn => cn.number));
              setCalledNumbers(calledSet);
              
              const lastCalled = calledNumbersData[calledNumbersData.length - 1];
              setCurrentNumber(lastCalled.number);
              setLastCalledTimestamp(new Date(lastCalled.called_at).getTime());
              
              const lastThree = calledNumbersData
                .slice(-3)
                .reverse()
                .map((cn) => cn.number);
              setLastNumbers(lastThree);
              
              // Si ya hay números, el juego ya comenzó
              setIsGameStarting(false);
              setIsCallingNumber(true);
            }
          } catch (error) {
            console.error("Error al cargar números de la nueva ronda:", error);
          }
        }
      }
    });

    // Escuchar eventos de bingo reclamado
    const unsubscribeBingoClaimed = onBingoClaimed((data) => {
      if (!isMounted) return;

      // IMPORTANTE: Procesar el evento si es para el round actual O si el round_number es mayor
      // Esto asegura que el evento se procese incluso si hay un problema de sincronización
      if (data.room_id === roomId && (data.round_number === currentRound || data.round_number >= currentRound)) {
        console.log(`[GameInProgress] Bingo reclamado en round ${data.round_number}${data.winner.is_first ? ' (PRIMER BINGO - iniciando ventana de 45s)' : ' (bingo adicional durante ventana)'}`);
        
        // IMPORTANTE: Si el round del evento es mayor al actual, actualizar el round actual
        // Esto previene que el round retroceda cuando se reclama bingo
        if (data.round_number > currentRound) {
          console.log(`[GameInProgress] Actualizando round actual desde bingo reclamado: Round ${data.round_number} (antes: Round ${currentRound})`);
          setCurrentRound(data.round_number);
        }
        
        if (data.winner.is_first) {
          // Detener la llamada de números cuando se reclama el primer bingo
          setIsCallingNumber(false);
          setProgress(0);
          setTimeoutCountdown(null);
          setTimeoutStartTime(null);
        }
      }
    });

    // Escuchar eventos de countdown de ventana de bingo (45 segundos)
    const unsubscribeBingoClaimCountdown = onBingoClaimCountdown((data) => {
      if (!isMounted) return;

      // IMPORTANTE: Procesar el countdown si es para el round actual O si el round_number es mayor
      // Esto asegura que el countdown funcione incluso si hay un problema de sincronización
      if (data.room_id === roomId && (data.round_number === currentRound || data.round_number >= currentRound)) {
        console.log(`[GameInProgress] Countdown de ventana de bingo: ${data.seconds_remaining}s restantes para Round ${data.round_number}`);
        
        // IMPORTANTE: Si el round del evento es mayor al actual, actualizar el round actual
        // Esto previene que el round retroceda cuando se reclama bingo
        if (data.round_number > currentRound) {
          console.log(`[GameInProgress] Actualizando round actual desde countdown de bingo: Round ${data.round_number} (antes: Round ${currentRound})`);
          setCurrentRound(data.round_number);
        }
        
        if (data.seconds_remaining > 0) {
          setBingoClaimCountdown(data.seconds_remaining);
        } else {
          // Cuando llega a 0, limpiar el countdown (la ronda se finalizará automáticamente)
          console.log(`[GameInProgress] Ventana de bingo cerrada. Finalizando round ${data.round_number}...`);
          setBingoClaimCountdown(null);
        }
      }
    });

    // Escuchar eventos de round finalizado
    const unsubscribeRoundFinished = onRoundFinished((data) => {
      if (!isMounted) return;

      if (data.round_number === currentRound && data.room_id === roomId) {
        console.log(`[GameInProgress] Round ${data.round_number} finalizado. Esperando countdown de transición...`);
        setRoundFinished(true);
        setRoundEnded(true);
        setIsCallingNumber(false);
        setProgress(0);
        setTimeoutCountdown(null);
        setTimeoutStartTime(null);
        setBingoClaimCountdown(null); // Limpiar countdown de bingo cuando el round se finaliza
        // El countdown de transición comenzará automáticamente desde el backend
      }
    });

    // Escuchar eventos de countdown de transición entre rondas
    const unsubscribeRoundTransitionCountdown = onRoundTransitionCountdown((data) => {
      if (!isMounted) return;

      if (data.room_id === roomId) {
        console.log(`[GameInProgress] Countdown de transición: ${data.seconds_remaining}s para Round ${data.next_round_number}`);
        if (data.seconds_remaining > 0) {
          setRoundTransitionCountdown(data.seconds_remaining);
          setNextRoundNumber(data.next_round_number);
          // IMPORTANTE: Asegurar que isCallingNumber esté en false durante el countdown
          setIsCallingNumber(false);
        } else {
          // Cuando llega a 0, limpiar el countdown (la nueva ronda comenzará automáticamente)
          console.log(`[GameInProgress] Countdown de transición completado. Esperando inicio de Round ${data.next_round_number}...`);
          setRoundTransitionCountdown(null);
          setNextRoundNumber(null);
          // El evento round-started se emitirá inmediatamente después, que limpiará todo
        }
      }
    });

    // Escuchar eventos de countdown antes de empezar a llamar números en una nueva ronda (20 segundos)
    const unsubscribeRoundStartCountdown = onRoundStartCountdown((data) => {
      if (!isMounted) return;

      if (data.room_id === roomId && data.round_number === currentRound) {
        console.log(`[GameInProgress] Countdown antes de empezar Round ${data.round_number}: ${data.seconds_remaining}s`);
        if (data.seconds_remaining > 0) {
          // Mostrar countdown de inicio de ronda
          setRoundTransitionCountdown(data.seconds_remaining);
          setNextRoundNumber(data.round_number);
          setIsCallingNumber(false);
          setIsGameStarting(true);
        } else {
          // Cuando llega a 0, limpiar el countdown (los números comenzarán a llamarse)
          console.log(`[GameInProgress] Countdown de inicio completado. Los números comenzarán a llamarse...`);
          setRoundTransitionCountdown(null);
          setNextRoundNumber(null);
          // isCallingNumber se activará cuando llegue el primer número
        }
      }
    });

    // Verificar periódicamente el round actual (cada 5 segundos) para sincronizar
    const checkCurrentRound = async () => {
      if (!isMounted || !roomId) return;
      
      // IMPORTANTE: No verificar el round si hay un bingo reclamado (countdown activo)
      // Esto evita que el round retroceda cuando se reclama bingo
      if (bingoClaimCountdown !== null) {
        return;
      }
      
      try {
        const roundsData = await getRoomRounds(roomId);
        
        // Buscar round en starting, progreso o con bingo reclamado
        let newCurrentRoundData = roundsData.find((r) => {
          const status = typeof r.status_id === "object" && r.status_id
            ? r.status_id.name
            : "";
          return status === "starting" || status === "in_progress" || status === "bingo_claimed";
        });
        
        // Si no hay round en progreso o con bingo reclamado, buscar el último round finalizado
        if (!newCurrentRoundData) {
          const finishedRounds = roundsData.filter((r) => {
            const status = typeof r.status_id === "object" && r.status_id
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
        if (newCurrentRoundData && newCurrentRoundData.round_number !== currentRound) {
          // Solo actualizar si el nuevo round es mayor (avanzar) o si el round actual no existe en los datos
          const currentRoundExists = roundsData.some(r => r.round_number === currentRound);
          
          if (newCurrentRoundData.round_number > currentRound || !currentRoundExists) {
            console.log(`[GameInProgress] Round actualizado desde verificación periódica: Round ${newCurrentRoundData.round_number} (antes: Round ${currentRound})`);
            setCurrentRound(newCurrentRoundData.round_number);
            
            // Si es un nuevo round, limpiar números
            if (newCurrentRoundData.round_number > currentRound) {
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
                const calledNumbersData = await getCalledNumbers(roomId, newCurrentRoundData.round_number);
                if (calledNumbersData.length > 0) {
                  const calledSet = new Set(calledNumbersData.map(cn => cn.number));
                  setCalledNumbers(calledSet);
                  
                  const lastCalled = calledNumbersData[calledNumbersData.length - 1];
                  setCurrentNumber(lastCalled.number);
                  setLastCalledTimestamp(new Date(lastCalled.called_at).getTime());
                  
                  const lastThree = calledNumbersData
                    .slice(-3)
                    .reverse()
                    .map((cn) => cn.number);
                  setLastNumbers(lastThree);
                }
              } catch (error) {
                console.error("Error al cargar números del round actualizado:", error);
              }
            }
          } else {
            console.log(`[GameInProgress] Ignorando actualización de round (evitar retroceso): Round ${newCurrentRoundData.round_number} <= Round ${currentRound}`);
          }
        }
      } catch (error) {
        console.error("Error al verificar round actual:", error);
      }
    };

    // Verificar round actual cada 5 segundos
    const roundCheckInterval = setInterval(checkCurrentRound, 5000);

    // Cargar números llamados iniciales (solo una vez al montar)
    const loadInitialNumbers = async () => {
      try {
        const calledNumbersData = await getCalledNumbers(roomId, currentRound);
        
        if (calledNumbersData.length > 0) {
          const lastCalled = calledNumbersData[calledNumbersData.length - 1];
          const lastTimestamp = new Date(lastCalled.called_at).getTime();
          
          setLastCalledTimestamp(lastTimestamp);
          
          // Actualizar con todos los números llamados
          const numbersSet = new Set(calledNumbersData.map((cn) => cn.number));
          setCalledNumbers(numbersSet);
          
          // Establecer número actual
          setCurrentNumber(lastCalled.number);
          setLastNumbers(
            calledNumbersData
              .slice(-3)
              .reverse()
              .map((cn) => cn.number)
          );
          
          // Actualizar progress bar
          updateProgress();
        }
      } catch {
        // Error silencioso al cargar números iniciales
      }
    };

    // Cargar números iniciales
    loadInitialNumbers();

    // Actualizar progress bar continuamente solo si se están llamando números
    // Limpiar intervalo anterior si existe
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Crear nuevo intervalo solo si se están llamando números
    if (isCallingNumber && !roundFinished && !roundEnded) {
      progressIntervalRef.current = setInterval(updateProgress, UPDATE_INTERVAL);
    }

    return () => {
      isMounted = false; // Marcar como desmontado para evitar actualizaciones
      
      // Limpiar intervalos
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (roundCheckInterval) {
        clearInterval(roundCheckInterval);
      }
      
      // Desuscribirse de eventos WebSocket
      unsubscribeNumberCalled();
      unsubscribeRoomStateSync();
      unsubscribeTimeoutCountdown();
      unsubscribeBingoClaimed();
      unsubscribeBingoClaimCountdown();
      unsubscribeRoundStarted();
      unsubscribeRoundFinished();
      unsubscribeRoundTransitionCountdown();
      unsubscribeRoundStartCountdown();
      
      // Salir de la room
      leaveRoom(roomId);
    };
  }, [gameStarted, roomId, currentRound, countdown, isCallingNumber, roundEnded, roundFinished, lastCalledTimestamp, timeoutCountdown, timeoutStartTime]);

  // Obtener el pattern del round actual directamente desde roundsData
  // Esto asegura que siempre obtengamos el pattern correcto del round actual
  const currentBingoType: BingoType = React.useMemo(() => {
    // Buscar el round actual en roundsData
    const currentRoundData = roundsData.find((r) => r.round_number === currentRound);
    
    if (currentRoundData) {
      const pattern = typeof currentRoundData.pattern_id === "object" && currentRoundData.pattern_id
        ? currentRoundData.pattern_id.name
        : "";
      
      // Validar que el pattern sea correcto según la ley
      if (currentRound === 1 || currentRound === 2) {
        // Rounds 1 y 2 NUNCA pueden ser "full"
        if (pattern === "full") {
          console.warn(`[GameInProgress] ⚠️ LEY VIOLADA: Round ${currentRound} tiene pattern "full". Usando fallback seguro.`);
          return "horizontal"; // Pattern seguro para rounds 1 y 2
        }
      } else if (currentRound === 3) {
        // Round 3 SIEMPRE debe ser "full"
        if (pattern !== "full") {
          console.warn(`[GameInProgress] ⚠️ LEY VIOLADA: Round 3 tiene pattern "${pattern}" en lugar de "full". Usando "fullCard".`);
          return "fullCard";
        }
      }
      
      return mapPatternToBingoType(pattern);
    }
    
    // Fallback: usar roundBingoTypes si roundsData no está disponible
    if (roundBingoTypes.length > 0 && roundBingoTypes[currentRound - 1]) {
      return roundBingoTypes[currentRound - 1];
    }
    
    // Fallback final: pattern seguro según el round
    if (currentRound === 1 || currentRound === 2) {
      return "horizontal"; // Pattern seguro para rounds 1 y 2 (nunca deben ser fullCard)
    } else if (currentRound === 3) {
      return "fullCard"; // Round 3 siempre es fullCard
    }
    
    return "horizontal"; // Default seguro
  }, [roundsData, roundBingoTypes, currentRound]);

  const getMarkedForCard = React.useCallback((cardIndex: number): Set<string> => {
    return markedNumbers.get(cardIndex) || new Set();
  }, [markedNumbers]);

  // Detectar bingo y validar en el backend
  React.useEffect(() => {
    if (roundEnded || !isCallingNumber || playerCards.length === 0 || !roomId) return;

    // Verificar si algún cartón tiene bingo
    const checkForBingo = async () => {
      for (let i = 0; i < playerCards.length; i++) {
        const card = playerCards[i];
        if (!card) continue;
        const cardMarked = getMarkedForCard(i);
        
        // Verificar bingo localmente primero
        if (hasBingo(card, cardMarked, currentBingoType)) {
          try {
            // Validar en el backend
            const { getUserId } = await import("../Services/auth.service");
            const userId = getUserId() || "691c18597217196a8c31da37";
            const cardsData = await getCardsByRoomAndUser(roomId, userId);
            if (i >= cardsData.length) {
              return;
            }

            const cardId = cardsData[i]._id;
            const markedNumbersArray = Array.from(cardMarked);

            const result = await claimBingo(roomId, currentRound, {
              cardId,
              userId,
              markedNumbers: markedNumbersArray
            });

            // Si el bingo es válido, detener el juego
            if (result.success) {
              setRoundFinished(true);
              setRoundEnded(true);
              setIsCallingNumber(false);
              setProgress(0);
              setWinningCardIndex(i);
              setShowConfetti(true);
              setBingoValidationOpen(true);
              
              setTimeout(() => {
                setShowConfetti(false);
              }, 5000);
              return true;
            }
          } catch {
            // No detener el juego si la validación falla
          }
        }
      }
      return false;
    };

    checkForBingo();
  }, [calledNumbers, markedNumbers, playerCards, roundEnded, isCallingNumber, currentBingoType, getMarkedForCard, roomId, currentRound]);

  const roundPrizes = React.useMemo(
    () => calculateRoundPrizes(totalPot, totalRounds),
    [totalPot, totalRounds]
  );
  const currentRoundPrize = roundPrizes[currentRound - 1] || 0;

  const isNumberCalled = (num: number): boolean => {
    if (num === 0) return false;
    return calledNumbers.has(numberToBingoFormat(num));
  };

  const isNumberMarked = (num: number, cardIndex: number): boolean => {
    if (num === 0) return false;
    const cardMarked = getMarkedForCard(cardIndex);
    return cardMarked.has(numberToBingoFormat(num));
  };

  const checkBingo = (cardIndex: number): boolean => {
    if (playerCards.length === 0) return false;
    const card = playerCards[cardIndex];
    if (!card) return false;
    const cardMarked = getMarkedForCard(cardIndex);
    return hasBingo(card, cardMarked, currentBingoType);
  };

  // Calcular los números del patrón de bingo para cada cartón
  const bingoPatternNumbersMap = React.useMemo(() => {
    const map = new Map<number, Set<string>>();
    playerCards.forEach((card, index) => {
      const cardMarked = getMarkedForCard(index);
      if (hasBingo(card, cardMarked, currentBingoType)) {
        map.set(index, getBingoPatternNumbers(card, cardMarked, currentBingoType));
      }
    });
    return map;
  }, [playerCards, currentBingoType, getMarkedForCard]);

  const handleCardClick = (index: number) => {
    setPreviewCardIndex(index);
    setModalOpen(true);
  };

  const handleNumberClick = (number: number) => {
    if (previewCardIndex === null || number === 0) return;

    const numberFormat = numberToBingoFormat(number);
    if (!calledNumbers.has(numberFormat)) return;

    setMarkedNumbers((prev) => {
      const next = new Map(prev);
      const cardMarked = next.get(previewCardIndex) || new Set();
      const newMarked = new Set(cardMarked);

      if (newMarked.has(numberFormat)) {
        newMarked.delete(numberFormat);
      } else {
        newMarked.add(numberFormat);
      }

      next.set(previewCardIndex, newMarked);
      return next;
    });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setPreviewCardIndex(null);
  };

  const handlePreviousCard = () => {
    if (previewCardIndex !== null && previewCardIndex > 0) {
      setPreviewCardIndex(previewCardIndex - 1);
    }
  };

  const handleNextCard = () => {
    if (previewCardIndex !== null && previewCardIndex < playerCards.length - 1) {
      setPreviewCardIndex(previewCardIndex + 1);
    }
  };

  const handleBingo = async () => {
    if (previewCardIndex === null || !roomId) return;

    try {
      // Obtener el cartón y los números marcados
      const card = playerCards[previewCardIndex];
      if (!card) return;

      const cardMarked = getMarkedForCard(previewCardIndex);
      const markedNumbersArray = Array.from(cardMarked);

      const userId = "691c18597217196a8c31da37";
      
      const cardsData = await getCardsByRoomAndUser(roomId, userId);
      if (previewCardIndex >= cardsData.length) {
        return;
      }

      const cardId = cardsData[previewCardIndex]._id;

      // Llamar al endpoint de validación de bingo
      const result = await claimBingo(roomId, currentRound, {
        cardId,
        userId,
        markedNumbers: markedNumbersArray
      });

      // Si el bingo es válido, mostrar confetti y actualizar estado
      if (result.success) {
        setRoundFinished(true);
        setWinningCardIndex(previewCardIndex);
        setShowConfetti(true);
        handleCloseModal();
        setBingoValidationOpen(true);
        
        // Detener el juego
        setRoundEnded(true);
        setIsCallingNumber(false);
        setProgress(0);
        
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
      }
    } catch (error: unknown) {
      const errorMessage = error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Error al validar el bingo. Por favor, verifica que todos los números estén marcados correctamente.";
      alert(errorMessage);
    }
  };

  const handleCloseBingoValidation = () => {
    setBingoValidationOpen(false);
    setWinningCardIndex(null);
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#1a1008",
          color: "#f5e6d3",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: "80px",
        }}
      >
        <CircularProgress sx={{ color: "#d4af37" }} />
      </Box>
    );
  }

  // Error state
  if (error || !room || playerCards.length === 0) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#1a1008",
          color: "#f5e6d3",
          paddingBottom: "80px",
        }}
      >
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Alert 
            severity="error" 
            sx={{ 
              backgroundColor: "rgba(201, 168, 90, 0.2)", 
              color: "#c9a85a", 
              border: "1px solid rgba(201, 168, 90, 0.4)",
              "& .MuiAlert-message": {
                whiteSpace: "pre-line"
              }
            }}
          >
            {error || "No se pudo cargar el juego"}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#1a1008", // Fondo de madera oscura
        color: "#f5e6d3", // Texto crema
        paddingBottom: "80px",
        position: "relative",
        overflow: "hidden",
        // Textura de madera de fondo (más sutil)
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            #1a1008 0px,
            #1f1309 1px,
            #2a1a0f 2px,
            #1f1309 3px,
            #1a1008 4px,
            #1a1008 8px,
            #1f1309 9px,
            #2a1a0f 10px,
            #1f1309 11px,
            #1a1008 12px
          ),
          linear-gradient(
            90deg,
            #1a1008 0%,
            #1f1309 15%,
            #2a1a0f 30%,
            #1f1309 45%,
            #1a1008 60%,
            #1f1309 75%,
            #2a1a0f 90%,
            #1a1008 100%
          ),
          radial-gradient(ellipse 200px 50px at 25% 30%, rgba(42, 26, 15, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse 150px 40px at 75% 60%, rgba(31, 19, 9, 0.25) 0%, transparent 50%)
        `,
        backgroundSize: `
          100% 16px,
          200% 100%,
          100% 100%,
          100% 100%
        `,
        // Capa de difuminado/vaho sobre el fondo
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse 600px 400px at 20% 30%, rgba(0, 0, 0, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 500px 350px at 80% 60%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 400px 300px at 50% 20%, rgba(0, 0, 0, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 350px 250px at 15% 70%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 450px 320px at 70% 15%, rgba(0, 0, 0, 0.1) 0%, transparent 60%)
          `,
          backdropFilter: "blur(8px) saturate(120%)",
          WebkitBackdropFilter: "blur(8px) saturate(120%)",
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <BackgroundStars />

      <Container maxWidth="sm" sx={{ py: 3, position: "relative", zIndex: 1 }}>
        <GameHeader
          currentRound={currentRound}
          currentRoundPrize={currentRoundPrize}
          currentBingoType={currentBingoType}
          isGameActive={!roundFinished && gameStarted}
          roomName={room && typeof room === "object" && "name" in room ? String(room.name) : undefined}
          roomFinished={roomFinished}
          totalPrize={totalPot}
        />

            <GameStatusCard
              currentRound={currentRound}
              totalRounds={totalRounds}
              lastNumbers={lastNumbers}
              currentNumber={currentNumber}
              progress={progress}
              countdown={countdown ?? undefined}
              isFinished={roundFinished || roomFinished}
              timeoutCountdown={roomFinished ? null : timeoutCountdown}
              roundTransitionCountdown={roomFinished ? null : roundTransitionCountdown}
              nextRoundNumber={roomFinished ? null : nextRoundNumber}
              roomStartCountdown={roomFinished ? null : roomStartCountdown}
              roomScheduledAt={roomFinished ? null : roomScheduledAt}
              timeUntilStart={roomFinished ? null : timeUntilStart}
              roomFinished={roomFinished}
              bingoClaimCountdown={roomFinished ? null : bingoClaimCountdown}
              isCallingNumber={isCallingNumber}
              isGameStarting={isGameStarting}
            />

        <CardList
          cards={playerCards}
          cardsData={playerCardsData}
          calledNumbers={calledNumbers}
          markedNumbers={markedNumbers}
          hasBingo={checkBingo}
          onCardClick={handleCardClick}
          bingoPatternNumbersMap={bingoPatternNumbersMap}
          roomId={roomId}
          isGameFinished={roundFinished || roomFinished}
          winningNumbersMap={roomFinished ? winningNumbersMap : undefined}
          showWinners={roomFinished}
          winners={roomFinished ? winners : undefined}
        />
      </Container>

      {previewCardIndex !== null && playerCards[previewCardIndex] && (() => {
        const card = playerCards[previewCardIndex];
        const cardMarked = getMarkedForCard(previewCardIndex);
        const hasBingoOnCard = checkBingo(previewCardIndex);
        const bingoPatternNumbers = hasBingoOnCard
          ? getBingoPatternNumbers(card, cardMarked, currentBingoType)
          : new Set<string>();
        
        return (
          <CardPreviewModal
            open={modalOpen}
            onClose={handleCloseModal}
            onBingo={handleBingo}
            card={card}
            cardCode={playerCardsData[previewCardIndex]?.code || String(previewCardIndex + 1)}
            hasBingo={hasBingoOnCard}
            isNumberCalled={isNumberCalled}
            isNumberMarked={(num) => isNumberMarked(num, previewCardIndex)}
            onNumberClick={handleNumberClick}
            onPrevious={handlePreviousCard}
            onNext={handleNextCard}
            hasPrevious={previewCardIndex > 0}
            hasNext={previewCardIndex < playerCards.length - 1}
            previousHasBingo={previewCardIndex > 0 ? checkBingo(previewCardIndex - 1) : false}
            nextHasBingo={previewCardIndex < playerCards.length - 1 ? checkBingo(previewCardIndex + 1) : false}
            bingoPatternNumbers={bingoPatternNumbers}
          />
        );
      })()}

      {winningCardIndex !== null && playerCards[winningCardIndex] && (
        <BingoValidationModal
          open={bingoValidationOpen}
          onClose={handleCloseBingoValidation}
          winningCard={playerCards[winningCardIndex]}
          winningCardCode={playerCardsData[winningCardIndex]?.code || String(winningCardIndex + 1)}
          markedNumbers={getMarkedForCard(winningCardIndex)}
          calledNumbers={calledNumbers}
        />
      )}

      <ConfettiFireworks active={showConfetti} />
    </Box>
  );
}
