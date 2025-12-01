import { Box, Typography, Stack, Chip } from "@mui/material";
import * as React from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import CelebrationIcon from "@mui/icons-material/Celebration";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { type Notification } from "../Services/notifications.service";

interface NotificationToastProps {
  notification: Notification | null;
  onClose: () => void;
  onMarkAsRead?: (notificationId: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onMarkAsRead,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isExiting, setIsExiting] = React.useState(false);
  const [isEntering, setIsEntering] = React.useState(true);

  React.useEffect(() => {
    const enterTimer = setTimeout(() => {
      setIsEntering(false);
    }, 50);

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        // Marcar como leída si existe el callback
        if (notification && onMarkAsRead && !notification.read) {
          onMarkAsRead(notification._id);
        }
        onClose();
      }, 400);
    }, 5000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [onClose, notification, onMarkAsRead]);

  if (!notification || !isVisible) return null;

  // Determinar el icono según el tipo de notificación
  const getIcon = () => {
    switch (notification.type) {
      case "transaction_approved":
      case "prize_received":
        return <CheckCircleIcon />;
      case "transaction_rejected":
        return <CancelIcon />;
      case "game_started":
        return <SportsEsportsIcon />;
      case "bingo_claimed":
        return <CelebrationIcon />;
      default:
        return <NotificationsIcon />;
    }
  };

  const icon = getIcon();
  
  // Color según el tipo de notificación
  // Rojo para transacciones rechazadas, dorado para el resto
  const isRejected = notification.type === "transaction_rejected" || notification.type === "balance_low";
  const primaryColor = isRejected ? "#f44336" : "#d4af37";

  return (
    <Box
      onClick={() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          if (notification && onMarkAsRead && !notification.read) {
            onMarkAsRead(notification._id);
          }
          onClose();
        }, 400);
      }}
      sx={{
        position: "fixed",
        top: 10,
        left: "50%",
        transform: isEntering 
          ? "translateX(calc(-50% - 100vw)) scale(0.9)" 
          : isExiting 
          ? "translateX(calc(-50% - 100vw)) scale(0.95)" 
          : "translateX(-50%) scale(1)",
        zIndex: 10000,
        minWidth: "300px",
        width: "calc(100% - 40px)",
        maxWidth: { xs: "calc(100% - 40px)", sm: "400px" },
        backgroundColor: "rgba(26, 29, 46, 0.85)",
        border: `1px solid ${isRejected ? "rgba(244, 67, 54, 0.3)" : "rgba(212, 175, 55, 0.3)"}`,
        borderRadius: "12px",
        padding: 2,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: isEntering ? 0 : isExiting ? 0 : 1,
        backdropFilter: "blur(10px) saturate(180%)",
        WebkitBackdropFilter: "blur(10px) saturate(180%)",
        overflow: "hidden",
        pointerEvents: "auto",
        cursor: "pointer",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${isRejected ? "rgba(244, 67, 54, 0.1)" : "rgba(212, 175, 55, 0.1)"} 0%, ${isRejected ? "rgba(244, 67, 54, 0.05)" : "rgba(212, 175, 55, 0.05)"} 100%)`,
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ color: primaryColor, display: "flex", alignItems: "center" }}>
            {icon}
          </Box>
          <Box>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600, 
                mb: 0.5,
                color: primaryColor,
              }}
            >
              {notification.title}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.8,
                color: primaryColor,
              }}
            >
              {notification.message}
            </Typography>
          </Box>
        </Box>
        {!notification.read && (
          <Chip 
            label={isRejected ? "Rechazada" : "Nueva"} 
            size="small" 
            sx={{ 
              backgroundColor: isRejected ? "rgba(244, 67, 54, 0.2)" : "rgba(212, 175, 55, 0.2)",
              color: primaryColor,
              border: `1px solid ${isRejected ? "rgba(244, 67, 54, 0.4)" : "rgba(212, 175, 55, 0.4)"}`,
            }}
          />
        )}
      </Stack>
    </Box>
  );
};

export default NotificationToast;

