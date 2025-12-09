// src/Components/Header.tsx
import * as React from "react";
import { Box, Badge, IconButton, AppBar, Toolbar, Chip } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import NotificationCenter from "./NotificationCenter";
import NotificationToast from "./NotificationToast";
import { onWalletUpdated } from "../Services/socket.service";
import { useLocation } from "react-router-dom";
import { useGameContext } from "../contexts/GameContext";
import { useRoomContext } from "../contexts/RoomContext";
import { StatusBadge } from "./shared/StatusBadge";

const Header: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [notificationCenterOpen, setNotificationCenterOpen] = React.useState(false);
  const [currentToast, setCurrentToast] = React.useState<any>(null);
  const shownNotificationsRef = React.useRef<Set<string>>(new Set());
  
  const { notifications, unreadCount, markNotificationAsRead, fetchNotifications } = useNotifications();
  const { isGameActive } = useGameContext();
  const { roomStatus } = useRoomContext();
  
  // Mostrar badge "En línea" solo en el Home
  const showOnlineBadge = isAuthenticated && location.pathname === "/";
  
  // Detectar si estamos en la página de juego
  const isGamePage = location.pathname.startsWith("/game/");
  
  // Detectar si estamos en la página de selección de cartones (room)
  const isRoomPage = location.pathname.startsWith("/room/");

  // Manejar nuevas notificaciones en tiempo real - MOSTRAR INMEDIATAMENTE (sin duplicados)
  React.useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      
      // Verificar si ya se mostró esta notificación
      const alreadyShown = shownNotificationsRef.current.has(latestNotification._id);
      
      // Mostrar toast inmediatamente si la notificación es nueva (no leída) y no se ha mostrado antes
      if (!latestNotification.read && !alreadyShown && latestNotification._id !== currentToast?._id) {
        // Marcar como mostrada para evitar duplicados
        shownNotificationsRef.current.add(latestNotification._id);
        
        // Si hay un toast anterior, limpiarlo primero
        if (currentToast) {
          setCurrentToast(null);
          // Esperar un momento muy corto antes de mostrar el nuevo toast
          setTimeout(() => {
            setCurrentToast(latestNotification);
          }, 100);
        } else {
          // Mostrar inmediatamente si no hay toast anterior
          setCurrentToast(latestNotification);
        }
      }
    }
  }, [notifications, currentToast]);

  const handleToastClose = () => {
    // El toast se limpia automáticamente cuando se cierra
    setCurrentToast(null);
  };

  // Escuchar wallet-updated y mostrar notificación cuando se actualiza el balance
  // OPTIMIZACIÓN: Usar ref para fetchNotifications para evitar re-registros del listener
  const fetchNotificationsRef = React.useRef(fetchNotifications);
  React.useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const unsubscribe = onWalletUpdated(() => {
      // Recargar notificaciones desde la API para obtener la más reciente
      // Esto asegura que el contador se actualice y la notificación se muestre
      // El useEffect anterior se encargará de mostrar el toaster si hay una nueva notificación
      fetchNotificationsRef.current().catch((error) => {
        console.error("[Header] Error al recargar notificaciones:", error);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]); // Removido fetchNotifications de dependencias

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Toolbar Transparente */}
      <AppBar
        position="absolute"
        sx={{
          backgroundColor: "transparent",
          background: "transparent",
          boxShadow: "none",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          zIndex: 1300, // z-index más alto para asegurar que quede por encima de todo
        }}
      >
        <Toolbar
          sx={{
            minHeight: "64px !important",
            padding: "8px 16px !important",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          {/* Contenedor izquierdo: Campana + Jugadores */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {/* Botón de Notificaciones */}
            <IconButton
              onClick={() => setNotificationCenterOpen(true)}
              sx={{
                color: "#fcead0",
                backgroundColor: "transparent",
                background: "none",
                backgroundImage: "none",
                border: "none",
                borderRadius: "8px",
                padding: "8px",
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "transparent",
                  background: "none",
                  backgroundImage: "none",
                  boxShadow: "inset 0 2px 6px rgba(0, 0, 0, 0.3)",
                  transform: "translateY(-1px)",
                  "& .MuiSvgIcon-root": {
                    color: "#d4af37",
                  },
                },
                "& .MuiSvgIcon-root": {
                  color: "#fcead0",
                  transition: "color 0.3s ease",
                },
              }}
            >
              {unreadCount > 0 ? (
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "10px",
                      minWidth: "18px",
                      height: "18px",
                      padding: "0 4px",
                    },
                  }}
                >
                  <NotificationsIcon />
                </Badge>
              ) : (
                <NotificationsIcon />
              )}
            </IconButton>

          </Box>

          {/* Contenedor derecho: Status de sala, En Vivo o En línea */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Badge de Status de Sala (solo en página de selección de cartones) */}
            {isRoomPage && roomStatus && (
              <StatusBadge
                status={roomStatus}
                position="static"
              />
            )}

            {/* Badge "En Vivo" (solo en página de juego activa) */}
            {isGamePage && isGameActive && (
              <Chip
                icon={
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#f44336",
                      boxShadow: "0 0 8px rgba(244, 67, 54, 0.8)",
                      animation: "pulse 2s infinite",
                      "@keyframes pulse": {
                        "0%, 100%": {
                          opacity: 1,
                          transform: "scale(1)",
                        },
                        "50%": {
                          opacity: 0.7,
                          transform: "scale(1.2)",
                        },
                      },
                    }}
                  />
                }
                label="En Vivo"
                size="small"
                sx={{
                  backgroundColor: "rgba(76, 175, 80, 0.15)",
                  color: "#f44336",
                  border: "1px solid rgba(76, 175, 80, 0.3)",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  "& .MuiChip-icon": {
                    marginLeft: 1,
                  },
                }}
              />
            )}

            {/* Badge "En línea" (solo en Home) */}
            {showOnlineBadge && !isGamePage && (
              <Chip
                icon={
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#4caf50",
                      boxShadow: "0 0 8px rgba(76, 175, 80, 0.8)",
                    }}
                  />
                }
                label="En línea"
                size="small"
                sx={{
                  backgroundColor: "rgba(76, 175, 80, 0.15)",
                  color: "#4caf50",
                  border: "1px solid rgba(76, 175, 80, 0.3)",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  "& .MuiChip-icon": {
                    marginLeft: 1,
                  },
                }}
              />
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Notification Center */}
      <NotificationCenter
        open={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
      />

      {/* Notification Toast */}
      {currentToast && (
        <NotificationToast
          notification={currentToast}
          onClose={handleToastClose}
          onMarkAsRead={markNotificationAsRead}
        />
      )}
    </>
  );
};

export default Header;

