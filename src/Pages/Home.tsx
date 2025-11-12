import { Container, Box, Grid } from "@mui/material";
import Hall from "../Componets/Hall";
import { useNavigate } from "react-router-dom";
// import Hall from "../components/Hall";

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

export default function Home() {
    const navigate = useNavigate();

    const handleEnter = (roomId: string) => {
       navigate(`/room/${roomId}`)
        alert(`Entrando a ${roomId}`);
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ textAlign: "center", mb: 3, fontSize: 24, fontWeight: 700 }}>
                Salas disponibles
            </Box>

            <Grid container spacing={2}>
                {MOCK_ROOMS.map((room) => (
                    <Hall
                        title={room.title}
                        prizeAmount={room.prizeAmount}
                        currency={room.currency}
                        ticketsToStart={room.ticketsToStart}
                        ticketPrice={room.ticketPrice}
                        onEnter={() => handleEnter(room.id)}
                    />
                ))}
            </Grid>
        </Container>
    );
}
