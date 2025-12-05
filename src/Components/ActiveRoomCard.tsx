import { Card, CardContent, Typography, Box, Stack } from "@mui/material";

type ActiveRoom = {
  id: string;
  title: string;
  status: "active" | "waiting" | "finished";
  prizeAmount: number;
  currency: string;
  currentRound?: number; // Número de ronda actual si la sala no está finalizada
  currentPattern?: string; // Pattern de la ronda actual si la sala está activa
};

type ActiveRoomCardProps = {
  room: ActiveRoom;
  onClick: (roomId: string) => void;
};

const getStatusLabel = (status: ActiveRoom["status"]) => {
  switch (status) {
    case "active":
      return "Activa";
    case "waiting":
      return "Esperando";
    case "finished":
      return "Finalizada";
    default:
      return "Desconocido";
  }
};

const getStatusColor = (status: ActiveRoom["status"]) => {
  switch (status) {
    case "active":
      return "#4caf50";
    case "waiting":
      return "#ff9800";
    case "finished":
      return "#9e9e9e";
    default:
      return "#ffffff";
  }
};

const formatPatternName = (pattern: string): string => {
  const patternMap: Record<string, string> = {
    horizontal: "Línea Horizontal",
    vertical: "Línea Vertical",
    diagonal: "Línea Diagonal",
    cross_small: "Cruz Pequeña",
    cross_big: "Cruz Grande",
    full: "Cartón Lleno",
    random: "Aleatorio",
  };
  return patternMap[pattern] || pattern.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function ActiveRoomCard({ room, onClick }: ActiveRoomCardProps) {
  return (
    <Box sx={{ marginBottom: "16px", marginTop: "0" }}>
    <Card
      onClick={() => onClick(room.id)}
      sx={{
        background: "rgba(26, 26, 46, 0.4)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderRadius: 0,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.3),
          0 0 0 1px rgba(255, 255, 255, 0.05) inset
        `,
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        zIndex: 1,
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
          transition: "opacity 0.3s",
        },
        "&:hover": {
          borderColor: "rgba(227, 191, 112, 0.5)",
          transform: "translateY(-4px)",
          boxShadow: `
            0 12px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(227, 191, 112, 0.2) inset,
            0 4px 16px rgba(227, 191, 112, 0.2)
          `,
          background: "rgba(31, 34, 51, 0.7)",
          "&::before": {
            background: "linear-gradient(90deg, transparent, rgba(227, 191, 112, 0.3), transparent)",
          },
        },
      }}
    >
      <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            {room.title}
          </Typography>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: "8px",
              backgroundColor: getStatusColor(room.status) + "20",
              border: `1px solid ${getStatusColor(room.status)}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: getStatusColor(room.status),
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {getStatusLabel(room.status)}
            </Typography>
          </Box>
        </Stack>
        {room.status !== "finished" && room.currentRound !== undefined && (
          <Box sx={{ mb: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                color: "#d4af37",
                opacity: 0.9,
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              Ronda {room.currentRound}
            </Typography>
            {room.status === "active" && room.currentPattern && (
              <Box
                sx={{
                  mt: 0.5,
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1,
                  py: 0.25,
                  borderRadius: "6px",
                  backgroundColor: "rgba(212, 175, 55, 0.1)",
                  border: "1px solid rgba(212, 175, 55, 0.3)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#d4af37",
                    opacity: 0.9,
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  {formatPatternName(room.currentPattern)}
                </Typography>
              </Box>
            )}
          </Box>
        )}
        <Typography
          variant="body2"
          sx={{
            color: "#ffffff",
            opacity: 0.8,
            fontSize: "14px",
          }}
        >
          Premio: {room.prizeAmount.toLocaleString()} {room.currency}
        </Typography>
      </CardContent>
    </Card>
    </Box>
  );
}

