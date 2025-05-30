import React from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  useTheme,
} from "@mui/material";

// Icons
import NotificationsIcon from "@mui/icons-material/Notifications";
import ListAltIcon from "@mui/icons-material/ListAlt";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import HistoryIcon from "@mui/icons-material/History";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
}

const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate()

  const navigationItems: NavItem[] = [
    { id: "items", label: "Daftar Barang", icon: <ListAltIcon />, path: "/items" },
    { id: "stocks", label: "Stok Barang", icon: <InventoryIcon />, path: "/item-stocks" },
    {
      id: "riwayat-perubahan",
      label: "Riwayat Perubahan",
      icon: <HistoryIcon />,
      path: "/stock-change-history"
    },
    { id: "scan-barcode", label: "Scan Barcode", icon: <QrCodeScannerIcon />, path: "scan" },
  ];

  const primaryColor = "#2D3648";
  const primaryColorHover = "#1E2532";

  const handleNavigation = (path: string) => {
    navigate(path)
  }

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
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            Rifa-SIMS
          </Typography>
          <IconButton color="inherit" aria-label="notifications">
            <Badge badgeContent={1} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

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
          Menu Utama
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
          {navigationItems.map((item) => (
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
          &copy; {new Date().getFullYear()} Rifa-SIMS. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default HomePage;
