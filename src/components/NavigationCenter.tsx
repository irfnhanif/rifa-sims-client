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
  Settings as SettingsIcon,
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

const NotificationCenter: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchAllNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds
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

  const unreadCount = notifications.filter((n) => !n.read).length;
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
        return <InventoryIcon color="warning" />;
      case "NEW_USER":
        return <PersonAddIcon color="info" />;
      case "SYSTEM_EVENT":
        return <SettingsIcon color="primary" />;
      default:
        return <CircleIcon />;
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
      case "SYSTEM_EVENT":
        return "primary";
      default:
        return "default";
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Baru saja"; /* cspell:disable-line */
    if (diffInMinutes < 60)
      return `${diffInMinutes} menit yang lalu`; /* cspell:disable-line */
    if (diffInMinutes < 1440)
      return `${Math.floor(
        diffInMinutes / 60
      )} jam yang lalu`; /* cspell:disable-line */
    return `${Math.floor(
      diffInMinutes / 1440
    )} hari yang lalu`; /* cspell:disable-line */
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ color: "white" }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            mt: 1,
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
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifikasi {/* cspell:disable-line */}
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                Tandai Semua Dibaca {/* cspell:disable-line */}
              </Button>
            )}
          </Box>

          <Divider />

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography color="text.secondary">
                Tidak ada notifikasi {/* cspell:disable-line */}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0, maxHeight: 350, overflow: "auto" }}>
              {notifications.map((notification) => (
                <ListItem key={notification.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      bgcolor: notification.read
                        ? "transparent"
                        : "action.hover",
                      "&:hover": {
                        bgcolor: "action.selected",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.type.replace("_", " ")}
                            size="small"
                            color={getNotificationColor(notification.type)}
                            variant="outlined"
                          />
                          {!notification.read && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: "primary.main",
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatTimeAgo(notification.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationCenter;
