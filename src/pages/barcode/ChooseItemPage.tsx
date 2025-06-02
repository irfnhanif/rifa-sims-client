import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  useTheme,
  Alert,
  Radio,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import type { BarcodeScanResponse } from "../../types/item-stock";

interface LocationState {
  items?: BarcodeScanResponse[];
  barcode?: string;
}

const ChooseItemPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const { items = [], barcode } = (location.state as LocationState) || {};

  const primaryDarkColor = "#2D3648";
  const lightButtonBackground = "#EDF0F7";
  const cardOutlineColor = primaryDarkColor;
  const cardSelectedOutlineColor = theme.palette.primary.main;

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId === selectedItemId ? null : itemId);
  };

  const handleContinue = () => {
    if (selectedItemId) {
      const selectedItem = items.find(
        (item) => item.itemStockId === selectedItemId
      );
      if (selectedItem) {
        navigate(`/scan/${selectedItem.itemStockId}/input`, {
          state: { itemName: selectedItem.itemName, barcode: barcode },
        });
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const robotoFontFamily = "Roboto, sans-serif";

  const itemCardNameStyle = {
    fontFamily: robotoFontFamily,
    fontWeight: "700",
    fontSize: "18px",
    color: primaryDarkColor,
    lineHeight: 1.4,
    minHeight: "32px",
    display: "flex",
    alignItems: "center",
  };

  const itemCardDetailStyle = {
    fontFamily: robotoFontFamily,
    fontWeight: "400",
    fontSize: "13px",
    color: theme.palette.text.secondary,
    lineHeight: 1.3,
    minHeight: "16px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const itemCardDetailLabelStyle = {
    ...itemCardDetailStyle,
    fontWeight: "600",
    color: primaryDarkColor,
  };

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
        title="Daftar Barang" // cspell:disable-line
        showBackButton={true}
        onBackClick={handleCancel}
      />

      <Container
        component="main"
        maxWidth="md"
        sx={{
          flexGrow: 1,
          py: { xs: 2, md: 3 },
          display: "flex",
          flexDirection: "column",
        }}
      >
        {items.length === 0 && (
          <Alert severity="warning" sx={{ m: 2 }}>
            Tidak ada barang yang tersedia untuk dipilih.{" "}
            {/* cspell:disable-line */}
          </Alert>
        )}

        {items.length > 0 && (
          <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 1 }}>
            <Box display="flex" flexDirection="column" gap={theme.spacing(1.5)}>
              {items.map((item) => (
                <Paper
                  elevation={selectedItemId === item.itemStockId ? 4 : 1}
                  key={item.itemStockId}
                  onClick={() => handleItemSelect(item.itemStockId)}
                  sx={{
                    padding: { xs: "18px 16px", sm: "18px 24px" },
                    background: "white",
                    borderRadius: "8px",
                    border: `2px solid ${
                      selectedItemId === item.itemStockId
                        ? cardSelectedOutlineColor
                        : cardOutlineColor
                    }`,
                    cursor: "pointer",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Radio
                    checked={selectedItemId === item.itemStockId}
                    value={item.itemStockId}
                    name="selected-item-radio"
                    slotProps={{ input: { "aria-label": item.itemName } }}
                    size="small"
                  />
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <Typography sx={itemCardNameStyle}>
                      {item.itemName}
                    </Typography>
                    <Box
                      display="flex"
                      flexDirection={{ xs: "column", sm: "row" }}
                      gap={{ xs: 0.5, sm: 1.5 }}
                    >
                      <Box sx={{ flex: { sm: 1 } }}>
                        <Typography sx={itemCardDetailLabelStyle}>
                          Stock ID:
                        </Typography>
                        <Typography sx={itemCardDetailStyle}>
                          {item.itemStockId}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: { sm: 1 } }}>
                        <Typography sx={itemCardDetailLabelStyle}>
                          Barcode:
                        </Typography>
                        <Typography sx={itemCardDetailStyle}>
                          {barcode || "-"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {items.length === 0 && (
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontFamily: robotoFontFamily,
                color: theme.palette.text.secondary,
              }}
            >
              Tidak ada barang yang tersedia untuk dipilih.{" "}
              {/* cspell:disable-line */}
            </Typography>
          </Box>
        )}

        {items.length > 0 && (
          <Box sx={{ pt: 2, mt: "auto" }}>
            <Box display="flex" gap={theme.spacing(1)}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCancel}
                sx={{
                  flex: 1,
                  backgroundColor: lightButtonBackground,
                  color: primaryDarkColor,
                  fontSize: "18px",
                  fontFamily: robotoFontFamily,
                  fontWeight: "700",
                  lineHeight: "24px",
                  padding: "16px 24px",
                  borderRadius: "6px",
                  textTransform: "none",
                  "&:hover": { backgroundColor: theme.palette.grey[300] },
                }}
              >
                Batalkan {/* cspell:disable-line */}
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleContinue}
                disabled={!selectedItemId}
                sx={{
                  flex: 1,
                  backgroundColor: primaryDarkColor,
                  color: "white",
                  fontSize: "18px",
                  fontFamily: robotoFontFamily,
                  fontWeight: "700",
                  lineHeight: "24px",
                  padding: "16px 24px",
                  borderRadius: "6px",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#1E2532" },
                  "&.Mui-disabled": {
                    backgroundColor: theme.palette.action.disabledBackground,
                  },
                }}
              >
                Lanjut {/* cspell:disable-line */}
              </Button>
            </Box>
          </Box>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default ChooseItemPage;
