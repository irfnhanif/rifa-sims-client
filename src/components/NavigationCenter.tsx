/* cspell:disable-next-line */
import React, { useState } from "react";
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Inventory as InventoryIcon,
  PersonAdd as PersonAddIcon,
  Circle as CircleIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllNotifications,
  markAsRead,
  markAllAsRead,
} from "../api/notifications";
import type {
  SystemNotification,
  NotificationType,
} from "../types/notification";
import { useAuth } from "../helper/use-auth";
import { UserRole } from "../types/user-role";

const NotificationCenter: React.FC = () => {
  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(
    null
  );
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isOwner = user?.roles?.includes(UserRole.OWNER) ?? false;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchAllNotifications,
    refetchInterval: 30000,
    enabled: isOwner,
  });

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (!isOwner) {
    return null;
  }

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);
  const unreadCount = unreadNotifications.length;

  const open = Boolean(anchorElement);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElement(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorElement(null);
  };

  const handleNotificationClick = (notification: SystemNotification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "LOW_STOCK":
        return <InventoryIcon sx={{ color: "#f57c00", fontSize: 20 }} />;
      case "NEW_USER":
        return <PersonAddIcon sx={{ color: "#1976d2", fontSize: 20 }} />;
      default:
        return <CircleIcon sx={{ color: "#9e9e9e", fontSize: 20 }} />;
    }
  };

  const getNotificationColor = (
    type: NotificationType
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    switch (type) {
      case "LOW_STOCK":
        return "warning";
      case "NEW_USER":
        return "info";
      default:
        return "default";
    }
  };

  const renderFormattedMessage = (message: string, type: NotificationType) => {
    if (type === "LOW_STOCK") {
      const lines = message.split("\n");
      return (
        <Box component="span">
          {lines.map((line, index) => {
            const formattedLine =
              index === 0
                ? line
                : line.replace(
                    /(\d+)/g,
                    '<span style="font-weight: 700;">$1</span>'
                  );

            return (
              <Typography
                key={index}
                variant="body2"
                color="text.secondary"
                component="span"
                sx={{
                  mb: index === lines.length - 1 ? 0.5 : 0.25,
                  display: "block",
                  fontSize: "0.8rem",
                }}
                dangerouslySetInnerHTML={{ __html: formattedLine }}
              />
            );
          })}
        </Box>
      );
    } else if (type === "NEW_USER") {
      /* cspell:disable-next-line */
      const userPattern = /Pengguna\s+(\S+)/;
      const match = message.match(userPattern);

      if (match) {
        const username = match[1];
        const formattedMessage = message.replace(
          username,
          `<span style="color: #1976d2; font-weight: 500;">${username}</span>`
        );

        return (
          <Typography
            variant="body2"
            color="text.secondary"
            component="span"
            sx={{
              mb: 0.5,
              whiteSpace: "pre-line",
              display: "block",
              fontSize: "0.8rem",
            }}
            dangerouslySetInnerHTML={{ __html: formattedMessage }}
          />
        );
      }
    }

    return (
      <Typography
        variant="body2"
        color="text.secondary"
        component="span"
        sx={{
          mb: 0.5,
          whiteSpace: "pre-line",
          display: "block",
          fontSize: "0.8rem",
        }}
      >
        {message}
      </Typography>
    );
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    /* cspell:disable */
    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} jam yang lalu`;
    return `${Math.floor(diffInMinutes / 1440)} hari yang lalu`;
    /* cspell:enable */
  };

  const renderNotificationItem = (notification: SystemNotification) => (
    <ListItem key={notification.id} disablePadding>
      <ListItemButton
        onClick={() => handleNotificationClick(notification)}
        sx={{
          borderRadius: 1,
          mb: 0.5,
          bgcolor: notification.read
            ? "transparent"
            : "rgba(25, 118, 210, 0.04)",
          border: notification.read
            ? "1px solid transparent"
            : "1px solid rgba(25, 118, 210, 0.12)",
          "&:hover": {
            bgcolor: notification.read
              ? "rgba(0, 0, 0, 0.04)"
              : "rgba(25, 118, 210, 0.08)",
          },
          transition: "all 0.2s ease-in-out",
        }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          {getNotificationIcon(notification.type)}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                mb: 0.5,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: notification.read ? 500 : 600,
                  flexGrow: 1,
                  whiteSpace: "pre-line",
                  lineHeight: 1.3,
                  fontSize: "0.85rem",
                  color: notification.read ? "text.secondary" : "text.primary",
                }}
              >
                {notification.title}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Chip
                  label={notification.type.replace("_", " ")}
                  size="small"
                  color={getNotificationColor(notification.type)}
                  variant={notification.read ? "outlined" : "filled"}
                  sx={{
                    fontSize: "0.7rem",
                    height: 20,
                    opacity: notification.read ? 0.7 : 1,
                  }}
                />
                {!notification.read && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: "#1976d2",
                      flexShrink: 0,
                      alignSelf: "flex-start",
                      mt: 0.5,
                    }}
                  />
                )}
              </Box>
            </Box>
          }
          secondary={
            <Box component="span">
              {renderFormattedMessage(notification.message, notification.type)}
              <Typography
                variant="caption"
                color="text.disabled"
                component="span"
                sx={{
                  display: "block",
                  fontSize: "0.7rem",
                  opacity: notification.read ? 0.6 : 0.8,
                }}
              >
                {formatTimeAgo(notification.createdAt)}
              </Typography>
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );

  return (
    <>
      <IconButton color="inherit" onClick={handleClick} sx={{ color: "white" }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorElement}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              width: 420,
              maxHeight: 500,
              mt: 1,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, fontSize: "1.1rem" }}
            >
              {/* cspell:disable-next-line */}
              Notifikasi
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                sx={{
                  fontSize: "0.75rem",
                  textTransform: "none",
                  color: "#1976d2",
                }}
              >
                {/* cspell:disable-next-line */}
                Tandai Semua Dibaca
              </Button>
            )}
          </Box>

          <Divider sx={{ mb: 1 }} />

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
                {/* cspell:disable-next-line */}
                Tidak ada notifikasi
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 350, overflow: "auto" }}>
              {unreadNotifications.length > 0 && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      color: "text.primary",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {/* cspell:disable-next-line */}
                    Belum Dibaca ({unreadNotifications.length})
                  </Typography>
                  <List sx={{ p: 0, mb: 1 }}>
                    {unreadNotifications.map(renderNotificationItem)}
                  </List>
                </>
              )}

              {unreadNotifications.length > 0 &&
                readNotifications.length > 0 && (
                  <Divider sx={{ my: 2, borderColor: "rgba(0, 0, 0, 0.08)" }} />
                )}

              {readNotifications.length > 0 && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      color: "text.secondary",
                      fontWeight: 500,
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      opacity: 0.8,
                    }}
                  >
                    {/* cspell:disable-next-line */}
                    Sudah Dibaca ({readNotifications.length})
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {readNotifications.map(renderNotificationItem)}
                  </List>
                </>
              )}
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationCenter;
