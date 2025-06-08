import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  IconButton,
  Avatar,
  Drawer,
  Divider,
  ListItem,
} from "@mui/material";

// Icons
import ListAltIcon from "@mui/icons-material/ListAlt";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import HistoryIcon from "@mui/icons-material/History";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import WarningIcon from "@mui/icons-material/Warning";
import PeopleIcon from "@mui/icons-material/People";

import { useNavigate } from "react-router-dom";

// Import NotificationCenter component and auth
import NotificationCenter from "../components/NavigationCenter";
import { useAuth } from "../helper/use-auth";
import type { UserInfo } from "../types/user";
import { UserRole } from "../types/user-role";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
  ownerOnly?: boolean;
}

interface ProfileMenuItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  action: () => void;
  color?: string;
  ownerOnly?: boolean;
}

const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    setIsOwner(user?.roles[0] === UserRole.OWNER);
  }, [user?.roles]);

  const navigationItems: NavItem[] = [
    {
      id: "items",
      label: "Daftar Barang" /* cspell:disable-line */,
      icon: <ListAltIcon />,
      path: "/items",
    },
    {
      id: "stocks",
      label: "Stok Barang" /* cspell:disable-line */,
      icon: <InventoryIcon />,
      path: "/stocks",
    },
    {
      id: "riwayat-perubahan" /* cspell:disable-line */,
      label: "Riwayat Perubahan" /* cspell:disable-line */,
      icon: <HistoryIcon />,
      path: "/stock-change-history",
      ownerOnly: true,
    },
    {
      id: "scan-barcode",
      label: "Scan Barcode",
      icon: <QrCodeScannerIcon />,
      path: "/scan",
    },
  ];

  const primaryColor = "#2D3648";
  const primaryColorHover = "#1E2532";

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleProfileDrawerToggle = () => {
    setIsProfileDrawerOpen(!isProfileDrawerOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const profileMenuItems: ProfileMenuItem[] = [
    {
      id: "profile",
      label: "Profil Saya" /* cspell:disable-line */,
      icon: <PersonIcon />,
      action: () => {
        setIsProfileDrawerOpen(false);
        navigate("/users/profile");
      },
    },
    {
      id: "near-empty-stocks",
      label: "Daftar Stok Barang Habis" /* cspell:disable-line */,
      icon: <WarningIcon />,
      action: () => {
        setIsProfileDrawerOpen(false);
        navigate("/near-empty-stocks");
      },
      ownerOnly: true,
    },
    {
      id: "users",
      label: "Daftar Pengguna" /* cspell:disable-line */,
      icon: <PeopleIcon />,
      action: () => {
        setIsProfileDrawerOpen(false);
        navigate("/users");
      },
      ownerOnly: true,
    },
    {
      id: "logout",
      label: "Keluar" /* cspell:disable-line */,
      icon: <LogoutIcon />,
      action: handleLogout,
      color: "#d32f2f", // Error red color
    },
  ];

  const filteredNavigationItems = navigationItems.filter(
    (item) => !item.ownerOnly || isOwner
  );

  const filteredProfileMenuItems = profileMenuItems.filter(
    (item) => !item.ownerOnly || isOwner
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100vw",
        backgroundColor:
          theme.palette.mode === "light"
            ? theme.palette.grey[100]
            : theme.palette.background.default,
      }}
    >
      <AppBar position="static" sx={{ backgroundColor: primaryColor }}>
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={handleProfileDrawerToggle}
            sx={{
              mr: 0,
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                fontSize: "0.875rem",
              }}
            >
              {user?.username ? (
                user.username.charAt(0).toUpperCase()
              ) : (
                <AccountCircleIcon />
              )}
            </Avatar>
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            Rifa-SIMS {/* cspell:disable-line */}
          </Typography>

          {isOwner && <NotificationCenter />}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="top"
        open={isProfileDrawerOpen}
        onClose={handleProfileDrawerToggle}
        slotProps={{
          paper: {
            sx: {
              width: "100%",
              margin: "0 auto",
              borderRadius: "0 0 12px 12px",
              boxShadow: theme.shadows[8],
            },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Khusus Pengguna {/* cspell:disable-line */}
            </Typography>
            <IconButton
              onClick={handleProfileDrawerToggle}
              size="small"
              sx={{ color: "text.secondary" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* User Info */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              p: 2,
              backgroundColor: theme.palette.grey[50],
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Avatar
              sx={{
                width: 48,
                height: 48,
                backgroundColor: primaryColor,
                mr: 2,
              }}
            >
              {user?.username ? (
                user.username.charAt(0).toUpperCase()
              ) : (
                <AccountCircleIcon />
              )}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {user?.username || "User"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.roles || "No roles"}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 1 }} />

          <List sx={{ p: 0 }}>
            {filteredProfileMenuItems.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  onClick={item.action}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: item.color || "text.primary",
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={{
                      "& .MuiTypography-root": {
                        color: item.color || "text.primary",
                        fontWeight: item.id === "logout" ? 600 : 400,
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          px: 2,
          py: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{
            mb: { xs: 2, sm: 3 },
            color: primaryColor,
            fontWeight: "medium",
            textAlign: "center",
          }}
        >
          Menu Utama {/* cspell:disable-line */}
        </Typography>

        <List
          component="nav"
          aria-label="main navigation"
          sx={{
            padding: 0,
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          {filteredNavigationItems.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              sx={{
                backgroundColor: primaryColor,
                color: "white",
                borderRadius: "8px",
                mb: 1.5,
                boxShadow: `0 2px 4px ${
                  theme.palette.mode === "light"
                    ? "rgba(0,0,0,0.1)"
                    : "rgba(0,0,0,0.3)"
                }`,
                transition:
                  "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                py: 1.5,
                px: 2,
                "&:hover": {
                  backgroundColor: primaryColorHover,
                  transform: "translateY(-2px)",
                  boxShadow: `0 4px 8px ${
                    theme.palette.mode === "light"
                      ? "rgba(0,0,0,0.15)"
                      : "rgba(0,0,0,0.4)"
                  }`,
                },
                display: "flex",
                alignItems: "center",
              }}
            >
              <ListItemIcon sx={{ color: "white", minWidth: "auto", mr: 1.5 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    fontWeight: "medium",
                    fontSize: "1.1rem",
                  },
                }}
              />
              <ChevronRightIcon sx={{ ml: "auto", opacity: 0.7 }} />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box
        component="footer"
        sx={{
          py: 2,
          textAlign: "center",
          backgroundColor:
            theme.palette.mode === "light"
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
          borderTop: `1px solid ${theme.palette.divider}`,
          mt: "auto",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} Rifa-SIMS.{" "}
          {/* cspell:disable-line */}
          All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default HomePage;
