// src/Componets/TabBar.tsx
import * as React from "react";
import { Box, Typography, Button, Menu, MenuItem } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getUserRooms } from "../Services/cards.service";
import { getRoomById, type Room } from "../Services/rooms.service";
import { getRoomRounds } from "../Services/rounds.service";

type ActiveGameInfo = {
  roomId: string | null;
  isActive: boolean; // true si está en progreso o a punto de empezar
};

const TabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userId } = useAuth();
  const [activeGame, setActiveGame] = React.useState<ActiveGameInfo>({ roomId: null, isActive: false });
  const [loadingGame, setLoadingGame] = React.useState(false);
  const [accountMenuAnchor, setAccountMenuAnchor] = React.useState<null | HTMLElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Verificar si el usuario tiene una partida activa
  React.useEffect(() => {
    const checkActiveGame = async () => {
      if (!isAuthenticated || !userId) {
        setActiveGame({ roomId: null, isActive: false });
        return;
      }

      try {
        setLoadingGame(true);
        // Obtener todas las rooms en las que el usuario tiene cartones
        const roomIds = await getUserRooms(userId);
        
        if (roomIds.length === 0) {
          setActiveGame({ roomId: null, isActive: false });
          return;
        }

        // Verificar cada sala para encontrar una activa o a punto de empezar
        for (const roomId of roomIds) {
          try {
            const room: Room = await getRoomById(roomId);
            const rounds = await getRoomRounds(roomId);
            
            // Verificar si hay un round en progreso
            const inProgressRound = rounds.find((round) => {
              const statusObj = typeof round.status_id === "object" && round.status_id
                ? round.status_id
                : null;
              return statusObj?.name === "in_progress";
            });

            // Verificar si la sala está a punto de empezar (tiene scheduledAt y no ha empezado)
            const scheduledAt = room.scheduledAt;
            const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
            const roomStatus = room.status || "";

            // La sala está activa si:
            // 1. Tiene un round en progreso, O
            // 2. Está programada para empezar (scheduledAt en el futuro) y el status es waiting
            // 3. El status es in_progress (aunque no haya rounds en progreso aún)
            if (inProgressRound || roomStatus === "in_progress" || (isScheduled && roomStatus === "waiting")) {
              setActiveGame({ roomId, isActive: true });
              return;
            }
          } catch (err) {
            console.error(`Error al verificar sala ${roomId}:`, err);
            continue;
          }
        }

        // Si no se encontró ninguna sala activa, usar la primera sala (si existe)
        if (roomIds.length > 0) {
          setActiveGame({ roomId: roomIds[0], isActive: false });
        } else {
          setActiveGame({ roomId: null, isActive: false });
        }
      } catch (err) {
        console.error("Error al verificar partida activa:", err);
        setActiveGame({ roomId: null, isActive: false });
      } finally {
        setLoadingGame(false);
      }
    };

    checkActiveGame();
    
    // Verificar cada 10 segundos para actualizar el estado
    const interval = setInterval(checkActiveGame, 10000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, userId]);

  // Verificar si estamos en la vista del juego
  const isInGameView = location.pathname.startsWith("/game/");

  const handleJoin = () => {
    // Si ya está en el juego, no hacer nada
    if (isInGameView) {
      return;
    }

    if (activeGame.roomId && activeGame.isActive) {
      // Si hay una partida activa, ir al juego
      navigate(`/game/${activeGame.roomId}`);
    } else {
      // Si no hay partida activa, ir a las salas
      navigate("/rooms");
    }
  };

  // Determinar el texto y estado del botón
  const getButtonText = () => {
    if (isInGameView) {
      return "Jugando";
    }
    if (loadingGame) {
      return "Cargando...";
    }
    if (activeGame.roomId && activeGame.isActive) {
      return "Jugar";
    }
    return "Unirse";
  };

  const handleAccountClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isAuthenticated) {
      setAccountMenuAnchor(event.currentTarget);
    } else {
      navigate("/login");
    }
  };

  const handleMenuClose = () => {
    setAccountMenuAnchor(null);
  };

  const handleMenuOption = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(74, 44, 26, 0.8)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "2px solid rgba(212, 175, 55, 0.3)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(212, 175, 55, 0.2)",
        padding: "12px 16px",
        zIndex: 1000,
      }}
    >
      {/* Home Tab */}
      <Box
        onClick={() => navigate("/")}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          padding: "8px 16px",
          transition: "all 0.2s",
          flex: 1,
          "&:hover": {
            opacity: 0.8,
          },
        }}
      >
        <Box
          sx={{
            color: isActive("/") ? "#d4af37" : "#f5e6d3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.2s",
          }}
        >
          <HomeIcon />
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: isActive("/") ? "#d4af37" : "#f5e6d3",
            fontSize: "12px",
            fontWeight: isActive("/") ? 600 : 400,
            transition: "color 0.2s",
          }}
        >
          Inicio
        </Typography>
      </Box>

      {/* Join Button - Lingote de Oro */}
      <Button
        onClick={handleJoin}
        disabled={isInGameView}
        disableRipple
        disableElevation
        sx={{
          minWidth: "140px",
          height: "64px",
          color: "#1a0f0a !important",
          fontWeight: 800,
          fontSize: "17px",
          letterSpacing: "0.5px",
          textTransform: "none",
          position: "relative",
          // Forma de lingote (trapecio con bordes redondeados)
          borderRadius: "6px 6px 10px 10px",
          // Efecto de trapecio usando transform skew sutil
          transform: "perspective(200px) rotateX(2deg)",
          transformStyle: "preserve-3d",
          // Gradiente dorado realista de lingote
          background: `
            linear-gradient(135deg, 
              #d4af37 0%,
              #f4d03f 15%,
              #ffd700 30%,
              #f4d03f 45%,
              #d4af37 60%,
              #b8941f 75%,
              #d4af37 90%,
              #f4d03f 100%
            ) !important
          `,
          backgroundSize: "200% 200%",
          animation: "goldShimmer 4s ease-in-out infinite",
          // Sombras profundas para efecto 3D de lingote
          boxShadow: `
            0 8px 24px rgba(0, 0, 0, 0.6),
            0 4px 12px rgba(212, 175, 55, 0.4),
            inset 0 2px 4px rgba(255, 255, 255, 0.3),
            inset 0 -4px 8px rgba(0, 0, 0, 0.4),
            inset 0 0 20px rgba(255, 215, 0, 0.2)
          `,
          // Bordes biselados
          border: "none !important",
          borderTop: "2px solid rgba(255, 255, 255, 0.4) !important",
          borderBottom: "3px solid rgba(0, 0, 0, 0.3) !important",
          // Deshabilitar estilos por defecto de MUI
          "&.MuiButton-root": {
            backgroundColor: "transparent",
            boxShadow: "none",
          },
          // Efecto de relieve
          "&::before": {
            content: '""',
            position: "absolute",
            top: "2px",
            left: "8%",
            right: "8%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)",
            borderRadius: "1px",
            zIndex: 1,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: "4px",
            left: "5%",
            right: "5%",
            height: "3px",
            background: "linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.3), transparent)",
            borderRadius: "2px",
            zIndex: 1,
          },
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          mx: 2,
          "&:disabled": {
            opacity: 0.6,
            cursor: "not-allowed",
            transform: "none",
            background: `
              linear-gradient(135deg, 
                #b8941f 0%,
                #d4af37 15%,
                #b8941f 30%,
                #d4af37 45%,
                #b8941f 60%,
                #9a7a16 75%,
                #b8941f 90%,
                #d4af37 100%
              ) !important
            `,
          },
          "&:hover": {
            ...(isInGameView ? {} : {
              transform: "perspective(200px) rotateX(2deg) translateY(-3px) scale(1.02)",
              background: `
                linear-gradient(135deg, 
                  #d4af37 0%,
                  #f4d03f 15%,
                  #ffd700 30%,
                  #f4d03f 45%,
                  #d4af37 60%,
                  #b8941f 75%,
                  #d4af37 90%,
                  #f4d03f 100%
                ) !important
              `,
              boxShadow: `
                0 12px 36px rgba(0, 0, 0, 0.7),
                0 6px 16px rgba(212, 175, 55, 0.5),
                inset 0 2px 4px rgba(255, 255, 255, 0.4),
                inset 0 -4px 8px rgba(0, 0, 0, 0.5),
                inset 0 0 25px rgba(255, 215, 0, 0.3)
              `,
            }),
          },
          "&:active": {
            ...(isInGameView ? {} : {
              transform: "perspective(200px) rotateX(2deg) translateY(0px) scale(0.99)",
            // Mantener exactamente el mismo estilo visual
            background: `
              linear-gradient(135deg, 
                #d4af37 0%,
                #f4d03f 15%,
                #ffd700 30%,
                #f4d03f 45%,
                #d4af37 60%,
                #b8941f 75%,
                #d4af37 90%,
                #f4d03f 100%
              ) !important
            `,
            boxShadow: `
              0 8px 24px rgba(0, 0, 0, 0.6),
              0 4px 12px rgba(212, 175, 55, 0.4),
              inset 0 2px 4px rgba(255, 255, 255, 0.3),
              inset 0 -4px 8px rgba(0, 0, 0, 0.4),
              inset 0 0 20px rgba(255, 215, 0, 0.2)
            `,
            borderTop: "2px solid rgba(255, 255, 255, 0.4) !important",
            borderBottom: "3px solid rgba(0, 0, 0, 0.3) !important",
            filter: "none",
            }),
          },
          "&:focus": {
            background: `
              linear-gradient(135deg, 
                #d4af37 0%,
                #f4d03f 15%,
                #ffd700 30%,
                #f4d03f 45%,
                #d4af37 60%,
                #b8941f 75%,
                #d4af37 90%,
                #f4d03f 100%
              ) !important
            `,
            boxShadow: `
              0 8px 24px rgba(0, 0, 0, 0.6),
              0 4px 12px rgba(212, 175, 55, 0.4),
              inset 0 2px 4px rgba(255, 255, 255, 0.3),
              inset 0 -4px 8px rgba(0, 0, 0, 0.4),
              inset 0 0 20px rgba(255, 215, 0, 0.2)
            `,
          },
          "@keyframes goldShimmer": {
            "0%, 100%": {
              backgroundPosition: "0% 50%",
            },
            "50%": {
              backgroundPosition: "100% 50%",
            },
          },
        }}
      >
        {getButtonText()}
      </Button>

      {/* Mi Cuenta Tab o Login Tab */}
      <Box>
      <Box
          onClick={handleAccountClick}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          padding: "8px 16px",
          transition: "all 0.2s",
          flex: 1,
          "&:hover": {
            opacity: 0.8,
          },
        }}
      >
        <Box
          sx={{
              color: isActive("/profile") || isActive("/wallet") || isActive("/login") ? "#d4af37" : "#f5e6d3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.2s",
          }}
        >
            {isAuthenticated ? <AccountCircleIcon /> : <PowerSettingsNewIcon />}
        </Box>
        <Typography
          variant="caption"
          sx={{
              color: isActive("/profile") || isActive("/wallet") || isActive("/login") ? "#d4af37" : "#f5e6d3",
            fontSize: "12px",
              fontWeight: isActive("/profile") || isActive("/wallet") || isActive("/login") ? 600 : 400,
            transition: "color 0.2s",
          }}
        >
            {isAuthenticated ? "Mi Cuenta" : "Iniciar sesión"}
          </Typography>
        </Box>

        {/* Menú de opciones de cuenta */}
        <Menu
          anchorEl={accountMenuAnchor}
          open={Boolean(accountMenuAnchor)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          PaperProps={{
            sx: {
              mt: -1,
              minWidth: 180,
              background: "rgba(26, 16, 8, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
              overflow: "hidden",
            },
          }}
        >
          <MenuItem
            onClick={() => handleMenuOption("/profile")}
            sx={{
              color: "#f5e6d3",
              py: 1.5,
              px: 2,
              "&:hover": {
                background: "rgba(212, 175, 55, 0.2)",
              },
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <PersonIcon sx={{ fontSize: 20, color: "#d4af37" }} />
            <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
              Mis Datos
            </Typography>
          </MenuItem>
          <MenuItem
            onClick={() => handleMenuOption("/wallet")}
            sx={{
              color: "#f5e6d3",
              py: 1.5,
              px: 2,
              "&:hover": {
                background: "rgba(212, 175, 55, 0.2)",
              },
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <AccountBalanceWalletIcon sx={{ fontSize: 20, color: "#d4af37" }} />
            <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
              Billetera
        </Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default TabBar;
