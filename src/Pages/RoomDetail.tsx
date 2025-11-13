// src/Pages/RoomDetail.tsx
import {
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Pagination,
    Select,
    Stack,
    Typography
} from "@mui/material";
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import BingoCard from "../Componets/BingoCard";
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
  { id: "sala-1", title: "Sala Principal", prizeAmount: 10000, currency: "Bs", ticketsToStart: 112, ticketPrice: 100 },
  { id: "sala-2", title: "Sala Nocturna", prizeAmount: 5400, currency: "USD", ticketsToStart: 400, ticketPrice: 10 },
];

export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const room = React.useMemo(() => MOCK_ROOMS.find((r) => r.id === roomId), [roomId]);
  const cardsToGenerate = room ? room.ticketsToStart * 2 : 0;
  const allCards = React.useMemo(() => generateCards(cardsToGenerate), [cardsToGenerate]);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(60); // más grande porque ahora son celdas ligeras
  const total = allCards.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const visibleIndices = Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i);

  const [selectedSet, setSelectedSet] = React.useState<Set<number>>(new Set());

  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null);
  const openPreview = (globalIndex: number) => setPreviewIndex(globalIndex);
  const closePreview = () => setPreviewIndex(null);

  const acceptPreview = () => {
    if (previewIndex == null) return;
    setSelectedSet((prev) => new Set(prev).add(previewIndex));
    setPreviewIndex(null);
  };

  const removeSelected = (globalIndex: number) => {
    setSelectedSet((prev) => {
      const next = new Set(prev);
      next.delete(globalIndex);
      return next;
    });
  };

  const handleBuySelected = () => {
    const sorted = Array.from(selectedSet).sort((a, b) => a - b);
    const selectedCards = sorted.map((i) => ({
      id: `carton-${i + 1}`,
      grid: allCards[i],
    }));
    console.log("Compra ->", selectedCards);
    navigate("/purchased-cartons", { state: { selectedCards } });
  };

  if (!room) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h6">Sala no encontrada</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>{room.title}</Typography>
        <Typography color="text.secondary">Cartones disponibles: {cardsToGenerate}</Typography>
        
        <Typography variant="h5" fontWeight={700}>Seleciona tus cartones</Typography>
         <Typography variant="subtitle1" fontWeight={700}>
            Seleccionados ({selectedSet.size})
          </Typography>
      </Box>

     

      {/* <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: {
            xs: "repeat(3, 1fr)",
            sm: "repeat(6, 1fr)",
            md: "repeat(8, 1fr)",
            lg: "repeat(10, 1fr)",
          },
          alignItems: "start",
        }}
      >
        {visibleIndices.map((globalIndex) => {
          const alreadySelected = selectedSet.has(globalIndex);
          return (
            <CellTile
              key={globalIndex}
              index={globalIndex}
              selected={alreadySelected}
              onClick={() => openPreview(globalIndex)}
            />
          );
        })}
      </Box> */}


{/* Card principal: 400px de alto, scroll interno */}
<Box
  sx={{
    bgcolor: "background.paper",
    borderRadius: 2,
    boxShadow: "0 8px 24px rgba(0,0,0,.08)",
    border: (t) => `1px solid ${t.palette.divider}`,
    p: 1,
    height: 400,            // ⬅️ alto fijo solicitado
    overflowY: "auto",
    "&::-webkit-scrollbar": { width: 10 },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "action.hover",
      borderRadius: 8,
      border: (t) => `2px solid ${t.palette.background.paper}`,
    },
  }}
>
  {/* Grilla: 5 por fila siempre */}
  <Box
    sx={{
      display: "grid",
      gap: 0.75,
      gridTemplateColumns: "repeat(5, 1fr)",  // ⬅️ 5 columnas
      alignItems: "start",
    }}
  >
    {allCards.map((_, globalIndex) => {
      const alreadySelected = selectedSet.has(globalIndex);
      return (
        <CellTile
          key={globalIndex}
          index={globalIndex}
          selected={alreadySelected}
          onClick={() => openPreview(globalIndex)}
        />
      );
    })}
  </Box>
</Box>


      <Box sx={{ mt: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
         
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={() => setSelectedSet(new Set())}
              disabled={selectedSet.size === 0}
            >
              Limpiar selección
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleBuySelected}
              disabled={selectedSet.size === 0}
            >
              Comprar seleccionados
            </Button>
          </Stack>
        </Stack>

        {selectedSet.size === 0 ? (
          <Typography variant="body2" color="text.secondary">
            (Aquí verás los cartones que vayas aceptando)
          </Typography>
        ) : (
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              overflowX: "auto",
              pb: 1,
              "&::-webkit-scrollbar": { height: 8 },
              "&::-webkit-scrollbar-thumb": { bgcolor: "action.hover", borderRadius: 8 },
            }}
          >
            {Array.from(selectedSet)
              .sort((a, b) => a - b)
              .map((i) => (
                <Box key={i} sx={{ minWidth: 240 }}>
                  <BingoCard
                    grid={allCards[i]}
                    title={`Cartón #${i + 1}`}
                    compact
                  />
                  <Box sx={{ textAlign: "right", mt: 0.5 }}>
                    <Button size="small" color="error" onClick={() => removeSelected(i)}>
                      Quitar
                    </Button>
                  </Box>
                </Box>
              ))}
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Dialog
        open={previewIndex !== null}
        onClose={closePreview}
        maxWidth="xs"
        fullWidth
      >
        {previewIndex !== null && (
          <>
            <DialogTitle>Previsualizar cartón #{previewIndex + 1}</DialogTitle>
            <DialogContent dividers>
              <BingoCard
                grid={allCards[previewIndex]}
                title={`Cartón #${previewIndex + 1}`}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closePreview}>Cancelar</Button>
              <Button variant="contained" onClick={acceptPreview}>
                Aceptar cartón
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}

function CellTile({
  index,
  selected,
  onClick,
}: {
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        userSelect: "none",
        display: "grid",
        placeItems: "center",
        height: 64,
        borderRadius: 1.5,
        fontWeight: 700,
        border: (t) => `1px solid ${selected ? t.palette.primary.main : t.palette.divider}`,
        bgcolor: selected ? "primary.light" : "background.paper",
        color: selected ? "primary.contrastText" : "text.primary",
        boxShadow: selected ? "0 0 0 2px rgba(25,118,210,.15)" : "0 1px 3px rgba(0,0,0,.06)",
        transition: "transform .08s ease, box-shadow .12s ease, background .12s ease",
        cursor: "pointer",
        "&:hover": { transform: "translateY(-1px)" },
      }}
    >
      #{index + 1}
    </Box>
  );
}
