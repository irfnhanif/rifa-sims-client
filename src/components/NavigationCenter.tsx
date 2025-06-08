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

  const unreadCount = notifications.filter((n) => !n.read).length;
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
        return <InventoryIcon color="error" />;
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
        return "error";
      case "NEW_USER":
        return "info";
      case "SYSTEM_EVENT":
        return "primary";
      default:
        return "default";
    }
  };

  const renderFormattedMessage = (message: string, type: NotificationType) => {
    if (type === "LOW_STOCK") {
      const lines = message.split("\n");
      return (
        <Box component="div">
          {lines.map((line, index) => {
            const formattedLine = line.replace(
              /(\d+)/g,
              '<span style="color: #d32f2f; font-weight: 600;">$1</span>'
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
                }}
                dangerouslySetInnerHTML={{ __html: formattedLine }}
              />
            );
          })}
        </Box>
      );
    } else if (type === "NEW_USER") {
      const userPattern = /Pengguna\s+(\S+)/; /* cspell:disable-line */
      const match = message.match(userPattern);

      if (match) {
        const username = match[1];
        const formattedMessage = message.replace(
          username,
          `<span style="color: #0288d1; font-weight: 600;">${username}</span>`
        );

        return (
          <Typography
            variant="body2"
            color="text.secondary"
            component="span"
            sx={{ mb: 0.5, whiteSpace: "pre-line", display: "block" }}
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
        sx={{ mb: 0.5, whiteSpace: "pre-line", display: "block" }}
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
              width: 400,
              maxHeight: 500,
              mt: 1,
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
                            alignItems: "flex-start",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              flexGrow: 1,
                              whiteSpace: "pre-line",
                              lineHeight: 1.2,
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
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
                                  flexShrink: 0,
                                  alignSelf: "flex-start",
                                  mt: 0.25,
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box component="div">
                          {renderFormattedMessage(
                            notification.message,
                            notification.type
                          )}
                          <Typography
                            variant="caption"
                            color="text.disabled"
                            component="span"
                            sx={{ display: "block" }}
                          >
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
