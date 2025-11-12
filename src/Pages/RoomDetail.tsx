// src/Pages/RoomDetail.tsx
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Box, Typography, Grid, Stack, FormControl, InputLabel, Select, MenuItem, Pagination, Divider, Button } from "@mui/material";
// import BingoCard from "../components/BingoCard";
import { generateCards } from "../utils/bingo";
import BingoCard from "../Componets/BingoCard";

type Room = {
    id: string;
    title: string;
    prizeAmount: number;
    currency: string;
    ticketsToStart: number;
    ticketPrice: number;
};

const MOCK_ROOMS: Room[] = [
    {
        id: "sala-1",
        title: "Sala Principal",
        prizeAmount: 10000,
        currency: "Bs",
        ticketsToStart: 112,
        ticketPrice: 100,
    },
    {
        id: "sala-2",
        title: "Sala Nocturna",
        prizeAmount: 5400,
        currency: "USD",
        ticketsToStart: 400,
        ticketPrice: 10,
    },
];

export default function RoomDetail() {
    const { roomId } = useParams<{ roomId: string }>();
    const room = React.useMemo(
        () => MOCK_ROOMS.find((r) => r.id === roomId),
        [roomId]
    );

    const navigate = useNavigate();

    // cantidad de cartones = ticketsToStart * 2
    const cardsToGenerate = room ? room.ticketsToStart * 2 : 0;
    const allCards = React.useMemo(
        () => generateCards(cardsToGenerate),
        [cardsToGenerate]
    );

    // Paginación simple
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(20);
    const total = allCards.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);
    const visibleCards = allCards.slice(startIdx, endIdx);

    // Dentro de RoomDetail.tsx, junto a tus estados de paginación existentes:
    const [selectedSet, setSelectedSet] = React.useState<Set<number>>(new Set());

    const toggleSelect = (globalIndex: number) => {
        setSelectedSet((prev) => {
            const next = new Set(prev);
            if (next.has(globalIndex)) next.delete(globalIndex);
            else next.add(globalIndex);
            return next;
        });
    };


    // 1) Handler para comprar / confirmar selección
const handleBuySelected = () => {
  // índices globales ordenados
  const sortedIndices = Array.from(selectedSet).sort((a, b) => a - b);

  // Si solo quieres IDs legibles (Cartón #N)
  const selectedIds = sortedIndices.map((i) => `carton-${i + 1}`);

  // Si además quieres enviar las grids completas de cada cartón:
  const selectedCards = sortedIndices.map((i) => ({
    id: `carton-${i + 1}`,
    grid: allCards[i], // <-- ¡OJO! usa el índice global sobre el arreglo 'cards'
  }));

  console.log("IDs seleccionados:", selectedIds);
  console.log("Detalle de cartones seleccionados:", selectedCards);

  // (Opcional) limpiar selección después de "comprar"
  setSelectedSet(new Set());

//   aqui solo quiero enviarlo a esta pagina purchased-cartons
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
                <Typography variant="h5" fontWeight={700}>
                    {room.title}
                </Typography>
                <Typography color="text.secondary">
                    Cartones disponibles: {cardsToGenerate}
                </Typography>
            </Box>

            {/* Grilla de cartones */}
            <>
                {/* Controles arriba */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    sx={{ mb: 1.5 }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Mostrando <strong>{startIdx + 1}</strong>–<strong>{endIdx}</strong> de{" "}
                        <strong>{total}</strong> cartones
                    </Typography>

                    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel id="page-size-label">Por página</InputLabel>
                            <Select
                                labelId="page-size-label"
                                value={pageSize}
                                label="Por página"
                                onChange={(e) => setPageSize(Number(e.target.value))}
                            >
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={20}>20</MenuItem>
                                <MenuItem value={50}>50</MenuItem>
                            </Select>
                        </FormControl>

                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, p) => setPage(p)}
                            color="primary"
                            siblingCount={0}
                            boundaryCount={1}
                        />
                    </Stack>
                </Stack>

                {/* Grid paginado */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, // 1 por fila en xs, 2 por fila desde md
                        gap: 2, // espacio entre tarjetas
                        alignItems: "start",
                    }}
                >
                    {visibleCards.map((grid, idx) => {
                        const globalIndex = startIdx + idx;
                        const isSelected = selectedSet.has(globalIndex);

                        return (
                            <BingoCard
                                key={globalIndex}
                                grid={grid}
                                title={`Cartón #${globalIndex + 1}`}
                                selectable
                                selected={isSelected}
                                onToggle={() => toggleSelect(globalIndex)}
                            />
                        );
                    })}
                </Box>

                {/* Controles abajo (opcional) */}
                <Box sx={{ mt: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, p) => setPage(p)}
                            color="primary"
                            siblingCount={0}
                            boundaryCount={1}
                        />
                    </Stack>
                </Box>


                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Seleccionados: <strong>{selectedSet.size}</strong>
                </Typography>

                <Divider sx={{ my: 1 }} />

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleBuySelected}
                    disabled={selectedSet.size === 0}
                >
                    comprar cartones seleccionados
                </Button>
            </>
        </Container>
    );
}
