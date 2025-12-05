// src/components/BingoCard.tsx
import * as React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

type BingoCardProps = {
  /** Matriz 5x5; 0 representa FREE */
  grid: number[][];
  /** Título opcional arriba del cartón */
  title?: string;
  /** Compacta el tamaño (para grillas grandes) */
  compact?: boolean;

  /** ¿Se puede seleccionar la tarjeta? (default: false) */
  selectable?: boolean;
  /** Estado de selección (controlado por el padre) */
  selected?: boolean;
  /** Toggle al hacer click/Enter/Espacio */
  onToggle?: () => void;
};

const HEADERS = ["B", "I", "N", "G", "O"] as const;

const cellStyle = (compact?: boolean): React.CSSProperties => ({
  width: compact ? 34 : 40,
  height: compact ? 34 : 40,
  display: "grid",
  placeItems: "center",
  fontWeight: 700,
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  background: "#fff",
  fontSize: compact ? 12 : 14,
  boxShadow: "0 1px 0 rgba(0,0,0,.04) inset",
});

const headerCellStyle = (compact?: boolean): React.CSSProperties => ({
  ...cellStyle(compact),
  background: "#0ea5e9",
  color: "#fff",
  borderColor: "#0ea5e9",
  letterSpacing: 1,
});

export default function BingoCard({
  grid,
  title,
  compact,
  selectable = false,
  selected = false,
  onToggle,
}: BingoCardProps) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (!selectable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle?.();
    }
  };

  return (
    <Card
      variant="outlined"
      tabIndex={selectable ? 0 : -1}
      role={selectable ? "button" : undefined}
      aria-pressed={selectable ? selected : undefined}
      onClick={selectable ? onToggle : undefined}
      onKeyDown={handleKey}
      sx={{
        position: "relative",
        borderRadius: 3,
        cursor: selectable ? "pointer" : "default",
        borderWidth: 1,
        borderColor: selected ? "primary.main" : "divider",
        boxShadow: selected
          ? "0 0 0 2px rgba(25,118,210,.25), 0 8px 22px rgba(0,0,0,.10)"
          : "0 4px 16px rgba(0,0,0,.06)",
        transition:
          "box-shadow .15s ease, border-color .15s ease, transform .05s ease, background .2s ease",
        "&:hover": selectable ? { transform: "translateY(-2px)" } : undefined,
        overflow: "hidden",
        background:
          selected
            ? "linear-gradient(180deg, rgba(2,132,199,0.05) 0%, rgba(2,132,199,0.02) 100%)"
            : "#fff",
      }}
    >
      {/* Ribbon de estado */}
      {selectable && (
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            px: 1,
            py: 0.25,
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            bgcolor: selected ? "primary.main" : "action.hover",
            color: selected ? "primary.contrastText" : "text.secondary",
            boxShadow: selected ? "0 2px 8px rgba(25,118,210,.35)" : "none",
          }}
        >
          {selected ? "Seleccionado" : "Seleccionar"}
        </Box>
      )}

      {/* Título */}
      {title && (
        <Box sx={{ px: 1.75, pt: 1.5, pb: 0.5 }}>
          <Typography
            variant={compact ? "subtitle2" : "subtitle1"}
            fontWeight={800}
            sx={{ color: "text.primary" }}
          >
            {title}
          </Typography>
        </Box>
      )}

      <CardContent sx={{ pt: title ? 0.5 : 1.5, pb: 2 }}>
        {/* Tabla con gaps agradables */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(5, auto)",
            columnGap: compact ? 2 : 3,
            rowGap: compact ? 0.75 : 1,
            justifyContent: "center",
          }}
        >
          {/* Encabezados BINGO */}
          {HEADERS.map((h) => (
            <div key={h} style={headerCellStyle(compact)}>
              {h}
            </div>
          ))}

          {/* Celdas */}
          {grid.flatMap((row, rIdx) =>
            row.map((n, cIdx) => {
              const isFree = n === 0;
              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  style={{
                    ...cellStyle(compact),
                    background: isFree ? "#f8fafc" : "#fff",
                    color: isFree ? "#0f172a" : "#0f172a",
                  }}
                >
                  {isFree ? (
                    <span
                      style={{
                        fontSize: compact ? 10 : 11,
                        fontWeight: 900,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: "#e2e8f0",
                      }}
                    >
                      FREE
                    </span>
                  ) : (
                    n
                  )}
                </div>
              );
            })
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
