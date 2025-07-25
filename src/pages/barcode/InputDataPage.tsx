import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  useTheme,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { fetchItemStockById, scanUpdateItemStock } from "../../api/stocks";
import type { ScanStockChangeRequest } from "../../types/item-stock";
import type { StockChangeType } from "../../types/stock-change-type";

import RemoveIcon from "@mui/icons-material/RemoveCircleOutline";
import { Edit } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/AddCircleOutline";
import SaveIcon from "@mui/icons-material/Save";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useAuth } from "../../helper/use-auth";
import { UserRole } from "../../types/user-role";

interface LocationState {
  itemStockId?: string;
  barcode?: string;
}

interface FormData {
  amount: number | string;
  changeType: StockChangeType | null;
}

interface FormErrors {
  amount?: string;
  changeType?: string;
  form?: string;
}

const InputDataPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { itemStockId, barcode } = (location.state as LocationState) || {};

  const { data: itemStock, isLoading: isLoadingItemStock } = useQuery({
    queryKey: ["itemStock", itemStockId],
    queryFn: () => fetchItemStockById(itemStockId!),
    enabled: !!itemStockId,
  });

  const primaryDarkColor = "#2D3648";
  const inputOutlineColor = "#CBD2E0";
  const lightButtonBackground = "#EDF0F7";

  const [formData, setFormData] = useState<FormData>({
    amount: "",
    changeType: "IN",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const itemName =
    itemStock?.item?.name || "Barang Tidak Dikenal"; /* cspell:disable-line */
  const currentStock = itemStock?.currentStock;
  const wholesalePrice = itemStock?.item?.wholesalePrice;

  const isOwner = user?.roles?.includes(UserRole.OWNER) ?? false;

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScanStockChangeRequest }) =>
      scanUpdateItemStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itemStocks"] });
      queryClient.invalidateQueries({
        queryKey: ["itemStock", itemStockId],
      });
      queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
      queryClient.invalidateQueries({ queryKey: ["stockAuditLogs"] });
      queryClient.invalidateQueries({ queryKey: ["recommendItems"] });

      setErrors({
        form: `Berhasil menyimpan ${formData.amount} barang sebagai stok ${
          formData.changeType === "IN"
            ? "masuk"
            : "keluar" /* cspell:disable-line */
        }.`,
      });

      setTimeout(() => {
        navigate("/scan", { replace: true });
      }, 2000);
    },
    onError: (error: Error) => {
      console.error("Error updating stock:", error);
      setErrors({
        form:
          error.message ||
          "Gagal menyimpan data ke server." /* cspell:disable-line */,
      });
    },
  });

  const handleEditItem = () => {
    if (itemStock?.item?.id) {
      navigate(`/items/${itemStock.item.id}/edit`);
    }
  };

  const handleNumericChange = (value: string) => {
    if (value === "" || /^[0-9\b]+$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        amount: value,
      }));
      if (errors.amount) {
        setErrors((prev) => ({ ...prev, amount: undefined, form: undefined }));
      }
    }
  };

  const handleQuantityButtons = (delta: number) => {
    setFormData((prev) => {
      const currentValue = Number(prev.amount) || 1;
      const newValue = Math.max(1, currentValue + delta);
      return { ...prev, amount: newValue };
    });
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined, form: undefined }));
    }
  };

  const handleStockTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newStockType: StockChangeType | null
  ) => {
    if (newStockType !== null) {
      setFormData((prev) => ({ ...prev, changeType: newStockType }));
      if (errors.changeType) {
        setErrors((prev) => ({
          ...prev,
          changeType: undefined,
          form: undefined,
        }));
      }
    }
  };

  const validateForm = (): { isValid: boolean; newErrors: FormErrors } => {
    const newErrors: FormErrors = {};
    const amountVal = Number(formData.amount);
    if (formData.amount === "" || isNaN(amountVal) || amountVal <= 0) {
      newErrors.amount =
        "Jumlah harus lebih besar dari 0."; /* cspell:disable-line */
    }
    if (!formData.changeType) {
      newErrors.changeType =
        "Jenis Stok harus dipilih (Masuk/Keluar)."; /* cspell:disable-line */
    }
    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const handleSave = async () => {
    if (!itemStockId) return;

    setErrors({});
    const { isValid, newErrors } = validateForm();
    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    const data: ScanStockChangeRequest = {
      changeType: formData.changeType!,
      amount: Number(formData.amount),
    };

    mutation.mutate({ id: itemStockId, data });
  };

  const handleCancel = () => {
    navigate("/scan", { replace: true });
  };

  const commonTextFieldStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "6px",
      backgroundColor: "white",
      "& fieldset": { borderColor: inputOutlineColor, borderWidth: "2px" },
      "&:hover fieldset": { borderColor: primaryDarkColor },
      "&.Mui-focused fieldset": {
        borderColor: primaryDarkColor,
        borderWidth: "2px",
      },
    },
    "& .MuiInputBase-input": { fontFamily: "Roboto, sans-serif" },
  };

  const labelStyles = {
    color: primaryDarkColor,
    fontSize: "14px",
    fontFamily: "Roboto, sans-serif",
    fontWeight: "600",
    lineHeight: "16px",
    mb: 1,
  };

  if (!itemStockId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          ID item tidak ditemukan. Silakan kembali dan scan ulang.{" "}
          {/* cspell:disable-line */}
        </Alert>
      </Box>
    );
  }

  if (isLoadingItemStock) {
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

  if (!itemStock) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Data barang tidak ditemukan. Silakan kembali dan coba lagi.{/* cspell:disable-line */}
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
        title="Input Stok Barang" /* cspell:disable-line */
        showBackButton={true}
        onBackClick={handleCancel}
      />

      <Container
        component="main"
        maxWidth={false}
        disableGutters
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Box
          component="form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            px: { xs: 2, sm: 3, md: "36px" },
            py: { xs: 2, sm: 3, md: "24px" },
            gap: "24px",
          }}
        >
          {errors.form && (
            <Alert
              severity={
                errors.form.includes("Berhasil") ? "success" : "error"
              } /* cspell:disable-line */
              sx={{ mb: 1 }}
            >
              {errors.form}
            </Alert>
          )}

          <Paper elevation={1} sx={{ p: 2, borderRadius: "8px" }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "Roboto, sans-serif",
                fontWeight: "bold",
                color: primaryDarkColor,
                mb: 1,
              }}
            >
              {itemName}
            </Typography>
            {barcode && (
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "Roboto, sans-serif",
                  color: theme.palette.text.secondary,
                  mb: 1,
                }}
              >
                Barcode: {barcode}
              </Typography>
            )}
            {currentStock !== undefined && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  width: "fit-content",
                  mx: "auto",
                  mb: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontWeight: "600",
                    color: primaryDarkColor,
                  }}
                >
                  Jumlah Stok: {/* cspell:disable-line */}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontWeight: currentStock <= 0 ? "bold" : "normal",
                    color:
                      currentStock <= 0
                        ? theme.palette.error.main
                        : theme.palette.text.secondary,
                  }}
                >
                  {currentStock}
                </Typography>
              </Box>
            )}
            {isOwner && wholesalePrice !== undefined && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  width: "fit-content",
                  mx: "auto",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontWeight: "600",
                    color: primaryDarkColor,
                  }}
                >
                  Harga Grosir: {/* cspell:disable-line */}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontWeight: wholesalePrice <= 0 ? "bold" : "normal",
                    color:
                      wholesalePrice <= 0
                        ? theme.palette.error.main
                        : theme.palette.text.secondary,
                  }}
                >
                  Rp{wholesalePrice.toLocaleString("id-ID")}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleEditItem}
                  disabled={!itemStock?.item?.id}
                  sx={{
                    ml: 0.1,
                    color: primaryDarkColor,
                    "&:hover": {
                      backgroundColor: "rgba(45, 54, 72, 0.08)",
                    },
                  }}
                >
                  <Edit sx={{ fontSize: 15 }} />
                </IconButton>
              </Box>
            )}
          </Paper>

          <Box>
            <Typography sx={labelStyles}>Jumlah</Typography>{" "}
            {/* cspell:disable-line */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                name="amount"
                value={formData.amount}
                onChange={(e) => handleNumericChange(e.target.value)}
                placeholder="Masukkan jumlah (minimal 1)" /* cspell:disable-line */
                disabled={mutation.isPending}
                error={!!errors.amount}
                helperText={errors.amount || ""}
                sx={{
                  ...commonTextFieldStyles,
                  "& .MuiOutlinedInput-root": {
                    ...commonTextFieldStyles["& .MuiOutlinedInput-root"],
                    minHeight: "48px",
                    pr: 0.5,
                  },
                }}
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    type: "text",
                    autoComplete: "off",
                  },
                }}
              />
              <IconButton
                disabled={mutation.isPending}
                size="small"
                onClick={() => handleQuantityButtons(-1)}
                sx={{
                  background: lightButtonBackground,
                  borderRadius: "6px",
                  padding: "8px",
                  height: "32px",
                  "&:hover": { background: theme.palette.grey[300] },
                }}
              >
                <RemoveIcon
                  sx={{ color: primaryDarkColor, fontSize: "16px" }}
                />
              </IconButton>
              <IconButton
                disabled={mutation.isPending}
                size="small"
                onClick={() => handleQuantityButtons(1)}
                sx={{
                  background: lightButtonBackground,
                  borderRadius: "6px",
                  padding: "8px",
                  height: "32px",
                  "&:hover": { background: theme.palette.grey[300] },
                }}
              >
                <AddIcon sx={{ color: primaryDarkColor, fontSize: "16px" }} />
              </IconButton>
            </Box>
          </Box>

          <Box>
            <Typography sx={labelStyles}>Jenis Stok</Typography>
            {/* cspell:disable-line */}
            <ToggleButtonGroup
              value={formData.changeType}
              exclusive
              onChange={handleStockTypeChange}
              aria-label="stock type"
              fullWidth
              disabled={mutation.isPending}
              sx={{ gap: 1.25 }}
            >
              <ToggleButton
                value="IN"
                aria-label="stok masuk" /* cspell:disable-line */
                sx={{
                  flex: "1 1 0",
                  height: "40px",
                  borderRadius: "6px !important",
                  fontFamily: "Roboto, sans-serif",
                  fontWeight: "700",
                  fontSize: "14px",
                  lineHeight: "24px",
                  textTransform: "none",
                  border:
                    formData.changeType === "IN"
                      ? `2px solid ${primaryDarkColor} !important`
                      : `2px solid ${inputOutlineColor} !important`,
                  backgroundColor:
                    formData.changeType === "IN"
                      ? theme.palette.action.hover
                      : "white",
                  color: primaryDarkColor,
                  "&.Mui-selected": {
                    backgroundColor: primaryDarkColor,
                    color: "white",
                    borderColor: `${primaryDarkColor} !important`,
                    "&:hover": { backgroundColor: "#1E2532" },
                  },
                  "&:not(.Mui-selected):hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <ArrowUpwardIcon sx={{ mr: 1, fontSize: "18px" }} />
                Masuk {/* cspell:disable-line */}
              </ToggleButton>
              <ToggleButton
                value="OUT"
                aria-label="stok keluar" /* cspell:disable-line */
                sx={{
                  flex: "1 1 0",
                  height: "40px",
                  borderRadius: "6px !important",
                  fontFamily: "Roboto, sans-serif",
                  fontWeight: "700",
                  fontSize: "14px",
                  lineHeight: "24px",
                  textTransform: "none",
                  border:
                    formData.changeType === "OUT"
                      ? `2px solid ${primaryDarkColor} !important`
                      : `2px solid ${inputOutlineColor} !important`,
                  backgroundColor:
                    formData.changeType === "OUT"
                      ? theme.palette.action.hover
                      : "white",
                  color: primaryDarkColor,
                  "&.Mui-selected": {
                    backgroundColor: primaryDarkColor,
                    color: "white",
                    borderColor: `${primaryDarkColor} !important`,
                    "&:hover": { backgroundColor: "#1E2532" },
                  },
                  "&:not(.Mui-selected):hover": {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <ArrowDownwardIcon sx={{ mr: 1, fontSize: "18px" }} />
                Keluar {/* cspell:disable-line */}
              </ToggleButton>
            </ToggleButtonGroup>
            {errors.changeType && (
              <Typography
                color="error"
                variant="caption"
                sx={{ mt: 0.5, ml: 1.5, fontFamily: "Roboto, sans-serif" }}
              >
                {errors.changeType}
              </Typography>
            )}
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleCancel}
              disabled={mutation.isPending}
              sx={{
                backgroundColor: lightButtonBackground,
                color: primaryDarkColor,
                fontSize: "18px",
                fontFamily: "Roboto, sans-serif",
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
              type="submit"
              startIcon={
                mutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
              disabled={mutation.isPending}
              sx={{
                backgroundColor: primaryDarkColor,
                color: "white",
                fontSize: "18px",
                fontFamily: "Roboto, sans-serif",
                fontWeight: "700",
                lineHeight: "24px",
                padding: "16px 24px",
                borderRadius: "6px",
                textTransform: "none",
                "&:hover": { backgroundColor: "#1E2532" },
              }}
            >
              {mutation.isPending ? "Menyimpan..." : "Simpan"}
              {/* cspell:disable-line */}
            </Button>
          </Box>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default InputDataPage;
