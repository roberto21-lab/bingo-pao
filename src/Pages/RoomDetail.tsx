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
import SelectableCard from "../Componets/SelectableCard";
import { type BackendRoom, mapStatus } from "../Services/rooms.service";
import { api } from "../Services/api";
import BackgroundStars from "../Componets/BackgroundStars";
import { getCardsByRoomAndUser, enrollCards, getAvailableCards, type BackendCard } from "../Services/cards.service";
import { useAuth } from "../hooks/useAuth";
import { onRoomStatusUpdated } from "../Services/socket.service";
import { StatusBadge } from "../Componets/shared/StatusBadge";
import { SearchBar } from "../Componets/shared/SearchBar";
import { GlassDialog } from "../Componets/shared/GlassDialog";
import { CardSelectionPreview } from "../Componets/shared/CardSelectionPreview";
import { ConfirmDeselectDialog } from "../Componets/shared/ConfirmDeselectDialog";
import { EnrollmentSummary } from "../Componets/shared/EnrollmentSummary";
import { MetallicButton } from "../Componets/shared/MetallicButton";
import SuccessToast from "../Componets/SuccessToast";
import ErrorToast from "../Componets/ErrorToast";
import { getWalletByUser } from "../Services/wallets.service";
import { getUserId } from "../Services/auth.service";

type RoomDetailData = {
  id: string;
  title: string;
  prizeAmount: number;
  currency: string;
  ticketsToStart: number;
  ticketPrice: number;
  status: string;
};

export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = React.useState<RoomDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [enrolledCards, setEnrolledCards] = React.useState<BackendCard[]>([]);
  const [enrolling, setEnrolling] = React.useState(false);
  const [availableCardsFromDB, setAvailableCardsFromDB] = React.useState<BackendCard[]>([]);
  const [loadingCards, setLoadingCards] = React.useState(true);
  const [showSuccessToast, setShowSuccessToast] = React.useState(false);
  const [showErrorToast, setShowErrorToast] = React.useState(false);
  const [errorToastMessage, setErrorToastMessage] = React.useState<string>("");
  const [availableBalance, setAvailableBalance] = React.useState<number>(0);
  const [walletLoading, setWalletLoading] = React.useState(false);

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
        
        // Obtener datos completos del backend
        // El backend devuelve un objeto directo, no envuelto en { success, data }
        const response = await api.get<BackendRoom>(`/rooms/${roomId}`);
        
        if (!response.data) {
          throw new Error("Sala no encontrada");
        }
        
        const backendRoom = response.data;
        
        // Función para parsear Decimal128
        const parseDecimal = (decimal: unknown): number => {
          if (!decimal) return 0;
          if (typeof decimal === "string") return parseFloat(decimal) || 0;
          if (typeof decimal === "object" && decimal !== null && "$numberDecimal" in decimal) {
            return parseFloat(String(decimal.$numberDecimal)) || 0;
          }
          return typeof decimal === "number" ? decimal : 0;
        };
        
        const currency = typeof backendRoom.currency_id === "object" && backendRoom.currency_id
          ? backendRoom.currency_id
          : null;
        
        // Obtener el status
        const status = typeof backendRoom.status_id === "object" && backendRoom.status_id
          ? backendRoom.status_id.name || "waiting_players"
          : typeof backendRoom.status_id === "string"
          ? backendRoom.status_id
          : "waiting_players";
        
        // CRÍTICO: Usar la función de mapeo unificada de rooms.service
        // Esto asegura que todas las páginas muestren el mismo status
        const mappedStatus = mapStatus(status);
        
        const roomData: RoomDetailData = {
          id: backendRoom._id || backendRoom.id || "",
          title: backendRoom.name,
          prizeAmount: parseDecimal(backendRoom.total_pot),
          // Normalizar VES a Bs usando función helper
          currency: (() => {
            const code = currency?.code || "Bs";
            const normalized = code.toLowerCase().trim();
            return normalized === "ves" ? "Bs" : code;
          })(),
          ticketsToStart: backendRoom.min_players || 10,
          ticketPrice: parseDecimal(backendRoom.price_per_card),
          status: mappedStatus || "waiting", // Siempre tener un status por defecto
        };
        
        console.log("Room data loaded:", roomData);
        setRoom(roomData);
      } catch (err: unknown) {
        console.error("Error al cargar la sala:", err);
        const errorMessage = err instanceof Error ? err.message : "Error al cargar la sala. Por favor, intenta nuevamente.";
        const responseMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(responseMessage || errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);
  
  // Escuchar actualizaciones de status de sala en tiempo real
  React.useEffect(() => {
    if (!roomId) return;
    
    const unsubscribeStatusUpdated = onRoomStatusUpdated((data) => {
      if (data.room_id === roomId) {
        console.log(`[RoomDetail] Status actualizado para sala ${data.room_name}: ${data.status}`);
        // Actualizar el status localmente
        setRoom((prevRoom) => {
          if (!prevRoom) return prevRoom;
          
          // Mapear el status del backend al formato del frontend
          let mappedStatus: "waiting" | "preparing" | "in_progress" | "locked" = "waiting";
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
  }, [roomId]);

  // Cargar wallet del usuario para obtener el saldo disponible
  React.useEffect(() => {
    const fetchWallet = async () => {
      const userId = user?.id || getUserId();
      if (!userId || !user) {
        setAvailableBalance(0);
        return;
      }

      try {
        setWalletLoading(true);
        const wallet = await getWalletByUser(userId);
        // El balance ya está reducido por retiros pendientes en el backend
        // El balance disponible es simplemente el balance (ya incluye la reducción de retiros pendientes)
        setAvailableBalance(Math.max(0, wallet.balance || 0));
      } catch (error) {
        console.error("Error al cargar wallet:", error);
        // Si no hay wallet, mantener valor en 0
        setAvailableBalance(0);
      } finally {
        setWalletLoading(false);
      }
    };

    if (user) {
      fetchWallet();
    }
  }, [user]);
  
  // Obtener cartones disponibles del backend y generar si no existen
  React.useEffect(() => {
    const fetchAvailableCards = async () => {
      if (!roomId) return;

      try {
        setLoadingCards(true);
        
        // Obtener cartones disponibles (el backend devuelve máximo 40)
        const cards = await getAvailableCards(roomId);
        
        // Convertir los números del backend ("FREE") al formato del frontend (0)
        const formattedCards = cards.map(card => ({
          ...card,
          numbers_json: card.numbers_json.map(row => 
            row.map(num => num === "FREE" ? 0 : num)
          ) as number[][]
        }));

        setAvailableCardsFromDB(formattedCards);
      } catch (err) {
        console.error("Error al obtener cartones disponibles:", err);
      } finally {
        setLoadingCards(false);
      }
    };

    fetchAvailableCards();
  }, [roomId]);

  // Obtener cartones ya inscritos del usuario en esta sala
  React.useEffect(() => {
    const fetchEnrolledCards = async () => {
      if (!roomId || !user?.id) return;

      try {
        const cards = await getCardsByRoomAndUser(roomId, user.id);
        setEnrolledCards(cards);
      } catch (err) {
        console.error("Error al obtener cartones inscritos:", err);
      }
    };

    if (user?.id) {
      fetchEnrolledCards();
    }
  }, [roomId, user?.id]);


  // Filtrar cartones disponibles que no estén inscritos por el usuario
  // Los cartones disponibles vienen del backend (user_id = null)
  // Solo necesitamos filtrar los que el usuario ya inscribió
  const { availableCards, indexMap, cardIdMap, codeMap } = React.useMemo<{
    availableCards: number[][][];
    indexMap: Map<number, number>;
    cardIdMap: Map<number, string>;
    codeMap: Map<number, string>;
  }>(() => {
    if (loadingCards || availableCardsFromDB.length === 0) {
      return { 
        availableCards: [], 
        indexMap: new Map<number, number>(),
        cardIdMap: new Map<number, string>(),
        codeMap: new Map<number, string>()
      };
    }

    // Si el usuario no tiene cartones inscritos, todos los disponibles están disponibles
    if (enrolledCards.length === 0) {
      const cards: number[][][] = availableCardsFromDB.map(card => {
        const normalized: number[][] = card.numbers_json.map(row => 
          row.map(num => typeof num === 'number' ? num : 0)
        ) as number[][];
        return normalized;
      });
      const map = new Map(cards.map((_, index) => [index, index]));
      const idMap = new Map(cards.map((_, index) => [index, availableCardsFromDB[index]._id]));
      const codeMap = new Map(cards.map((_, index) => [index, availableCardsFromDB[index].code]));
      return { availableCards: cards, indexMap: map, cardIdMap: idMap, codeMap };
    }

    // Filtrar los cartones que el usuario ya inscribió
    // Ahora comparamos por ID en lugar de por números, ya que los cartones son independientes
    const enrolledCardIds = new Set(enrolledCards.map(card => card._id));
    
    const available: number[][][] = [];
    const map = new Map<number, number>(); // Mapeo: índice en availableCards -> índice en availableCardsFromDB
    const idMap = new Map<number, string>(); // Mapeo: índice en availableCards -> ID del cartón
    const codeMap = new Map<number, string>(); // Mapeo: índice en availableCards -> código del cartón

    availableCardsFromDB.forEach((card, dbIndex) => {
      // Los números ya están convertidos (FREE -> 0) en el useEffect que carga los cartones
      // Verificar si este cartón ya está inscrito por el usuario (por ID)
      const isEnrolled = enrolledCardIds.has(card._id);

      if (!isEnrolled) {
        const newIndex = available.length;
        // Asegurar que es number[][]
        const normalizedCard: number[][] = (card.numbers_json as (number | "FREE")[][]).map(row => 
          row.map(num => typeof num === 'number' ? num : 0)
        );
        available.push(normalizedCard);
        map.set(newIndex, dbIndex);
        idMap.set(newIndex, card._id);
        codeMap.set(newIndex, card.code);
      }
    });

    return { availableCards: available, indexMap: map, cardIdMap: idMap, codeMap };
  }, [availableCardsFromDB, enrolledCards, loadingCards]);
  
  const [selectedCards, setSelectedCards] = React.useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = React.useState(false);
  const [previewCardIndex, setPreviewCardIndex] = React.useState<number | null>(null);
  const [confirmDeselectModalOpen, setConfirmDeselectModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  const handleCardClick = (availableIndex: number) => {
    // previewCardIndex ahora es el índice dentro de availableCards
    setPreviewCardIndex(availableIndex);
    setModalOpen(true);
  };

  const handleAcceptCard = () => {
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
    handleCloseModal();
  };

  const handleDeselectClick = () => {
    // Cerrar el modal de vista y abrir el modal de confirmación
    setModalOpen(false);
    setConfirmDeselectModalOpen(true);
  };

  const handleConfirmDeselect = () => {
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
    setConfirmDeselectModalOpen(false);
    // Volver a abrir el modal de vista del cartón
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setPreviewCardIndex(null);
  };

  // Calcular índices filtrados para navegación (usando availableCards)
  const filteredIndices = React.useMemo(() => {
    return searchTerm
      ? availableCards
          .map((_, index) => index)
          .filter((index) => {
            const cardCode = codeMap.get(index) ?? "";
            return cardCode.toLowerCase().includes(searchTerm.trim().toLowerCase());
          })
      : availableCards.map((_, index) => index);
  }, [searchTerm, availableCards, codeMap]);

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
      
      // Obtener los IDs de los cartones seleccionados
      const selectedCardIds = Array.from(selectedCards).map(index => {
        const dbIndex = indexMap.get(index);
        if (dbIndex !== undefined && availableCardsFromDB[dbIndex]) {
          return availableCardsFromDB[dbIndex]._id;
        }
        return null;
      }).filter((id): id is string => id !== null);
      
      // Inscribir los cartones en el backend usando sus IDs
      const result = await enrollCards(user.id, roomId, selectedCardIds);
      
      console.log("Cartones inscritos:", result);
      
      // Actualizar el balance disponible después de la compra
      try {
        const wallet = await getWalletByUser(user.id);
        setAvailableBalance(Math.max(0, wallet.balance || 0));
      } catch (error) {
        console.error("Error al actualizar balance:", error);
      }
      
      // Actualizar la lista de cartones inscritos
      const updatedCards = await getCardsByRoomAndUser(roomId, user.id);
      setEnrolledCards(updatedCards);
      
      // Refrescar cartones disponibles (los inscritos ya no estarán disponibles)
      const refreshedAvailable = await getAvailableCards(roomId);
      const formattedRefreshed = refreshedAvailable.map(card => ({
        ...card,
        numbers_json: card.numbers_json.map(row => 
          row.map(num => num === "FREE" ? 0 : num)
        ) as number[][]
      }));
      setAvailableCardsFromDB(formattedRefreshed);
      
      // Limpiar selección
      setSelectedCards(new Set());
      
      // Mostrar toaster de éxito
      setShowSuccessToast(true);
      
      // Navegar al juego después de un breve delay para que se vea el toaster
      setTimeout(() => {
    navigate(`/game/${roomId}`);
      }, 2000);
    } catch (err: unknown) {
      console.error("Error al inscribir cartones:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al inscribir cartones. Por favor, intenta nuevamente.";
      const responseMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const finalErrorMessage = responseMessage || errorMessage;
      
      // Mostrar toaster de error en lugar de redirigir
      setErrorToastMessage(finalErrorMessage);
      setShowErrorToast(true);
    } finally {
      setEnrolling(false);
    }
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
          position: "relative",
          overflow: "hidden",
        }}
      >
        <BackgroundStars />
        <CircularProgress sx={{ color: "#d4af37", position: "relative", zIndex: 1 }} />
      </Box>
    );
  }

  // Error state
  if (error || !room) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#1a1008",
          color: "#f5e6d3",
          paddingBottom: "80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <BackgroundStars />
        <Container maxWidth="sm" sx={{ py: 4, position: "relative", zIndex: 1 }}>
          <Alert 
            severity="error" 
            sx={{ 
              backgroundColor: "rgba(201, 168, 90, 0.2)", 
              color: "#c9a85a", 
              border: "1px solid rgba(201, 168, 90, 0.4)",
            }}
          >
            {error || "Sala no encontrada"}
          </Alert>
        </Container>
      </Box>
    );
  }

  const totalPrice = selectedCards.size * room.ticketPrice;

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#1a1008", // Fondo de madera oscura
        color: "#f5e6d3", // Texto crema
        paddingBottom: "80px",
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

      <Container maxWidth="sm" sx={{ py: 4, position: "relative", zIndex: 1 }}>
        {/* Nombre de la sala - Barra que sale del borde izquierdo */}
        {room && (
          <Box 
            sx={{ 
              position: "absolute",
              left: 0,
              top: 32,
              display: "inline-flex",
              alignItems: "center",
              px: 2,
              py: 1,
              borderTopRightRadius: "8px",
              borderBottomRightRadius: "8px",
              background: "linear-gradient(135deg, rgba(212, 175, 55, 0.9) 0%, rgba(244, 208, 63, 1) 50%, rgba(212, 175, 55, 0.9) 100%)",
              border: "1.5px solid rgba(212, 175, 55, 1)",
              borderLeft: "none",
              boxShadow: "0 2px 8px rgba(212, 175, 55, 0.5)",
              zIndex: 2,
            }}
          >
        <Typography
          variant="h4"
          sx={{
                fontSize: { xs: "22px", sm: "26px" },
            fontWeight: 700,
                color: "#1a1008",
            fontFamily: "'Montserrat', sans-serif",
                letterSpacing: "0.5px",
          }}
        >
              {room.title}
        </Typography>
          </Box>
        )}

        <Stack spacing={3.5} marginTop={"5rem"}>

          {/* Título principal con badge de status */}
          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                lineHeight: 1.2,
              }}
            >
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "'Montserrat', sans-serif",
                  textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                  letterSpacing: "0.5px",
                  lineHeight: 1.2,
                }}
              >
                Selecciona
              </Typography>
              <Typography
                sx={{
                  fontSize: "20px",
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "'Montserrat', sans-serif",
                  textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                  letterSpacing: "0.5px",
                  lineHeight: 1.2,
                }}
              >
                Tus Cartones
              </Typography>
            </Box>
            
            {/* Badge de status - Esquina superior derecha */}
            {room && (
              <StatusBadge
                status={room.status as "waiting" | "preparing" | "in_progress" | "locked" | "finished"}
                position="absolute"
                top={0}
                right={0}
              />
            )}
          </Box>

          {/* Barra de búsqueda por número serial */}
          <Box>
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </Box>

          {/* Indicador Libre / Ocupado */}
          <Box>
        <Typography
          variant="body2"
              sx={{
                color: "#f5e6d3",
                opacity: 0.85,
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Precio por cartón: {room?.ticketPrice.toFixed(2)} {room?.currency}
            </Typography>
          </Box>

          {/* Filtrar cartones basado en la búsqueda */}
          {(() => {

            const filteredFirstRow = filteredIndices.filter((idx) => idx < 15);
            const filteredSecondRow = filteredIndices.filter((idx) => idx >= 15 && idx < 30);
            const filteredThirdRow = filteredIndices.filter((idx) => idx >= 30);

            return (
              <>
                {filteredIndices.length === 0 ? (
                  <Box
          sx={{
            textAlign: "center",
                      py: 4,
                      px: 2,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: "#f5e6d3",
            opacity: 0.7,
          }}
        >
                      No se encontraron cartones con el número "{searchTerm}"
        </Typography>
                  </Box>
                ) : (
        <Box
          sx={{
            overflowX: "auto",
            overflowY: "hidden",
            mb: 4,
            scrollSnapType: "x proximity",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(227, 191, 112, 0.3) transparent",
            "&::-webkit-scrollbar": {
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(227, 191, 112, 0.3)",
              borderRadius: "10px",
              "&:hover": {
                background: "rgba(227, 191, 112, 0.5)",
              },
            },
          }}
        >
          <Stack spacing={3} sx={{ display: "inline-block", minWidth: "100%" }}>
            {filteredFirstRow.length > 0 && (
            <Box
              sx={{
                display: "flex",
                gap: 2,
                width: "max-content",
                "& > *": {
                  minWidth: "calc((100vw - 96px) / 3.5)", 
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                },
              }}
            >
                {filteredFirstRow.map((availableIndex) => {
                  const cardId = cardIdMap.get(availableIndex) ?? `${availableIndex + 1}`;
                  const cardCode = codeMap.get(availableIndex) ?? `${availableIndex + 1}`;
                  return (
                <SelectableCard
                      key={cardId}
                      grid={availableCards[availableIndex]}
                      cardCode={cardCode}
                      selected={selectedCards.has(availableIndex)}
                      onClick={() => handleCardClick(availableIndex)}
                  status="free"
                />
                  );
                })}
            </Box>
            )}

            {filteredSecondRow.length > 0 && (
            <Box
              sx={{
                display: "flex",
                gap: 2,
                width: "max-content",
                "& > *": {
                  minWidth: "calc((100vw - 96px) / 3.5)", 
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                },
              }}
            >
                {filteredSecondRow.map((availableIndex) => {
                  const cardId = cardIdMap.get(availableIndex) ?? `${availableIndex + 1}`;
                  const cardCode = codeMap.get(availableIndex) ?? `${availableIndex + 1}`;
                return (
                  <SelectableCard
                      key={cardId}
                      grid={availableCards[availableIndex]}
                      cardCode={cardCode}
                      selected={selectedCards.has(availableIndex)}
                      onClick={() => handleCardClick(availableIndex)}
                    status="free"
                  />
                );
              })}
            </Box>
            )}

            {filteredThirdRow.length > 0 && (
            <Box
              sx={{
                display: "flex",
                gap: 2,
                width: "max-content",
                "& > *": {
                  minWidth: "calc((100vw - 96px) / 3.5)", 
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                },
              }}
            >
                {filteredThirdRow.map((availableIndex) => {
                  const cardId = cardIdMap.get(availableIndex) ?? `${availableIndex + 1}`;
                  const cardCode = codeMap.get(availableIndex) ?? `${availableIndex + 1}`;
                return (
                  <SelectableCard
                      key={cardId}
                      grid={availableCards[availableIndex]}
                      cardCode={cardCode}
                      selected={selectedCards.has(availableIndex)}
                      onClick={() => handleCardClick(availableIndex)}
                    status="free"
                  />
                );
              })}
            </Box>
            )}
          </Stack>
        </Box>
              )}
            </>
          );
        })()}
        </Stack>

        {/* Contenedor de información y botón de inscribirse */}
        <EnrollmentSummary
          selectedCount={selectedCards.size}
          totalPrice={totalPrice}
          availableBalance={availableBalance}
          currency={room.currency}
        />
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <MetallicButton
            fullWidth
            variant="gold"
            onClick={handleEnroll}
            disabled={selectedCards.size === 0 || enrolling}
          >
            Inscribirse
          </MetallicButton>
        </Box>

        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
          }}
          sx={{
            display: "block",
            textAlign: "center",
            color: "#e3bf70",
            fontSize: "12px",
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          Términos y Condiciones
        </Link>
      </Container>

      {/* Modal de preview del cartón */}
      {previewCardIndex !== null && (
        <GlassDialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
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
            hasNext={filteredIndices.indexOf(previewCardIndex) < filteredIndices.length - 1}
          />
        </GlassDialog>
      )}

      {/* Modal de confirmación para deseleccionar */}
      <ConfirmDeselectDialog
        open={confirmDeselectModalOpen}
        onClose={handleCancelDeselect}
        onConfirm={handleConfirmDeselect}
      />

      {/* Toast de éxito cuando se completan los cartones */}
      {showSuccessToast && (
        <SuccessToast
          message="¡Cartones comprados exitosamente! 🎉"
          subMessage="Estás listo para jugar"
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      {/* Toast de error cuando hay problemas al inscribir cartones */}
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
