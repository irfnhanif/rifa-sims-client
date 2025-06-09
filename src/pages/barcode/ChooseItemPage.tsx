import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  useTheme,
  Alert,
  Radio,
  Switch,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchRecommendedItemStockByBarcode } from "../../api/stocks";
import type {
  BarcodeScanResponse,
  RecommendedBarcodeScanResponse,
} from "../../types/item-stock";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

interface LocationState {
  items?: BarcodeScanResponse[];
  barcode?: string;
}

const ChooseItemPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const { items: initialItems = [], barcode } =
    (location.state as LocationState) || {};

  const primaryDarkColor = "#2D3648";
  const lightButtonBackground = "#EDF0F7";
  const cardOutlineColor = primaryDarkColor;
  const cardSelectedOutlineColor = theme.palette.primary.main;

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [useRecommendations, setUseRecommendations] = useState(() => {
    const saved = localStorage.getItem("useRecommendations");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(
      "useRecommendations",
      JSON.stringify(useRecommendations)
    );
  }, [useRecommendations]);

  // Helper function to get recommendation level and color
  const getRecommendationLevel = (score: number) => {
    if (score >= 0.8)
      return {
        label: "Sangat Cocok",
        color: "#4caf50",
      }; /* cspell:disable-line */
    if (score >= 0.6)
      return { label: "Cocok", color: "#ff9800" }; /* cspell:disable-line */
    if (score >= 0.4)
      return { label: "Mungkin", color: "#2196f3" }; /* cspell:disable-line */
    return {
      label: "Kurang Cocok",
      color: "#757575",
    }; /* cspell:disable-line */
  };

  // Fetch recommended items when toggle is enabled
  const {
    data: recommendedItems,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recommendedItems", barcode],
    queryFn: () => fetchRecommendedItemStockByBarcode(barcode!),
    enabled: useRecommendations && !!barcode,
  });

  // Use recommended items if toggle is on, otherwise use initial items
  const currentItems = useRecommendations
    ? recommendedItems || []
    : initialItems;

  const isHighlyRecommended = (
    item: BarcodeScanResponse | RecommendedBarcodeScanResponse
  ) => {
    return (
      useRecommendations &&
      "recommendationScore" in item &&
      item.recommendationScore >= 0.6
    );
  };

  const robotoFontFamily = "Roboto, sans-serif";

  const itemCardNameStyle = {
    fontFamily: robotoFontFamily,
    fontWeight: "700",
    fontSize: "18px",
    color: primaryDarkColor,
    lineHeight: 1.4,
    mb: 1,
  };

  const itemCardDetailStyle = {
    fontFamily: robotoFontFamily,
    fontWeight: "400",
    fontSize: "13px",
    color: theme.palette.text.secondary,
    lineHeight: 1.3,
  };

  const itemCardDetailLabelStyle = {
    ...itemCardDetailStyle,
    fontWeight: "600",
    color: primaryDarkColor,
  };

  const renderScoreWithProgress = (score: number) => {
    const { label, color } = getRecommendationLevel(score);

    return (
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 150 }}
      >
        <Typography sx={itemCardDetailLabelStyle}>
          Relevansi: {/* cspell:disable-line */}
        </Typography>
        <Box
          sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <Box
            sx={{
              width: 40,
              height: 4,
              backgroundColor: "#e0e0e0",
              borderRadius: 2,
              position: "relative",
            }}
          >
            <Box
              sx={{
                width: `${score * 100}%`,
                height: "100%",
                backgroundColor: color,
                borderRadius: 2,
              }}
            />
          </Box>
          <Typography
            sx={{
              ...itemCardDetailStyle,
              fontWeight: "600",
              color: color,
              fontSize: "10px",
            }}
          >
            {label}
          </Typography>
        </Box>
      </Box>
    );
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId === selectedItemId ? null : itemId);
  };

  const handleContinue = () => {
    if (selectedItemId) {
      const selectedItem = currentItems.find(
        (item) => item.itemStockId === selectedItemId
      );
      if (selectedItem) {
        navigate(`/scan/${selectedItem.itemStockId}/input`, {
          state: {
            itemName: selectedItem.itemName,
            barcode: barcode,
            currentStock: selectedItem.currentStock,
          },
        });
      }
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleRecommendationToggle = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUseRecommendations(event.target.checked);
    setSelectedItemId(null); // Reset selection when switching modes
  };

  const getItemCardBorderColor = (
    item: BarcodeScanResponse | RecommendedBarcodeScanResponse
  ) => {
    if (selectedItemId === item.itemStockId) {
      return cardSelectedOutlineColor;
    }

    // More nuanced color coding based on score ranges
    if (useRecommendations && "recommendationScore" in item) {
      if (item.recommendationScore >= 0.8) return "#4caf50"; // Green for very high
      if (item.recommendationScore >= 0.6) return "#ff9800"; // Orange for high
      if (item.recommendationScore >= 0.4) return "#2196f3"; // Blue for medium
      return cardOutlineColor; // Default for low
    }

    return cardOutlineColor;
  };

  if (!barcode) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Barcode tidak ditemukan. Silakan kembali dan scan ulang.{" "}
          {/* cspell:disable-line */}
        </Alert>
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
        title="Pilih Barang" /* cspell:disable-line */
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
        {/* Recommendation Toggle */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Mode Pencarian {/* cspell:disable-line */}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {
                useRecommendations
                  ? "Menampilkan barang berdasarkan rekomendasi sistem" /* cspell:disable-line */
                  : "Menampilkan semua barang dengan barcode yang sama" /* cspell:disable-line */
              }
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={useRecommendations}
                onChange={handleRecommendationToggle}
                color="primary"
              />
            }
            label="Gunakan Rekomendasi" /* cspell:disable-line */
            labelPlacement="start"
          />
        </Paper>

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              Memuat rekomendasi... {/* cspell:disable-line */}
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Gagal memuat rekomendasi. Menggunakan hasil pencarian standar.{" "}
            {/* cspell:disable-line */}
          </Alert>
        )}

        {/* No Items Alert */}
        {!isLoading && currentItems.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Tidak ada barang yang tersedia untuk dipilih.{" "}
            {/* cspell:disable-line */}
          </Alert>
        )}

        {/* Items List */}
        {!isLoading && currentItems.length > 0 && (
          <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 1 }}>
            <Box display="flex" flexDirection="column" gap={theme.spacing(1.5)}>
              {currentItems.map(
                (
                  item: BarcodeScanResponse | RecommendedBarcodeScanResponse
                ) => (
                  <Paper
                    elevation={selectedItemId === item.itemStockId ? 4 : 1}
                    key={item.itemStockId}
                    onClick={() => handleItemSelect(item.itemStockId)}
                    sx={{
                      padding: { xs: "18px 16px", sm: "18px 24px" },
                      background: "white",
                      borderRadius: "8px",
                      border: `2px solid ${getItemCardBorderColor(item)}`,
                      cursor: "pointer",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      position: "relative",
                    }}
                  >
                    {/* Recommendation Badge */}
                    {isHighlyRecommended(item) && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          backgroundColor: getRecommendationLevel(
                            (item as RecommendedBarcodeScanResponse)
                              .recommendationScore
                          ).color,
                          color: "white",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: "10px",
                          fontWeight: "bold",
                        }}
                      >
                        {getRecommendationLevel(
                          (item as RecommendedBarcodeScanResponse)
                            .recommendationScore
                        ).label.toUpperCase()}
                      </Box>
                    )}

                    <Radio
                      checked={selectedItemId === item.itemStockId}
                      value={item.itemStockId}
                      name="selected-item-radio"
                      slotProps={{ input: { "aria-label": item.itemName } }}
                      size="small"
                      sx={{ mt: 0.25 }}
                    />

                    <Box
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <Typography sx={itemCardNameStyle}>
                        {item.itemName}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Typography sx={itemCardDetailLabelStyle}>
                            Jumlah Stok: {/* cspell:disable-line */}
                          </Typography>
                          <Typography
                            sx={{
                              ...itemCardDetailStyle,
                              fontWeight:
                                item.currentStock <= 0 ? "bold" : "normal",
                              color:
                                item.currentStock <= 0
                                  ? theme.palette.error.main
                                  : theme.palette.text.secondary,
                            }}
                          >
                            {item.currentStock}
                          </Typography>
                        </Box>

                        {/* Show recommendation score if available */}
                        {useRecommendations &&
                          "recommendationScore" in item && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              {renderScoreWithProgress(
                                (item as RecommendedBarcodeScanResponse)
                                  .recommendationScore
                              )}
                            </Box>
                          )}
                      </Box>
                    </Box>
                  </Paper>
                )
              )}
            </Box>
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && currentItems.length === 0 && (
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
                textAlign: "center",
              }}
            >
              {
                useRecommendations
                  ? "Tidak ada rekomendasi barang untuk barcode ini." /* cspell:disable-line */
                  : "Tidak ada barang yang tersedia untuk dipilih." /* cspell:disable-line */
              }
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        {!isLoading && currentItems.length > 0 && (
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
