import * as React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Badge,
  Divider,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import CelebrationIcon from "@mui/icons-material/Celebration";
import DeleteIcon from "@mui/icons-material/Delete";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNotifications } from "../hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// Si el locale no está disponible, usar una función de fallback
const formatTimeAgoSafe = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: es,
    });
  } catch (error) {
    // Fallback si hay problemas con el locale
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
      });
    } catch {
      return "Hace un momento";
    }
  }
};

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    fetchNotifications,
  } = useNotifications();

  // Recargar notificaciones cuando se abre el panel
  // OPTIMIZACIÓN: Usar ref para evitar re-registros
  const fetchNotificationsRef = React.useRef(fetchNotifications);
  const markAllAsReadRef = React.useRef(markAllNotificationsAsRead);
  
  React.useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
    markAllAsReadRef.current = markAllNotificationsAsRead;
  }, [fetchNotifications, markAllNotificationsAsRead]);

  React.useEffect(() => {
    if (open) {
      fetchNotificationsRef.current();
      // ISSUE-3: Marcar todas las notificaciones como leídas automáticamente al abrir el panel
      // Usar un pequeño delay para que primero se carguen las notificaciones
      const timer = setTimeout(() => {
        markAllAsReadRef.current().catch((err) => {
          console.error("Error al marcar todas como leídas automáticamente:", err);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  const handleDelete = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await removeNotification(notificationId);
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "transaction_approved":
      case "prize_received":
        return <CheckCircleIcon sx={{ color: "#4caf50" }} />;
      case "transaction_rejected":
        return <CancelIcon sx={{ color: "#f44336" }} />;
      case "game_started":
        return <SportsEsportsIcon sx={{ color: "#2196f3" }} />;
      case "bingo_claimed":
        return <CelebrationIcon sx={{ color: "#ff9800" }} />;
      default:
        return null;
    }
  };

  const formatTimeAgo = formatTimeAgoSafe;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: "400px" },
          maxWidth: "100%",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" component="div">
              Notificaciones
            </Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error">
                <Box />
              </Badge>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Actions */}
        {notifications.length > 0 && unreadCount > 0 && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Button
              startIcon={<MarkEmailReadIcon />}
              onClick={handleMarkAllAsRead}
              size="small"
              variant="outlined"
              fullWidth
            >
              Marcar todas como leídas
            </Button>
          </Box>
        )}

        {/* Content */}
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 4,
              }}
            >
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <NotificationsIcon sx={{ fontSize: 60, mb: 2, color: "text.secondary", opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                No tienes notificaciones
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cuando algo importante suceda, lo verás aquí.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification._id}>
                  <ListItem
                    disablePadding
                    sx={{
                      bgcolor: notification.read ? "transparent" : "action.hover",
                      "&:hover": {
                        bgcolor: "action.selected",
                      },
                    }}
                  >
                    <ListItemButton
                      onClick={() => {
                        if (!notification.read) {
                          handleMarkAsRead(notification._id);
                        }
                      }}
                      sx={{ py: 1.5, px: 2 }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, width: "100%" }}>
                        {/* Icon */}
                        <Box sx={{ mt: 0.5 }}>
                          {getNotificationIcon(notification.type)}
                        </Box>

                        {/* Content */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: notification.read ? 400 : 600,
                                color: notification.read ? "text.secondary" : "text.primary",
                              }}
                            >
                              {notification.title}
                            </Typography>
                            {!notification.read && (
                              <Chip
                                label="Nueva"
                                size="small"
                                color="error"
                                sx={{ height: 18, fontSize: "0.65rem", ml: 1 }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(notification.created_at)}
                          </Typography>
                        </Box>

                        {/* Delete button */}
                        <IconButton
                          size="small"
                          onClick={(e) => handleDelete(notification._id, e)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default NotificationCenter;

