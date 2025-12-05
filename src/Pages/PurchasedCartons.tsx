// src/Pages/PurchasedCartons.tsx
import * as React from "react";
import { Container, Box, Typography, Chip } from "@mui/material";
import BingoCard from "../Components/BingoCard";

/** ====== DEMO DATA (siempre mock) ====== */
type DemoCard = { id: string; grid: number[][] };

// Genera un cartón válido 5x5 con FREE al centro
function generateDemoCard(): number[][] {
  const range = (n: number) => Array.from({ length: n }, (_, i) => i);
  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const columns = [
    shuffle(range(15).map((i) => i + 1)).slice(0, 5),  // B 1-15
    shuffle(range(15).map((i) => i + 16)).slice(0, 5), // I 16-30
    shuffle(range(15).map((i) => i + 31)).slice(0, 5), // N 31-45
    shuffle(range(15).map((i) => i + 46)).slice(0, 5), // G 46-60
    shuffle(range(15).map((i) => i + 61)).slice(0, 5), // O 61-75
  ];

  const grid = Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => columns[c][r])
  );
  grid[2][2] = 0; // FREE
  return grid;
}

// 6 cartones por fila (demo)
const DEMO_A: DemoCard[] = Array.from({ length: 6 }, (_, i) => ({
  id: `A-${i + 1}`,
  grid: generateDemoCard(),
}));
const DEMO_B: DemoCard[] = Array.from({ length: 6 }, (_, i) => ({
  id: `B-${i + 1}`,
  grid: generateDemoCard(),
}));

// Números llamados mock
const DEMO_CALLED = [3, 7, 12, 18, 22, 34, 45, 52, 60, 71];

export default function PurchasedCartons() {
  return (
    <Container maxWidth="lg" sx={{ pt: "80px", pb: 3 }}>
      {/* Barra de números llamados */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={800}>
          Números llamados
        </Typography>
        {DEMO_CALLED.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            (Aquí se mostrarán los números que vayan saliendo)
          </Typography>
        ) : (
          <WrapChips values={DEMO_CALLED} />
        )}
      </Box>

      {/* Fila A scrolleable */}
      <RowScroller
        title="Mis cartones (A)"
        items={DEMO_A}
        getKey={(c) => c.id}
        renderItem={(c) => <BingoCard grid={c.grid} title={`Cartón ${c.id}`} />}
      />

      {/* Fila B scrolleable */}
      <Box sx={{ mt: 4 }}>
        <RowScroller
          title="Mis cartones (B)"
          items={DEMO_B}
          getKey={(c) => c.id}
          renderItem={(c) => <BingoCard grid={c.grid} title={`Cartón ${c.id}`} />}
        />
      </Box>
    </Container>
  );
}

/** Chips con wrap para números llamados */
function WrapChips({ values }: { values: number[] }) {
  return (
    <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {values
        .slice()
        .sort((a, b) => a - b)
        .map((n) => (
          <Chip key={n} size="small" label={n} />
        ))}
    </Box>
  );
}

/**
 * Row scrolleable con 3 tarjetas visibles en desktop (snap),
 * 2 en tablet y 1 en mobile — sin carrusel ni controles.
 */
function RowScroller<T>({
  title,
  items,
  getKey,
  renderItem,
}: {
  title: string;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        {title} ({items.length})
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridAutoFlow: "column",
          // 1 card por vista en xs, 2 en sm, 3 en md+:
          gridAutoColumns: {
            xs: "100%",
            sm: "50%",
            md: "33.3333%",
          },
          gap: 2,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          pb: 1, // espacio para que no tape la barra de scroll
          // Opcional: estiliza/oculta scrollbar
          "&::-webkit-scrollbar": { height: 8 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,.2)",
            borderRadius: 8,
          },
        }}
      >
        {items.map((item) => (
          <Box
            key={getKey(item)}
            sx={{
              scrollSnapAlign: "start",
              // da aire para que la card no pegue al borde
              pr: { xs: 0.5, sm: 1, md: 0 },
            }}
          >
            {renderItem(item)}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
