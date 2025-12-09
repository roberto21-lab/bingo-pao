import {
  Box,
  Container,
  Typography,
  Stack,
  Link,
  CircularProgress,
  Alert,
} from "@mui/material";
import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import CardMiniature from "../Components/CardMiniature";
import { type BackendRoom, mapStatus } from "../Services/rooms.service";
import { api } from "../Services/api";
import BackgroundStars from "../Components/BackgroundStars";
import {
  getCardsByRoomAndUser,
  enrollCards,
  getAvailableCards,
  type BackendCard,
} from "../Services/cards.service";
import { useAuth } from "../hooks/useAuth";
import {
  onRoomStatusUpdated,
  onRoomPrizeUpdated,
  onRoomPriceUpdated,
  onRoomStateSync,
  onCardsEnrolled,
  joinRoom,
  leaveRoom,
} from "../Services/socket.service";
import { useRoomContext } from "../contexts/RoomContext";
import { SearchBar } from "../Components/shared/SearchBar";
import { GlassDialog } from "../Components/shared/GlassDialog";
import { CardSelectionPreview } from "../Components/shared/CardSelectionPreview";
import { ConfirmDeselectDialog } from "../Components/shared/ConfirmDeselectDialog";
import { EnrollmentSummary } from "../Components/shared/EnrollmentSummary";
import { MetallicButton } from "../Components/shared/MetallicButton";
import SuccessToast from "../Components/SuccessToast";
import ErrorToast from "../Components/ErrorToast";
import { getWalletByUser } from "../Services/wallets.service";
import { getUserId } from "../Services/auth.service";
import { roomDetailStyles } from "../styles/roomDetail.styles";
import type { RoomDetailData, CardMaps, ErrorResponse, RoomStatus } from "../types/roomDetail.types";

export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setRoomStatus, setRoomTitle, clearRoomState } = useRoomContext();
  const [room, setRoom] = React.useState<RoomDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [enrolledCards, setEnrolledCards] = React.useState<BackendCard[]>([]);
  const [enrolling, setEnrolling] = React.useState(false);
  const [availableCardsFromDB, setAvailableCardsFromDB] = React.useState<
    BackendCard[]
  >([]);
  const [loadingCards, setLoadingCards] = React.useState(true);
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);
  const [showErrorToast, setShowErrorToast] = React.useState(false);
  const [errorToastMessage, setErrorToastMessage] = React.useState<string>("");
  const [availableBalance, setAvailableBalance] = React.useState<number>(0);
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  React.useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) {
        setError("ID de sala no proporcionado");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await api.get<BackendRoom>(`/rooms/${roomId}`);

        if (!response.data) {
          throw new Error("Sala no encontrada");
        }

        const backendRoom = response.data;

        const parseDecimal = (decimal: unknown): number => {
          if (!decimal) return 0;
          if (typeof decimal === "string") return parseFloat(decimal) || 0;
          if (
            typeof decimal === "object" &&
            decimal !== null &&
            "$numberDecimal" in decimal
          ) {
            return parseFloat(String(decimal.$numberDecimal)) || 0;
          }
          return typeof decimal === "number" ? decimal : 0;
        };

        const currency =
          typeof backendRoom.currency_id === "object" && backendRoom.currency_id
            ? backendRoom.currency_id
            : null;

        const status =
          typeof backendRoom.status_id === "object" && backendRoom.status_id
            ? backendRoom.status_id.name || "waiting_players"
            : typeof backendRoom.status_id === "string"
            ? backendRoom.status_id
            : "waiting_players";

        const mappedStatus = mapStatus(status);

        const roomData: RoomDetailData = {
          id: backendRoom._id || backendRoom.id || "",
          title: backendRoom.name,
          prizeAmount: parseDecimal(
            backendRoom.total_prize || backendRoom.total_pot
          ),
          currency: (() => {
            const code = currency?.code || "Bs";
            const normalized = code.toLowerCase().trim();
            return normalized === "ves" ? "Bs" : code;
          })(),
          ticketsToStart: backendRoom.min_players || 10,
          ticketPrice: parseDecimal(backendRoom.price_per_card),
          status: mappedStatus || "waiting",
        };

        setRoom(roomData);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error al cargar la sala. Por favor, intenta nuevamente.";
        const responseMessage = (
          err as { response?: { data?: { message?: string } } }
        )?.response?.data?.message;
        setError(responseMessage || errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  // Actualizar el contexto cuando la sala se carga o cambia
  React.useEffect(() => {
    if (room) {
      setRoomStatus(room.status);
      setRoomTitle(room.title);
    }
  }, [room, setRoomStatus, setRoomTitle]);

  // Limpiar el contexto cuando el componente se desmonta
  React.useEffect(() => {
    return () => {
      clearRoomState();
    };
  }, [clearRoomState]);

  React.useEffect(() => {
    if (!roomId) return;

    const unsubscribeStatusUpdated = onRoomStatusUpdated((data) => {
      if (data.room_id === roomId) {
        setRoom((prevRoom) => {
          if (!prevRoom) return prevRoom;

          let mappedStatus: RoomStatus = "waiting";
          switch (data.status) {
            case "waiting_players":
              mappedStatus = "waiting";
              break;
            case "pending":
              mappedStatus = "preparing";
              break;
            case "in_progress":
            case "round_winner":
              mappedStatus = "in_progress";
              break;
            case "finished":
              mappedStatus = "locked";
              break;
            default:
              mappedStatus = "waiting";
          }

          // También actualizar el contexto global
          setRoomStatus(mappedStatus);

          return {
            ...prevRoom,
            status: mappedStatus,
          };
        });
      }
    });

    return () => {
      unsubscribeStatusUpdated();
    };
  }, [roomId, setRoomStatus]);

  React.useEffect(() => {
    if (!roomId) return;

    joinRoom(roomId);

    return () => {
      leaveRoom(roomId);
    };
  }, [roomId]);

  React.useEffect(() => {
    if (!roomId) return;

    const unsubscribePrizeUpdated = onRoomPrizeUpdated((data) => {
      if (data.room_id === roomId) {
        setRoom((prevRoom) => {
          if (!prevRoom) return prevRoom;

          return {
            ...prevRoom,
            prizeAmount: data.total_prize,
          };
        });
      }
    });

    return () => {
      unsubscribePrizeUpdated();
    };
  }, [roomId]);

  // ISSUE-4: Escuchar actualizaciones de precio en tiempo real
  React.useEffect(() => {
    if (!roomId) return;

    const unsubscribePriceUpdated = onRoomPriceUpdated((data) => {
      if (data.room_id === roomId) {
        setRoom((prevRoom) => {
          if (!prevRoom) return prevRoom;

          return {
            ...prevRoom,
            ticketPrice: data.price_per_card,
            prizeAmount: data.total_prize,
          };
        });
      }
    });

    return () => {
      unsubscribePriceUpdated();
    };
  }, [roomId]);

  // ISSUE-4: Sincronizar precio al reconectarse a una sala
  React.useEffect(() => {
    if (!roomId) return;

    const unsubscribeStateSync = onRoomStateSync((data) => {
      if (data.room_id === roomId && data.room) {
        setRoom((prevRoom) => {
          if (!prevRoom) return prevRoom;

          return {
            ...prevRoom,
            ticketPrice: data.room?.price_per_card ?? prevRoom.ticketPrice,
            prizeAmount: data.room?.total_prize ?? prevRoom.prizeAmount,
          };
        });
      }
    });

    return () => {
      unsubscribeStateSync();
    };
  }, [roomId]);


  React.useEffect(() => {
    const fetchWallet = async () => {
      const userId = user?.id || getUserId();
      if (!userId || !user) {
        setAvailableBalance(0);
        return;
      }

      try {
        const wallet = await getWalletByUser(userId);
        setAvailableBalance(Math.max(0, wallet.balance || 0));
      } catch {
        setAvailableBalance(0);
      }
    };

    if (user) {
      fetchWallet();
    }
  }, [user]);

  React.useEffect(() => {
    const fetchAvailableCards = async () => {
      if (!roomId) return;

      try {
        setLoadingCards(true);

        const cards = await getAvailableCards(roomId, searchTerm);

        const formattedCards = cards.map((card) => ({
          ...card,
          numbers_json: card.numbers_json.map((row) =>
            row.map((num) => (num === "FREE" ? 0 : num))
          ) as number[][],
        }));

        setAvailableCardsFromDB(formattedCards);
      } catch {
        // Error silencioso
      } finally {
        setLoadingCards(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchAvailableCards();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [roomId, searchTerm]);

  React.useEffect(() => {
    const fetchEnrolledCards = async () => {
      if (!roomId || !user?.id) return;

      try {
        const cards = await getCardsByRoomAndUser(roomId, user.id);
        setEnrolledCards(cards);
      } catch {
        // Error silencioso
      }
    };

    if (user?.id) {
      fetchEnrolledCards();
    }
  }, [roomId, user?.id]);

  const { availableCards, indexMap, cardIdMap, codeMap } = React.useMemo<CardMaps>(() => {
    if (loadingCards || availableCardsFromDB.length === 0) {
      return {
        availableCards: [],
        indexMap: new Map<number, number>(),
        cardIdMap: new Map<number, string>(),
        codeMap: new Map<number, string>(),
      };
    }

    if (enrolledCards.length === 0) {
      const cards: number[][][] = availableCardsFromDB.map((card) => {
        const normalized: number[][] = card.numbers_json.map((row) =>
          row.map((num) => (typeof num === "number" ? num : 0))
        ) as number[][];
        return normalized;
      });
      const map = new Map(cards.map((_, index) => [index, index]));
      const idMap = new Map(
        cards.map((_, index) => [index, availableCardsFromDB[index]._id])
      );
      const codeMap = new Map(
        cards.map((_, index) => [index, availableCardsFromDB[index].code])
      );
      return {
        availableCards: cards,
        indexMap: map,
        cardIdMap: idMap,
        codeMap,
      };
    }

    const enrolledCardIds = new Set(enrolledCards.map((card) => card._id));

    const available: number[][][] = [];
    const map = new Map<number, number>();
    const idMap = new Map<number, string>();
    const codeMap = new Map<number, string>();

    availableCardsFromDB.forEach((card, dbIndex) => {
      const isEnrolled = enrolledCardIds.has(card._id);

      if (!isEnrolled) {
        const newIndex = available.length;
        const normalizedCard: number[][] = (
          card.numbers_json as (number | "FREE")[][]
        ).map((row) => row.map((num) => (typeof num === "number" ? num : 0)));
        available.push(normalizedCard);
        map.set(newIndex, dbIndex);
        idMap.set(newIndex, card._id);
        codeMap.set(newIndex, card.code);
      }
    });

    return {
      availableCards: available,
      indexMap: map,
      cardIdMap: idMap,
      codeMap,
    };
  }, [availableCardsFromDB, enrolledCards, loadingCards]);

  const [selectedCards, setSelectedCards] = React.useState<Set<number>>(
    new Set()
  );

  // Constante para el mínimo de cartones a mostrar
  const MIN_CARDS_TO_DISPLAY = 40;
  const RELOAD_DEBOUNCE_MS = 500;

  // Refs para acceder al estado actual en el listener de WebSocket
  const selectedCardsRef = React.useRef(selectedCards);
  const cardIdMapRef = React.useRef(cardIdMap);
  const codeMapRef = React.useRef(codeMap);
  const searchTermRef = React.useRef(searchTerm);
  const reloadDebounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Mantener las refs actualizadas
  React.useEffect(() => {
    selectedCardsRef.current = selectedCards;
  }, [selectedCards]);

  React.useEffect(() => {
    cardIdMapRef.current = cardIdMap;
  }, [cardIdMap]);

  React.useEffect(() => {
    codeMapRef.current = codeMap;
  }, [codeMap]);

  React.useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  // Función para recargar cartones disponibles (con debounce)
  const reloadAvailableCards = React.useCallback(async () => {
    if (!roomId) return;
    
    // Solo recargar si NO hay búsqueda activa
    const currentSearchTerm = searchTermRef.current;
    if (currentSearchTerm && currentSearchTerm.trim().length > 0) {
      // Si hay búsqueda activa, no recargar automáticamente
      // El usuario verá menos cartones hasta que quite la búsqueda
      return;
    }

    try {
      const newCards = await getAvailableCards(roomId);
      const formattedCards = newCards.map((card) => ({
        ...card,
        numbers_json: card.numbers_json.map((row) =>
          row.map((num) => (num === "FREE" ? 0 : num))
        ) as number[][],
      }));
      
      setAvailableCardsFromDB(formattedCards);
    } catch (error) {
      console.error("Error al recargar cartones disponibles:", error);
    }
  }, [roomId]);

  // Escuchar cuando otros usuarios inscriben cartones
  React.useEffect(() => {
    if (!roomId) return;

    const unsubscribeCardsEnrolled = onCardsEnrolled(async (data) => {
      if (data.room_id === roomId) {
        const enrolledIdsSet = new Set(data.enrolled_card_ids);
        
        // FIX: Obtener el ID del usuario actual
        const currentUserId = user?.id;
        
        // FIX: Si el evento fue generado por el propio usuario, solo actualizar la lista
        // No mostrar mensaje de error porque el usuario ya recibió feedback del API
        const isOwnEnrollment = data.user_id === currentUserId;
        
        if (!isOwnEnrollment) {
          // Solo verificar conflictos si otro usuario inscribió los cartones
          const currentSelectedCards = selectedCardsRef.current;
          const currentCardIdMap = cardIdMapRef.current;
          const currentCodeMap = codeMapRef.current;
          
          const conflictingCards: string[] = [];
          const indicesToRemove: number[] = [];
          
          currentSelectedCards.forEach((index) => {
            const cardId = currentCardIdMap.get(index);
            if (cardId && enrolledIdsSet.has(cardId)) {
              const cardCode = currentCodeMap.get(index) || cardId;
              conflictingCards.push(cardCode);
              indicesToRemove.push(index);
            }
          });
          
          // Si hay cartones en conflicto, notificar al usuario y deseleccionarlos
          if (conflictingCards.length > 0) {
            // Deseleccionar los cartones que ya no están disponibles
            setSelectedCards((prev) => {
              const next = new Set(prev);
              indicesToRemove.forEach((index) => next.delete(index));
              return next;
            });
            
            // Mostrar mensaje de error solo si fue otro usuario
            const message = conflictingCards.length === 1
              ? `El cartón ${conflictingCards[0]} fue inscrito por otro jugador y ha sido removido de tu selección.`
              : `Los cartones ${conflictingCards.join(", ")} fueron inscritos por otros jugadores y han sido removidos de tu selección.`;
            
            setErrorToastMessage(message);
            setShowErrorToast(true);
          }
        }
        
        // Actualizar la lista de cartones disponibles y verificar si necesita recargar
        setAvailableCardsFromDB((prevCards) => {
          const filteredCards = prevCards.filter((card) => !enrolledIdsSet.has(card._id));
          
          // Si quedan menos del mínimo y NO hay búsqueda activa, programar recarga
          const currentSearchTerm = searchTermRef.current;
          const hasNoSearch = !currentSearchTerm || currentSearchTerm.trim().length === 0;
          
          if (filteredCards.length < MIN_CARDS_TO_DISPLAY && hasNoSearch) {
            // Cancelar recarga anterior si existe (debounce)
            if (reloadDebounceRef.current) {
              clearTimeout(reloadDebounceRef.current);
            }
            
            // Programar nueva recarga con debounce
            reloadDebounceRef.current = setTimeout(() => {
              reloadAvailableCards();
              reloadDebounceRef.current = null;
            }, RELOAD_DEBOUNCE_MS);
          }
          
          return filteredCards;
        });
      }
    });

    // Cleanup: cancelar debounce pendiente
    return () => {
      unsubscribeCardsEnrolled();
      if (reloadDebounceRef.current) {
        clearTimeout(reloadDebounceRef.current);
      }
    };
  }, [roomId, user?.id, reloadAvailableCards]);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [previewCardIndex, setPreviewCardIndex] = React.useState<number | null>(
    null
  );
  const [confirmDeselectModalOpen, setConfirmDeselectModalOpen] =
    React.useState(false);

  const handleCardClick = (availableIndex: number) => {
    if (enrolling) return;
    setPreviewCardIndex(availableIndex);
    setModalOpen(true);
  };

  const handleAcceptCard = () => {
    if (enrolling) return;
    if (previewCardIndex !== null) {
      setSelectedCards((prev) => {
        const next = new Set(prev);
        next.add(previewCardIndex);
        return next;
      });
    }
    handleCloseModal();
  };

  const handleRejectCard = () => {
    if (enrolling) return;
    handleCloseModal();
  };

  const handleDeselectClick = () => {
    if (enrolling) return;
    setModalOpen(false);
    setConfirmDeselectModalOpen(true);
  };

  const handleConfirmDeselect = () => {
    if (enrolling) return;
    if (previewCardIndex !== null) {
      setSelectedCards((prev) => {
        const next = new Set(prev);
        next.delete(previewCardIndex);
        return next;
      });
    }
    setConfirmDeselectModalOpen(false);
    handleCloseModal();
  };

  const handleCancelDeselect = () => {
    if (enrolling) return;
    setConfirmDeselectModalOpen(false);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (enrolling) return;
    setModalOpen(false);
    setPreviewCardIndex(null);
  };

  const filteredIndices = React.useMemo(() => {
    return availableCards.map((_, index) => index);
  }, [availableCards]);

  const handlePreviousCard = () => {
    if (previewCardIndex !== null) {
      const currentPosition = filteredIndices.indexOf(previewCardIndex);
      if (currentPosition > 0) {
        setPreviewCardIndex(filteredIndices[currentPosition - 1]);
      }
    }
  };

  const handleNextCard = () => {
    if (previewCardIndex !== null) {
      const currentPosition = filteredIndices.indexOf(previewCardIndex);
      if (currentPosition < filteredIndices.length - 1) {
        setPreviewCardIndex(filteredIndices[currentPosition + 1]);
      }
    }
  };

  const handleEnroll = async () => {
    if (selectedCards.size === 0 || !roomId || !user?.id) return;

    try {
      setEnrolling(true);

      const selectedCardIds = Array.from(selectedCards)
        .map((index) => {
          const dbIndex = indexMap.get(index);
          if (dbIndex !== undefined && availableCardsFromDB[dbIndex]) {
            return availableCardsFromDB[dbIndex]._id;
          }
          return null;
        })
        .filter((id): id is string => id !== null);

      await enrollCards(user.id, roomId, selectedCardIds);

      try {
        const wallet = await getWalletByUser(user.id);
        setAvailableBalance(Math.max(0, wallet.balance || 0));
      } catch {
        // Error silencioso
      }

      const updatedCards = await getCardsByRoomAndUser(roomId, user.id);
      setEnrolledCards(updatedCards);

      const refreshedAvailable = await getAvailableCards(roomId);
      const formattedRefreshed = refreshedAvailable.map((card) => ({
        ...card,
        numbers_json: card.numbers_json.map((row) =>
          row.map((num) => (num === "FREE" ? 0 : num))
        ) as number[][],
      }));
      setAvailableCardsFromDB(formattedRefreshed);

      setSelectedCards(new Set());
      setShowSuccessToast(true);

      setTimeout(() => {
        navigate(`/game/${roomId}`);
      }, 2000);
    } catch (err: unknown) {
      const errorResponse = (err as ErrorResponse)?.response?.data;
      
      let errorMessage = "Error al inscribir cartones. Por favor, intenta nuevamente.";
      
      if (errorResponse?.message) {
        const msg = String(errorResponse.message);
        // ISSUE-1 FIX: Detectar error de saldo insuficiente y mostrar mensaje claro
        if (msg.toLowerCase().includes("saldo insuficiente") || msg.toLowerCase().includes("insufficient")) {
          errorMessage = `${msg}. Puedes recargar saldo desde tu perfil o billetera.`;
        } else if (msg.includes("Network Error") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
          errorMessage = "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.";
        } else {
          // Mostrar el mensaje del backend directamente
          errorMessage = msg;
        }
      } else if (err instanceof Error) {
        const msg = err.message;
        if (msg.toLowerCase().includes("saldo insuficiente") || msg.toLowerCase().includes("insufficient")) {
          errorMessage = `${msg}. Puedes recargar saldo desde tu perfil o billetera.`;
        } else if (msg.includes("Network Error") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
          errorMessage = "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.";
        } else {
          errorMessage = msg;
        }
      }

      let finalErrorMessage = errorMessage;
      if (
        errorResponse?.duplicateCards &&
        Array.isArray(errorResponse.duplicateCards) &&
        errorResponse.duplicateCards.length > 0
      ) {
        const duplicateCodes = errorResponse.duplicateCards.join(", ");
        finalErrorMessage = `Los siguientes cartones ya están inscritos: ${duplicateCodes}. Por favor, selecciona otros cartones o continúa con los cartones restantes.`;
      }

      if (errorResponse?.success === false && errorResponse?.duplicateCards) {
        try {
          const refreshedAvailable = await getAvailableCards(roomId!);
          const formattedRefreshed = refreshedAvailable.map((card) => ({
            ...card,
            numbers_json: card.numbers_json.map((row) =>
              row.map((num) => (num === "FREE" ? 0 : num))
            ) as number[][],
          }));
          setAvailableCardsFromDB(formattedRefreshed);

          if (
            errorResponse.duplicateCards &&
            Array.isArray(errorResponse.duplicateCards)
          ) {
            const duplicateCodes = errorResponse.duplicateCards;
            const newSelectedCards = new Set(selectedCards);

            availableCardsFromDB.forEach((card, index) => {
              if (duplicateCodes.includes(card.code)) {
                const cardIndex = Array.from(selectedCards).find((selIndex) => {
                  const dbIdx = indexMap.get(selIndex);
                  return dbIdx === index;
                });
                if (cardIndex !== undefined) {
                  newSelectedCards.delete(cardIndex);
                }
              }
            });

            setSelectedCards(newSelectedCards);
          }
        } catch {
          // Error silencioso
        }
      }

      setErrorToastMessage(finalErrorMessage);
      setShowErrorToast(true);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <Box sx={roomDetailStyles.loadingContainer}>
        <BackgroundStars />
        <CircularProgress
          sx={{ color: "#d4af37", position: "relative", zIndex: 1 }}
        />
      </Box>
    );
  }

  if (error || !room) {
    return (
      <Box sx={roomDetailStyles.errorContainer}>
        <BackgroundStars />
        <Container maxWidth="sm" sx={roomDetailStyles.container}>
          <Alert severity="error" sx={roomDetailStyles.errorAlert}>
            {error || "Sala no encontrada"}
          </Alert>
        </Container>
      </Box>
    );
  }

  const totalPrice = selectedCards.size * room.ticketPrice;

  return (
    <Box sx={roomDetailStyles.pageContainer}>
      <BackgroundStars />

      <Container maxWidth="sm" sx={roomDetailStyles.container}>
        {enrolling && (
          <Box sx={roomDetailStyles.enrollingOverlay}>
            <Box sx={roomDetailStyles.enrollingModal}>
              <CircularProgress size={60} sx={roomDetailStyles.enrollingProgress} />
              <Typography variant="h6" sx={roomDetailStyles.enrollingTitle}>
                Procesando inscripción...
              </Typography>
              <Typography variant="body2" sx={roomDetailStyles.enrollingSubtitle}>
                Por favor espera, no cierres esta página
              </Typography>
            </Box>
          </Box>
        )}
        
        {room && (
          <Box sx={roomDetailStyles.roomTitleBar}>
            <Typography variant="h4" sx={roomDetailStyles.roomTitleText}>
              {room.title}
            </Typography>
          </Box>
        )}

        <Stack spacing={3.5} marginTop={"3rem"}>
          <Box sx={roomDetailStyles.titleContainer}>
            <Box sx={roomDetailStyles.titleBox}>
              <Typography sx={roomDetailStyles.titleText}>
                Selecciona
              </Typography>
              <Typography sx={roomDetailStyles.subtitleText}>
                Tus Cartones
              </Typography>
            </Box>
          </Box>

          <Box>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              numbersOnly={true}
              placeholder="Buscar por código de cartón (ej: 19, 0019, 0419...)"
              disabled={enrolling}
            />
          </Box>

          <Box>
            <Typography variant="body2" sx={roomDetailStyles.priceText}>
              Precio por cartón: {room?.ticketPrice.toFixed(2)} {room?.currency}
            </Typography>
          </Box>

          {filteredIndices.length === 0 ? (
            <Box sx={roomDetailStyles.emptyState}>
              <Typography variant="body1" sx={roomDetailStyles.emptyStateText}>
                No se encontraron cartones con el número "{searchTerm}"
              </Typography>
            </Box>
          ) : (
            <Box sx={roomDetailStyles.cardsContainer}>
              <Box sx={roomDetailStyles.cardsGrid}>
                {filteredIndices.map((availableIndex) => {
                  const cardId =
                    cardIdMap.get(availableIndex) ??
                    `${availableIndex + 1}`;
                  const cardCode =
                    codeMap.get(availableIndex) ??
                    `${availableIndex + 1}`;
                  return (
                    <CardMiniature
                      key={cardId}
                      grid={availableCards[availableIndex]}
                      cardCode={cardCode}
                      selected={selectedCards.has(availableIndex)}
                      onClick={enrolling ? undefined : () => handleCardClick(availableIndex)}
                      status={enrolling ? "occupied" : "free"}
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </Stack>

        <EnrollmentSummary
          selectedCount={selectedCards.size}
          totalPrice={totalPrice}
          availableBalance={availableBalance}
          currency={room.currency}
        />
        <Box sx={roomDetailStyles.buttonContainer}>
          <MetallicButton
            fullWidth
            variant="gold"
            onClick={handleEnroll}
            disabled={selectedCards.size === 0 || enrolling}
            startIcon={enrolling ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : undefined}
          >
            {enrolling ? "Inscribiendo..." : "Inscribirse"}
          </MetallicButton>
        </Box>

        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
          }}
          sx={roomDetailStyles.termsLink}
        >
          Términos y Condiciones
        </Link>
      </Container>

      {previewCardIndex !== null && (
        <GlassDialog
          open={modalOpen && !enrolling}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
        >
          <CardSelectionPreview
            card={availableCards[previewCardIndex]}
            cardCode={codeMap.get(previewCardIndex) ?? ""}
            isSelected={selectedCards.has(previewCardIndex)}
            onAccept={handleAcceptCard}
            onReject={handleRejectCard}
            onDeselect={handleDeselectClick}
            onPrevious={handlePreviousCard}
            onNext={handleNextCard}
            hasPrevious={filteredIndices.indexOf(previewCardIndex) > 0}
            hasNext={
              filteredIndices.indexOf(previewCardIndex) <
              filteredIndices.length - 1
            }
          />
        </GlassDialog>
      )}

      <ConfirmDeselectDialog
        open={confirmDeselectModalOpen && !enrolling}
        onClose={handleCancelDeselect}
        onConfirm={handleConfirmDeselect}
      />

      {showSuccessToast && (
        <SuccessToast
          message="¡Cartones comprados exitosamente! 🎉"
          subMessage="Estás listo para jugar"
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      {showErrorToast && (
        <ErrorToast
          message={errorToastMessage}
          onClose={() => {
            setShowErrorToast(false);
            setErrorToastMessage("");
          }}
        />
      )}
    </Box>
  );
}
