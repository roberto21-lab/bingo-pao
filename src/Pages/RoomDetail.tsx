// src/Pages/RoomDetail.tsx
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Link,
} from "@mui/material";
import * as React from "react";
import { useParams } from "react-router-dom";
import SelectableCard from "../Componets/SelectableCard";
import { generateCards } from "../utils/bingo";

type Room = {
  id: string;
  title: string;
  prizeAmount: number;
  currency: string;
  ticketsToStart: number;
  ticketPrice: number;
};

const MOCK_ROOMS: Room[] = [
  { id: "cosmo-cash", title: "Cosmo Cash", prizeAmount: 500, currency: "USD", ticketsToStart: 112, ticketPrice: 5.0 },
  { id: "golden-galaxy", title: "Golden Galaxy", prizeAmount: 200, currency: "USD", ticketsToStart: 400, ticketPrice: 10.0 },
  { id: "lucky-star", title: "Lucky Star Bingo", prizeAmount: 200, currency: "USD", ticketsToStart: 400, ticketPrice: 10.0 },
  { id: "sala-1", title: "Sala Principal", prizeAmount: 10000, currency: "Bs", ticketsToStart: 112, ticketPrice: 100 },
  { id: "sala-2", title: "Sala Nocturna", prizeAmount: 5400, currency: "USD", ticketsToStart: 400, ticketPrice: 10 },
];


export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();

  const room = React.useMemo(() => MOCK_ROOMS.find((r) => r.id === roomId), [roomId]);
  
  // Generar más cartones para los sliders (16 cartones, 8 por slider)
  // Usar la función de bingo.ts que genera cartones 5x5 válidos
  const allCards = React.useMemo(() => generateCards(16), []);
  
  // Dividir cartones en 2 grupos para los 2 sliders
  const firstRowCards = allCards.slice(0, 8);
  const secondRowCards = allCards.slice(8, 16);
  
  const [selectedCards, setSelectedCards] = React.useState<Set<number>>(new Set());
  const [availableBalance] = React.useState(1250.75);

  const toggleCard = (index: number) => {
    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleRandom = () => {
    // Seleccionar 2 cartones aleatorios de todos los disponibles
    const randomIndices = Array.from({ length: allCards.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    setSelectedCards(new Set(randomIndices));
  };

  const handleFavoriteNumbers = () => {
    // TODO: Implementar lógica de números favoritos
    console.log("Mis números favoritos");
  };

  const handleEnroll = () => {
    if (selectedCards.size === 0) return;
    const totalPrice = selectedCards.size * (room?.ticketPrice || 0);
    console.log("Inscribirse con cartones:", Array.from(selectedCards), "Total:", totalPrice);
    // TODO: Navegar a confirmación o procesar inscripción
  };

  if (!room) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h6" sx={{ color: "#ffffff" }}>
          Sala no encontrada
        </Typography>
      </Container>
    );
  }

  const totalPrice = selectedCards.size * room.ticketPrice;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#1a1d2e",
        color: "#ffffff",
        paddingBottom: "80px",
      }}
    >
      <Container maxWidth="sm" sx={{ py: 4 }}>
        {/* Título */}
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            fontSize: { xs: "24px", sm: "28px" },
            fontWeight: 700,
            color: "#ffffff",
            mb: 3,
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Selecciona Tus Cartones
        </Typography>

        {/* Botones de acción */}
        <Stack direction="row" spacing={1.5} sx={{ mb: 2, justifyContent: "center" }}>
          <Button
            onClick={handleRandom}
            sx={{
              background: "linear-gradient(135deg, rgba(201, 168, 90, 0.8) 0%, rgba(227, 191, 112, 0.9) 50%, rgba(240, 208, 138, 0.8) 100%)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "#0f0f1e",
              fontWeight: 600,
              fontSize: "14px",
              py: 1,
              px: 2,
              borderRadius: "12px",
              textTransform: "none",
              border: "1px solid rgba(227, 191, 112, 0.3)",
              boxShadow: "0 4px 12px rgba(227, 191, 112, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, rgba(212, 179, 102, 0.9) 0%, rgba(236, 200, 130, 1) 50%, rgba(245, 217, 154, 0.9) 100%)",
                boxShadow: "0 6px 16px rgba(227, 191, 112, 0.4)",
              },
            }}
          >
            Aleatorio
          </Button>
          <Button
            onClick={handleFavoriteNumbers}
            sx={{
              background: "linear-gradient(135deg, rgba(201, 168, 90, 0.8) 0%, rgba(227, 191, 112, 0.9) 50%, rgba(240, 208, 138, 0.8) 100%)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "#0f0f1e",
              fontWeight: 600,
              fontSize: "14px",
              py: 1,
              px: 2,
              borderRadius: "12px",
              textTransform: "none",
              border: "1px solid rgba(227, 191, 112, 0.3)",
              boxShadow: "0 4px 12px rgba(227, 191, 112, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, rgba(212, 179, 102, 0.9) 0%, rgba(236, 200, 130, 1) 50%, rgba(245, 217, 154, 0.9) 100%)",
                boxShadow: "0 6px 16px rgba(227, 191, 112, 0.4)",
              },
            }}
          >
            Mis Números Favoritos
          </Button>
        </Stack>

        {/* Label Libre / Ocupado */}
        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            color: "#ffffff",
            opacity: 0.7,
            fontSize: "12px",
            mb: 2,
          }}
        >
          Libre / Ocupado
        </Typography>

        {/* Sliders de cartones */}
        <Stack spacing={3} sx={{ mb: 4 }}>
          {/* Primer slider */}
          <Box>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                overflowX: "auto",
                overflowY: "hidden",
                pb: 1,
                scrollSnapType: "x proximity",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(227, 191, 112, 0.3) transparent",
                "&::-webkit-scrollbar": {
                  height: "6px",
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
                // Mostrar 3.5 cartones a la vez
                // Ancho aproximado: (100vw del contenedor - padding) / 3.5
                "& > *": {
                  minWidth: "calc((100% - 32px) / 3.5)", // 32px = 2 gaps de 16px
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                },
              }}
            >
              {firstRowCards.map((card, index) => (
                <SelectableCard
                  key={index}
                  grid={card}
                  cardId={index + 1}
                  selected={selectedCards.has(index)}
                  onClick={() => toggleCard(index)}
                  status="free"
                />
              ))}
            </Box>
          </Box>

          {/* Segundo slider */}
          <Box>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                overflowX: "auto",
                overflowY: "hidden",
                pb: 1,
                scrollSnapType: "x proximity",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(227, 191, 112, 0.3) transparent",
                "&::-webkit-scrollbar": {
                  height: "6px",
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
                // Mostrar 3.5 cartones a la vez
                // Ancho aproximado: (100vw del contenedor - padding) / 3.5
                "& > *": {
                  minWidth: "calc((100% - 32px) / 3.5)", // 32px = 2 gaps de 16px
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                },
              }}
            >
              {secondRowCards.map((card, index) => {
                const globalIndex = index + 8;
                return (
                  <SelectableCard
                    key={globalIndex}
                    grid={card}
                    cardId={globalIndex + 1}
                    selected={selectedCards.has(globalIndex)}
                    onClick={() => toggleCard(globalIndex)}
                    status="free"
                  />
                );
              })}
            </Box>
          </Box>
        </Stack>

        {/* Resumen */}
        <Box
          sx={{
            background: "rgba(31, 34, 51, 0.5)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            p: 2.5,
            mb: 3,
          }}
        >
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#ffffff", opacity: 0.8 }}>
                Cartones Seleccionados:
              </Typography>
              <Typography variant="body2" sx={{ color: "#ffffff", fontWeight: 600 }}>
                {selectedCards.size}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#ffffff", opacity: 0.8 }}>
                Precio Total:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#ffffff", fontWeight: 700, fontSize: "16px" }}
                >
                  ${totalPrice.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#ffffff", opacity: 0.8 }}>
                  USD
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#ffffff", opacity: 0.8 }}>
                Saldo Disponible:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#ffffff", fontWeight: 700, fontSize: "16px" }}
                >
                  ${availableBalance.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#ffffff", opacity: 0.8 }}>
                  USD
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Botón Inscribirse */}
        <Button
          fullWidth
          onClick={handleEnroll}
          disabled={selectedCards.size === 0}
          sx={{
            background: selectedCards.size > 0
              ? "linear-gradient(135deg, rgba(201, 168, 90, 0.8) 0%, rgba(227, 191, 112, 0.9) 50%, rgba(240, 208, 138, 0.8) 100%)"
              : "rgba(227, 191, 112, 0.3)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: selectedCards.size > 0 ? "#0f0f1e" : "#ffffff",
            fontWeight: 700,
            fontSize: "16px",
            py: 1.5,
            borderRadius: "16px",
            textTransform: "none",
            border: "1px solid rgba(227, 191, 112, 0.3)",
            boxShadow: selectedCards.size > 0
              ? "0 8px 24px rgba(227, 191, 112, 0.4)"
              : "none",
            mb: 2,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": selectedCards.size > 0 ? {
              background: "linear-gradient(135deg, rgba(212, 179, 102, 0.9) 0%, rgba(236, 200, 130, 1) 50%, rgba(245, 217, 154, 0.9) 100%)",
              boxShadow: "0 12px 32px rgba(227, 191, 112, 0.5)",
              transform: "translateY(-2px)",
            } : {},
            "&:disabled": {
              backgroundColor: "rgba(227, 191, 112, 0.2)",
              color: "rgba(255, 255, 255, 0.5)",
            },
          }}
        >
          Inscribirse
        </Button>

        {/* Términos y Condiciones */}
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            // TODO: Mostrar términos y condiciones
            console.log("Términos y Condiciones");
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
    </Box>
  );
}
