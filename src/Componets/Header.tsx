// src/Componets/Header.tsx
import * as React from "react";
import { Box, Badge, IconButton } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import NotificationCenter from "./NotificationCenter";
import NotificationToast from "./NotificationToast";
import { onWalletUpdated } from "../Services/socket.service";

const Header: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [notificationCenterOpen, setNotificationCenterOpen] = React.useState(false);
  const [currentToast, setCurrentToast] = React.useState<any>(null);
  const shownNotificationsRef = React.useRef<Set<string>>(new Set());
  
  const { notifications, unreadCount, markNotificationAsRead, fetchNotifications } = useNotifications();

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
  React.useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const unsubscribe = onWalletUpdated(() => {
      // Recargar notificaciones desde la API para obtener la más reciente
      // Esto asegura que el contador se actualice y la notificación se muestre
      // El useEffect anterior se encargará de mostrar el toaster si hay una nueva notificación
      fetchNotifications().catch((error) => {
        console.error("[Header] Error al recargar notificaciones:", error);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, fetchNotifications]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Botón de Notificaciones en la parte superior izquierda */}
      <Box
        sx={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 1000,
        }}
      >
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

