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
  Popover,
  IconButton,
} from "@mui/material";
import { InfoOutlined as InfoOutlinedIcon } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchRecommendedItemStockByBarcode } from "../../api/stocks";
import type {
  BarcodeScanResponse,
  RecommendedBarcodeScanResponse,
} from "../../types/item-stock";
import Header from "../../components/Header";
import Footer from "../../components/Footer";


const ChooseItemPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get data from URL parameters instead of location state
  const barcode = searchParams.get("barcode");
  const itemsParam = searchParams.get("items");
  const initialItems: BarcodeScanResponse[] = itemsParam
    ? JSON.parse(itemsParam)
    : [];

  const primaryDarkColor = "#2D3648";
  const lightButtonBackground = "#EDF0F7";
  const cardOutlineColor = primaryDarkColor;
  const cardSelectedOutlineColor = theme.palette.primary.main;

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [useRecommendations, setUseRecommendations] = useState(() => {
    const saved = localStorage.getItem("useRecommendations");
    return saved ? JSON.parse(saved) : false;
  });
  const [infoAnchorEl, setInfoAnchorEl] = useState<HTMLButtonElement | null>(
    null
  );

  useEffect(() => {
    localStorage.setItem(
      "useRecommendations",
      JSON.stringify(useRecommendations)
    );
  }, [useRecommendations]);

  const getRecommendationLevel = (score: number) => {
    if (score >= 0.8)
      return {
        label: "Sangat Cocok" /* cspell:disable-line */,
        color: "#4caf50",
      };
    if (score >= 0.6)
      return { label: "Cocok", color: "#ff9800" }; /* cspell:disable-line */
    if (score >= 0.4)
      return { label: "Mungkin", color: "#2196f3" }; /* cspell:disable-line */
    return {
      label: "Kurang Cocok" /* cspell:disable-line */,
      color: "#757575",
    };
  };

  const {
    data: recommendedItems,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recommendedItems", barcode],
    queryFn: () => fetchRecommendedItemStockByBarcode(barcode!),
    enabled: useRecommendations && !!barcode,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

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
    const { color } = getRecommendationLevel(score);

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
              width: 80,
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
        const params = new URLSearchParams({
          barcode: barcode || "",
          itemName: selectedItem.itemName,
          currentStock: selectedItem.currentStock.toString(),
          wholesalePrice: selectedItem.wholesalePrice.toString(),
        });

        navigate(
          `/scan/${selectedItem.itemStockId}/input?${params.toString()}`
        );
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
    setSelectedItemId(null);
  };

  const handleInfoClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setInfoAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setInfoAnchorEl(null);
  };

  const infoOpen = Boolean(infoAnchorEl);

  const getItemCardBorderColor = (
    item: BarcodeScanResponse | RecommendedBarcodeScanResponse
  ) => {
    if (selectedItemId === item.itemStockId) {
      return cardSelectedOutlineColor;
    }

    if (useRecommendations && "recommendationScore" in item) {
      // Use the same color logic as getRecommendationLevel
      const { color } = getRecommendationLevel(item.recommendationScore);
      return color;
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
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={useRecommendations}
                  onChange={handleRecommendationToggle}
                  color="primary"
                />
              }
              label="Gunakan Rekomendasi" /* cspell:disable-line */
              labelPlacement="end"
              sx={{ m: 0 }}
            />
            <IconButton
              size="small"
              sx={{ p: 0.5, ml: 0.5 }}
              onClick={handleInfoClick}
            >
              <InfoOutlinedIcon sx={{ fontSize: "1rem", color: "grey.500" }} />
            </IconButton>
          </Box>
        </Paper>

        <Popover
          open={infoOpen}
          anchorEl={infoAnchorEl}
          onClose={handleInfoClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          slotProps={{
            paper: {
              sx: {
                p: 2,
                maxWidth: 300,
                mt: 0.5,
              },
            },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {useRecommendations ? "Mode Rekomendasi" : "Mode Standar"}{" "}
            {/* cspell:disable-line */}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {useRecommendations
              ? "Menampilkan barang berdasarkan rekomendasi sistem dengan skor relevansi dan prioritas berdasarkan pola penggunaan sebelumnya." /* cspell:disable-line */
              : "Menampilkan semua barang dengan barcode yang sama tanpa prioritas khusus."}{" "}
            {/* cspell:disable-line */}
          </Typography>
        </Popover>

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              Memuat rekomendasi... {/* cspell:disable-line */}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Gagal memuat rekomendasi. Menggunakan hasil pencarian standar.
            {/* cspell:disable-line */}
          </Alert>
        )}

        {!isLoading && currentItems.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Tidak ada barang yang tersedia untuk dipilih.{" "}
            {/* cspell:disable-line */}
          </Alert>
        )}

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
