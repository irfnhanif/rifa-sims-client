import React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  useTheme,
  Alert,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../helper/use-auth";
import { fetchUserByUsername } from "../../api/users";

// Icons for list items
import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import WorkIcon from "@mui/icons-material/Work";

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const primaryDarkColor = "#2D3648";
  const robotoFontFamily = "Roboto, sans-serif";

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userProfile", authUser?.username],
    queryFn: () => {
      if (!authUser?.username) {
        throw new Error("No authenticated user found");
      }
      return fetchUserByUsername(authUser.username);
    },
    enabled: !!authUser?.username,
  });

  const handleEditProfile = () => {
    navigate("/users/profile/edit", { state: { user: user } });
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const getBranchName = (branchNumber: number): string => {
    switch (branchNumber) {
      case 1:
        return "Cabang 1"; /* cspell:disable-line */
      case 2:
        return "Cabang 2"; /* cspell:disable-line */
      default:
        return `Cabang ${branchNumber}`; /* cspell:disable-line */
    }
  };

  const getRoleName = (role: string): string => {
    // Convert role enum to readable format
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "USER":
        return "Pengguna"; /* cspell:disable-line */
      case "OWNER":
        return "Pemilik"; /* cspell:disable-line */
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Header title="Error" onBackClick={handleBackClick} />
        <Container sx={{ py: 3 }}>
          <Alert severity="error">
            Gagal memuat profil pengguna: {error.message || "Unknown error"}{" "}
            {/* cspell:disable-line */}
          </Alert>
        </Container>
        <Footer />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Header title="Tidak Ditemukan" onBackClick={handleBackClick} />{" "}
        {/* cspell:disable-line */}
        <Container sx={{ py: 3 }}>
          <Alert severity="warning">
            Profil pengguna tidak ditemukan. {/* cspell:disable-line */}
          </Alert>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor:
          theme.palette.mode === "light"
            ? theme.palette.grey[100]
            : theme.palette.background.default,
      }}
    >
      <Header
        title="Profil Saya" /* cspell:disable-line */
        showBackButton={true}
        onBackClick={handleBackClick}
      />

      <Container
        component="main"
        maxWidth="sm"
        sx={{
          flexGrow: 1,
          py: { xs: 3, md: 4 },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Paper
          elevation={4}
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            p: { xs: 2.5, sm: 4 },
            borderRadius: "8px",
          }}
        >
          {/* Avatar and Name Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Avatar
              sx={{
                width: 100,
                height: 100,
                mb: 2,
                fontSize: "2.5rem",
                backgroundColor: primaryDarkColor,
                color: "white",
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontFamily: robotoFontFamily,
                fontWeight: "700",
                fontSize: "20px",
                color: "black",
                lineHeight: "28px",
                textAlign: "center",
              }}
            >
              {user.username}
            </Typography>
          </Box>
          <Divider />

          {/* Details Section */}
          <List sx={{ mt: 2 }}>
            {/* Username */}
            <ListItem>
              <ListItemIcon sx={{ color: primaryDarkColor }}>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                primary="Username"
                secondary={user.username}
                slotProps={{
                  primary: {
                    fontFamily: robotoFontFamily,
                    fontWeight: "600",
                    fontSize: "14px",
                    color: primaryDarkColor,
                  },
                  secondary: {
                    fontFamily: robotoFontFamily,
                    fontWeight: "500",
                    fontSize: "16px",
                    color: theme.palette.text.primary,
                  },
                }}
              />
            </ListItem>

            {/* Branch */}
            <ListItem>
              <ListItemIcon sx={{ color: primaryDarkColor }}>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText
                primary="Cabang" /* cspell:disable-line */
                secondary={getBranchName(user.branch)}
                slotProps={{
                  primary: {
                    fontFamily: robotoFontFamily,
                    fontWeight: "600",
                    fontSize: "14px",
                    color: primaryDarkColor,
                  },
                  secondary: {
                    fontFamily: robotoFontFamily,
                    fontWeight: "500",
                    fontSize: "16px",
                    color: theme.palette.text.primary,
                  },
                }}
              />
            </ListItem>

            {/* Role */}
            <ListItem>
              <ListItemIcon sx={{ color: primaryDarkColor }}>
                <WorkIcon />
              </ListItemIcon>
              <ListItemText
                primary="Jabatan" /* cspell:disable-line */
                secondary={getRoleName(user.role)}
                slotProps={{
                  primary: {
                    fontFamily: robotoFontFamily,
                    fontWeight: "600",
                    fontSize: "14px",
                    color: primaryDarkColor,
                  },
                  secondary: {
                    fontFamily: robotoFontFamily,
                    fontWeight: "500",
                    fontSize: "16px",
                    color: theme.palette.text.primary,
                  },
                }}
              />
            </ListItem>
          </List>

          <Box sx={{ flexGrow: 1 }} />

          {/* Action Button */}
          <Box sx={{ mt: 4, width: "100%" }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditProfile}
              sx={{
                backgroundColor: primaryDarkColor,
                color: "white",
                fontSize: "18px",
                fontFamily: robotoFontFamily,
                fontWeight: "700",
                lineHeight: "24px",
                padding: "16px 24px",
                borderRadius: "6px",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#1E2532",
                },
              }}
            >
              Edit Profil {/* cspell:disable-line */}
            </Button>
          </Box>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
};

export default ProfilePage;
