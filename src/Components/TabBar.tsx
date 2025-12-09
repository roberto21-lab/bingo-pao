// src/Components/TabBar.tsx
import * as React from "react";
import { Box, Typography, Button, Menu, MenuItem } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import PersonIcon from "@mui/icons-material/Person";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getUserActiveRooms } from "../Services/rooms.service";
import { connectSocket } from "../Services/socket.service";

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

  // Asegurar que el socket esté conectado cuando el usuario está autenticado
  React.useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    }
  }, [isAuthenticated]);

  const isActive = (path: string) => location.pathname === path;

  // Verificar si el usuario tiene una partida activa
  // CRÍTICO: Agregar throttling para evitar llamadas excesivas
  // Inicializar con un timestamp muy antiguo para permitir la primera llamada
  const lastTabBarFetchRef = React.useRef<number>(Date.now() - 60000); // Inicializar a 60s en el pasado
  const isTabBarFetchingRef = React.useRef<boolean>(false);
  
  React.useEffect(() => {
    const checkActiveGame = async () => {
      if (!isAuthenticated || !userId) {
        setActiveGame({ roomId: null, isActive: false });
        return;
      }

      // Throttling: evitar llamadas si ya se hizo hace menos de 30 segundos
      const now = Date.now();
      if (isTabBarFetchingRef.current || (now - lastTabBarFetchRef.current) < 30000) {
        console.log("[TabBar] ⏸️ Throttling activo, omitiendo verificación...");
        return;
      }

      try {
        isTabBarFetchingRef.current = true;
        setLoadingGame(true);
        
        console.log("[TabBar] 🔄 Verificando partida activa...");
        // OPTIMIZACIÓN: Usar el endpoint optimizado en lugar de hacer múltiples requests
        const activeRooms = await getUserActiveRooms(userId);
        console.log("[TabBar] ✅ Partida activa verificada");
        
        if (activeRooms.length === 0) {
          setActiveGame({ roomId: null, isActive: false });
          return;
        }

        // Buscar la primera sala activa (status === "active")
        const activeRoom = activeRooms.find(room => room.status === "active");
        
        if (activeRoom) {
          setActiveGame({ roomId: activeRoom.id, isActive: true });
          return;
        }

        // Si no hay sala activa, buscar la primera sala en espera
        const waitingRoom = activeRooms.find(room => room.status === "waiting");
        
        if (waitingRoom) {
          setActiveGame({ roomId: waitingRoom.id, isActive: false });
          return;
        }

        // Si no hay salas activas ni en espera, usar la primera sala disponible (puede ser finished)
        setActiveGame({ roomId: activeRooms[0].id, isActive: false });
      } catch (err) {
        console.error("[TabBar] ❌ Error al verificar partida activa:", err);
        setActiveGame({ roomId: null, isActive: false });
      } finally {
        isTabBarFetchingRef.current = false;
        setLoadingGame(false);
        lastTabBarFetchRef.current = Date.now();
      }
    };

    // Ejecutar inmediatamente solo si no se ha ejecutado recientemente
    const now = Date.now();
    if (now - lastTabBarFetchRef.current >= 30000) {
      checkActiveGame();
    }
    
    // Verificar cada 30 segundos (reducido de 10s para evitar requests excesivos)
    // Solo verificar cuando la página está visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkActiveGame();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const interval = setInterval(() => {
      // Solo hacer polling si la página está visible
      if (document.visibilityState === 'visible') {
        checkActiveGame();
      }
    }, 30000); // 30 segundos en lugar de 10
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, userId]);

  // Verificar si estamos en la vista del juego o en la selección de cartones
  const isInGameView = location.pathname.startsWith("/game/");
  const isInRoomDetail = location.pathname.startsWith("/room/");

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
    if (isInRoomDetail) {
      return "Seleccionando";
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
        // Padding responsive
        padding: { xs: "8px 8px", sm: "12px 16px" },
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
          gap: { xs: "2px", sm: "4px" },
          cursor: "pointer",
          // Padding responsive
          padding: { xs: "6px 8px", sm: "8px 16px" },
          transition: "all 0.2s",
          minWidth: { xs: "60px", sm: "80px" },
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
            // Icono responsive
            "& svg": {
              fontSize: { xs: "20px", sm: "24px" },
            },
          }}
        >
          <HomeIcon />
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: isActive("/") ? "#d4af37" : "#f5e6d3",
            // Texto responsive
            fontSize: { xs: "10px", sm: "12px" },
            fontWeight: isActive("/") ? 600 : 400,
            transition: "color 0.2s",
          }}
        >
          Inicio
        </Typography>
      </Box>

      {/* Join Button - Lingote de Oro - RESPONSIVE */}
      <Button
        onClick={handleJoin}
        disabled={isInGameView || isInRoomDetail}
        disableRipple
        disableElevation
        sx={{
          // Tamaño responsive del botón
          minWidth: { xs: "100px", sm: "120px", md: "140px" },
          width: { xs: "auto", sm: "auto" },
          height: { xs: "48px", sm: "56px", md: "64px" },
          px: { xs: 1.5, sm: 2, md: 3 },
          color: "#1a0f0a !important",
          fontWeight: 800,
          // Texto responsive
          fontSize: { xs: "13px", sm: "15px", md: "17px" },
          letterSpacing: { xs: "0.3px", sm: "0.5px" },
          textTransform: "none",
          position: "relative",
          // Forma de lingote (trapecio con bordes redondeados)
          borderRadius: { xs: "4px 4px 8px 8px", sm: "6px 6px 10px 10px" },
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
          // Margen responsive
          mx: { xs: 1, sm: 1.5, md: 2 },
          flexShrink: 0,
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
            ...(isInGameView || isInRoomDetail ? {} : {
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
            ...(isInGameView || isInRoomDetail ? {} : {
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


      {/* Mi Cuenta Tab o Login Tab - RESPONSIVE */}
      <Box>
      <Box
          onClick={handleAccountClick}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: { xs: "2px", sm: "4px" },
          cursor: "pointer",
          // Padding responsive
          padding: { xs: "6px 8px", sm: "8px 16px" },
          transition: "all 0.2s",
          minWidth: { xs: "60px", sm: "80px" },
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
            // Icono responsive
            "& svg": {
              fontSize: { xs: "20px", sm: "24px" },
            },
          }}
        >
            {isAuthenticated ? <AccountCircleIcon /> : <PowerSettingsNewIcon />}
        </Box>
        <Typography
          variant="caption"
          sx={{
              color: isActive("/profile") || isActive("/wallet") || isActive("/login") ? "#d4af37" : "#f5e6d3",
            // Texto responsive
            fontSize: { xs: "10px", sm: "12px" },
            fontWeight: isActive("/profile") || isActive("/wallet") || isActive("/login") ? 600 : 400,
            transition: "color 0.2s",
            // Texto adaptativo para pantallas pequeñas
            whiteSpace: "nowrap",
          }}
        >
            {isAuthenticated ? (
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Mi Cuenta</Box>
            ) : (
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Iniciar sesión</Box>
            )}
            {isAuthenticated ? (
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>Cuenta</Box>
            ) : (
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>Ingresar</Box>
            )}
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
