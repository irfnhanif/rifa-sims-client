import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        fontFamily: "Roboto, sans-serif",
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            textAlign: "center",
            py: 8,
          }}
        >
          {/* Error Code */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "6rem", sm: "8rem", md: "9rem" },
              fontWeight: "100",
              color: "#9ca3af",
              lineHeight: 1,
              mb: 2,
              letterSpacing: "-0.025em",
            }}
          >
            404
          </Typography>

          {/* Divider */}
          <Box
            sx={{
              width: "1px",
              height: "2rem",
              backgroundColor: "#e5e7eb",
              mx: "auto",
              mb: 2,
            }}
          />

          {/* Error Message */}
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: "1.125rem", sm: "1.25rem" },
              fontWeight: "400",
              color: "#6b7280",
              mb: 4,
              letterSpacing: "0.025em",
            }}
          >
            NOT FOUND
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              fontSize: "1rem",
              color: "#9ca3af",
              mb: 6,
              maxWidth: "400px",
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            Halaman yang Anda cari tidak dapat ditemukan.{" "}
            {/* cspell:disable-line */}
            Mungkin halaman tersebut telah dipindahkan atau dihapus.{" "}
            {/* cspell:disable-line */}
          </Typography>

          {/* Action Buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{
                px: 4,
                py: 1.5,
                borderColor: "#d1d5db",
                color: "#6b7280",
                fontSize: "0.875rem",
                fontWeight: "500",
                textTransform: "none",
                borderRadius: "0.375rem",
                "&:hover": {
                  borderColor: "#9ca3af",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              Kembali {/* cspell:disable-line */}
            </Button>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{
                px: 4,
                py: 1.5,
                backgroundColor: "#2D3648",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: "500",
                textTransform: "none",
                borderRadius: "0.375rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                "&:hover": {
                  backgroundColor: "#1E2532",
                  boxShadow:
                    "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                },
              }}
            >
              Beranda {/* cspell:disable-line */}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFoundPage;
