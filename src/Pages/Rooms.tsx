// src/Pages/Rooms.tsx
import { Box, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BingoLogo from "../Componets/BingoLogo";
import RoomCard from "../Componets/RoomCard";

type Room = {
  id: string;
  title: string;
  price: number;
  estimatedPrize: number;
  currency: string;
  status: "waiting" | "preparing" | "in_progress" | "locked";
  rounds?: number;
  jackpot?: number;
  players?: string;
};

const MOCK_ROOMS: Room[] = [
  {
    id: "cosmo-cash",
    title: "Cosmo Cash",
    price: 5.0,
    estimatedPrize: 500.0,
    currency: "USD",
    status: "waiting",
    rounds: 3,
    jackpot: 200.0,
  },
  {
    id: "golden-galaxy",
    title: "Golden Galaxy",
    price: 10.0,
    estimatedPrize: 200.0,
    currency: "USD",
    status: "preparing",
    rounds: 1,
    players: "35/50",
  },
  {
    id: "lucky-star",
    title: "Lucky Star Bingo",
    price: 10.0,
    estimatedPrize: 200.0,
    currency: "USD",
    status: "in_progress",
    rounds: 3,
    players: "38/50",
  },
  {
    id: "cosmic-bingo",
    title: "Cosmic Bingo",
    price: 2.5,
    estimatedPrize: 120.0,
    currency: "USD",
    status: "locked",
    rounds: 3,
  },
];

export default function Rooms() {
  const navigate = useNavigate();

  const handleJoin = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#1a1d2e",
        color: "#ffffff",
        paddingBottom: "80px", // Space for tabbar
      }}
    >
      <Container maxWidth="sm" sx={{ py: 3 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          
          {/* Logo pequeño */}
          <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
            <BingoLogo size={80} />
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: "20px", sm: "24px" },
              fontWeight: 600,
              color: "#ffffff",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Salas Disponibles
          </Typography>
        </Box>

        {/* Rooms List */}
        <Box sx={{ px: 1 }}>
          {MOCK_ROOMS.map((room) => (
            <RoomCard
              key={room.id}
              title={room.title}
              price={room.price}
              estimatedPrize={room.estimatedPrize}
              currency={room.currency}
              status={room.status}
              rounds={room.rounds}
              jackpot={room.jackpot}
              players={room.players}
              onJoin={() => handleJoin(room.id)}
            />
          ))}
        </Box>
      </Container>
    </Box>
  );
}

