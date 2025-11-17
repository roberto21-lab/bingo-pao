import { Box, Container, Typography, Card, CardContent, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BingoLogo from "../Componets/BingoLogo";

type ActiveRoom = {
  id: string;
  title: string;
  status: "active" | "waiting" | "finished";
  prizeAmount: number;
  currency: string;
};

const MOCK_ACTIVE_ROOMS: ActiveRoom[] = [
  {
    id: "sala-1",
    title: "Sala Principal",
    status: "active",
    prizeAmount: 10000,
    currency: "USD",
  },
  {
    id: "sala-2",
    title: "Sala Nocturna",
    status: "waiting",
    prizeAmount: 5400,
    currency: "USD",
  },
];

// Mock data for balances
const AVAILABLE_BALANCE = 1250.75;
const FROZEN_BALANCE = 0.0;

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

export default function Home() {
  const navigate = useNavigate();

  const handleRoomClick = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleTopUp = () => {
    // TODO: Implementar top up
    console.log("Top up balance");
  };

  const handleWithdraw = () => {
    // TODO: Implementar withdraw
    console.log("Withdraw funds");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "transparent",
        color: "#f5e6d3",
        paddingBottom: "80px", // Space for tabbar
        position: "relative",
      }}
    >
      <Container maxWidth="sm" sx={{ py: 4 }}>
        {/* Logo Section */}
        <Box sx={{ textAlign: "center", mb: 4 }}>          
          {/* Logo de Bingo PaO */}
          <Box sx={{ mb: 3 }}>
            <BingoLogo size={150} />
          </Box>
        </Box>

        {/* Balance Cards */}
        <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
          {/* Available Balance Card */}
          <Card
            className="gold-metallic"
            sx={{
              flex: 1,
              borderRadius: "16px",
              border: "2px solid rgba(212, 175, 55, 0.4)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)",
                zIndex: 1,
              },
            }}
          >
            <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  mb: 1,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                }}
              >
                Mi Saldo
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.5 }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: "#ffffff",
                    fontSize: { xs: "20px", sm: "24px" },
                    fontWeight: 700,
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                    lineHeight: 1,
                  }}
                >
                  ${AVAILABLE_BALANCE.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
                <Typography
                  sx={{
                    color: "#ffffff",
                    fontSize: { xs: "14px", sm: "16px" },
                    fontWeight: 600,
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                    lineHeight: 1,
                  }}
                >
                  USD
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#ffffff",
                  fontSize: "12px",
                  opacity: 0.95,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                }}
              >
                Disponible
              </Typography>
            </CardContent>
          </Card>

          {/* Frozen Balance Card */}
          <Card
            className="glass-effect"
            sx={{
              flex: 1,
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent)",
              },
            }}
          >
            <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                Saldo Congelado
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.5 }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: "#ffffff",
                    fontSize: { xs: "20px", sm: "24px" },
                    fontWeight: 700,
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                    lineHeight: 1,
                  }}
                >
                  ${FROZEN_BALANCE.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
                <Typography
                  sx={{
                    color: "#ffffff",
                    fontSize: { xs: "14px", sm: "16px" },
                    fontWeight: 600,
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                    lineHeight: 1,
                  }}
                >
                  USD
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#ffffff",
                  fontSize: "12px",
                  opacity: 0.8,
                }}
              >
                Pendiente de retiro
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* My Active Games Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: 600,
              mb: 2,
            }}
          >
            Mis Juegos Activos
          </Typography>

          {MOCK_ACTIVE_ROOMS.length === 0 ? (
            <Typography
              variant="body2"
              sx={{
                color: "#ffffff",
                opacity: 0.7,
                textAlign: "center",
                py: 4,
              }}
            >
              No se encontraron juegos activos
            </Typography>
          ) : (
            <Stack spacing={2}>
              {MOCK_ACTIVE_ROOMS.map((room) => (
                <Card
                  key={room.id}
                  onClick={() => handleRoomClick(room.id)}
                  sx={{
                    background: "rgba(26, 26, 46, 0.4)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: `
                      0 8px 32px rgba(0, 0, 0, 0.3),
                      0 0 0 1px rgba(255, 255, 255, 0.05) inset
                    `,
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
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
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#ffffff",
                        opacity: 0.8,
                        fontSize: "14px",
                      }}
                    >
                      Premio: ${room.prizeAmount.toLocaleString()} {room.currency}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            fullWidth
            onClick={handleTopUp}
            sx={{
              background: "linear-gradient(135deg, rgba(201, 168, 90, 0.8) 0%, rgba(227, 191, 112, 0.9) 50%, rgba(240, 208, 138, 0.8) 100%)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "#0f0f1e",
              fontWeight: 600,
              fontSize: "14px",
              py: 1.5,
              borderRadius: "16px",
              textTransform: "none",
              border: "1px solid rgba(227, 191, 112, 0.3)",
              boxShadow: `
                0 8px 24px rgba(227, 191, 112, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1) inset
              `,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                background: "linear-gradient(135deg, rgba(212, 179, 102, 0.9) 0%, rgba(236, 200, 130, 1) 50%, rgba(245, 217, 154, 0.9) 100%)",
                boxShadow: `
                  0 12px 32px rgba(227, 191, 112, 0.4),
                  0 0 0 1px rgba(255, 255, 255, 0.2) inset
                `,
                transform: "translateY(-2px)",
              },
            }}
          >
            Recargar Saldo
          </Button>
          <Button
            fullWidth
            onClick={handleWithdraw}
            variant="outlined"
            sx={{
              background: "rgba(31, 34, 51, 0.4)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderColor: "rgba(227, 191, 112, 0.5)",
              color: "#e3bf70",
              fontWeight: 600,
              fontSize: "14px",
              py: 1.5,
              borderRadius: "16px",
              textTransform: "none",
              borderWidth: "2px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                borderColor: "rgba(240, 208, 138, 0.7)",
                color: "#f0d08a",
                background: "rgba(227, 191, 112, 0.1)",
                borderWidth: "2px",
                boxShadow: "0 8px 24px rgba(227, 191, 112, 0.2)",
                transform: "translateY(-2px)",
              },
            }}
          >
            Retirar Fondos
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
