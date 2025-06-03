import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  useTheme,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Icons
import SaveIcon from "@mui/icons-material/Save";
import RemoveIcon from "@mui/icons-material/RemoveCircleOutline";
import AddIcon from "@mui/icons-material/AddCircleOutline";

// Import types and API functions
import type { ItemStock, EditStockChangeRequest } from "../../types/item-stock";
import { fetchItemStockById, updateItemStock } from "../../api/stocks";

interface FormData {
  id: string;
  name: string;
  currentStock: number | string;
  threshold: number | string;
  reason: string;
}

interface FormErrors {
  currentStock?: string;
  threshold?: string;
  reason?: string;
  form?: string;
}

const EditStockPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const primaryDarkColor = "#2D3648";
  const inputOutlineColor = "#CBD2E0";
  const lightButtonBackground = "#EDF0F7";
  const labelTextColor = "#2D3648";
  const optionalTextColor = "#717D96";

  const [formData, setFormData] = useState<FormData>({
    id: id || "",
    name: "",
    currentStock: "",
    threshold: "",
    reason: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const SUCCESS_MESSAGE = "berhasil";

  const {
    data: itemStock,
    isLoading: isLoadingItem,
    error: fetchError,
  } = useQuery<ItemStock, Error>({
    queryKey: ["itemStock", id],
    queryFn: () => fetchItemStockById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (itemStock) {
      setFormData({
        id: itemStock.id || "",
        name: itemStock.item.name || "Nama Barang Tidak Ditemukan",
        currentStock:
          itemStock.currentStock !== undefined ? itemStock.currentStock : "",
        threshold: itemStock.threshold !== undefined ? itemStock.threshold : "",
        reason: "",
      });
    }
  }, [itemStock]);

  const updateStockMutation = useMutation<
    ItemStock,
    Error,
    { id: string; data: EditStockChangeRequest }
  >({
    mutationFn: ({ id, data }) => updateItemStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itemStock", id] });
      queryClient.invalidateQueries({ queryKey: ["itemStocks"] });

      setErrors({ form: "Stok barang berhasil diperbarui!" });
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    },
    onError: (error: any) => {
      const serverFieldErrors: FormErrors = {};
      const fieldMapping: Record<string, keyof FormErrors> = {
        currentStock: "currentStock",
        threshold: "threshold",
        reason: "reason",
      };

      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((errStr: string) => {
          const colonIndex = errStr.indexOf(":");
          if (colonIndex !== -1) {
            const serverFieldKey = errStr.substring(0, colonIndex).trim();
            const errorMessage = errStr.substring(colonIndex + 1).trim();
            const formFieldKey = fieldMapping[serverFieldKey];
            if (formFieldKey) {
              serverFieldErrors[formFieldKey] = errorMessage;
            } else {
              serverFieldErrors.form =
                (serverFieldErrors.form ? serverFieldErrors.form + "; " : "") +
                errStr;
            }
          } else {
            serverFieldErrors.form =
              (serverFieldErrors.form ? serverFieldErrors.form + "; " : "") +
              errStr;
          }
        });
      }
      setErrors((prev) => ({
        ...prev,
        ...serverFieldErrors,
        form:
          serverFieldErrors.form ||
          error.message ||
          "Terjadi kesalahan pada server.",
      }));
    },
  });

  const handleNumericChange = (
    name: keyof Pick<FormData, "currentStock" | "threshold">,
    value: string
  ) => {
    if (value === "" || /^[0-9\b]+$/.test(value)) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
      }
    }
  };

  const handleQuantityChange = (
    name: keyof Pick<FormData, "currentStock" | "threshold">,
    delta: number
  ) => {
    setFormData((prev) => {
      const currentValue = Number(prev[name]) || 0;
      const newValue = Math.max(0, currentValue + delta);
      return { ...prev, [name]: newValue };
    });
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
    }
  };

  const validateForm = (): { isValid: boolean; newErrors: FormErrors } => {
    const newErrors: FormErrors = {};
    const currentStock = Number(formData.currentStock);
    const threshold = Number(formData.threshold);

    if (
      formData.currentStock === "" ||
      isNaN(currentStock) ||
      currentStock < 0
    ) {
      newErrors.currentStock = "Jumlah Stok harus angka positif atau nol.";
    }
    if (formData.threshold === "" || isNaN(threshold) || threshold < 0) {
      newErrors.threshold = "Batas Minimal Stok harus angka positif atau nol.";
    }

    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const handleSave = () => {
    setErrors({});
    const { isValid, newErrors } = validateForm();
    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    if (!formData.id) {
      setErrors({ form: "ID Barang tidak ditemukan." });
      return;
    }

    const payload: EditStockChangeRequest = {
      currentStock: Number(formData.currentStock),
      threshold: Number(formData.threshold),
      reason: formData.reason.trim() || "",
    };
    updateStockMutation.mutate({ id: formData.id, data: payload });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const commonTextFieldStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "6px",
      backgroundColor: "white",
      "& fieldset": {
        borderColor: inputOutlineColor,
        borderWidth: "2px",
      },
      "&:hover fieldset": { borderColor: primaryDarkColor },
      "&.Mui-focused fieldset": {
        borderColor: primaryDarkColor,
        borderWidth: "2px",
      },
    },
    "& .MuiInputBase-input": {
      fontFamily: "Roboto, sans-serif",
    },
  };

  const labelStyles = {
    color: labelTextColor,
    fontSize: "14px",
    fontFamily: "Roboto, sans-serif",
    fontWeight: "600",
    lineHeight: "16px",
    mb: 1,
    display: "block",
    textAlign: "left",
  };

  const isLoading = updateStockMutation.isPending;

  if (isLoadingItem) {
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

  if (fetchError) {
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Header title="Error" onBackClick={() => navigate(-1)} />
        <Container sx={{ py: 3 }}>
          <Alert severity="error">
            Error memuat data stok barang:{" "}
            {fetchError.message || "Unknown error"}
          </Alert>
        </Container>
        <Footer />
      </Box>
    );
  }

  if (!itemStock) {
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Header title="Tidak Ditemukan" onBackClick={() => navigate(-1)} />
        <Container sx={{ py: 3 }}>
          <Alert severity="warning">Stok barang tidak ditemukan.</Alert>
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
        title="Edit Stok Barang"
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
                errors.form?.includes(SUCCESS_MESSAGE) ? "success" : "error"
              }
              onClose={
                errors.form?.includes(SUCCESS_MESSAGE)
                  ? () => setErrors((prev) => ({ ...prev, form: undefined }))
                  : undefined
              }
              sx={{ mb: 1 }}
            >
              {errors.form}
            </Alert>
          )}

          <Box>
            <Typography sx={labelStyles}>Nama Barang</Typography>
            <Typography
              sx={{
                fontFamily: "Roboto, sans-serif",
                fontSize: "16px",
                color: theme.palette.text.primary,
                padding: "10px 14px",
                minHeight: "48px",
                border: `2px solid ${theme.palette.divider}`,
                borderRadius: "6px",
                backgroundColor: theme.palette.action.disabledBackground,
                display: "flex",
                alignItems: "center",
              }}
            >
              {formData.name}
            </Typography>
          </Box>

          <Box>
            <Typography sx={labelStyles}>Stok</Typography>{" "}
            {/* cspell:disable-line */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                name="currentStock"
                value={formData.currentStock}
                onChange={(e) =>
                  handleNumericChange("currentStock", e.target.value)
                }
                placeholder="0"
                disabled={isLoading}
                error={!!errors.currentStock}
                helperText={errors.currentStock || ""}
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
                size="small"
                onClick={() => handleQuantityChange("currentStock", -1)}
                disabled={isLoading}
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
                size="small"
                onClick={() => handleQuantityChange("currentStock", 1)}
                disabled={isLoading}
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
            <Typography sx={labelStyles}>Batas Minimal</Typography>{" "}
            {/* cspell:disable-line */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                name="threshold"
                value={formData.threshold}
                onChange={(e) =>
                  handleNumericChange("threshold", e.target.value)
                }
                placeholder="0"
                disabled={isLoading}
                error={!!errors.threshold}
                helperText={errors.threshold || ""}
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
                size="small"
                onClick={() => handleQuantityChange("threshold", -1)}
                disabled={isLoading}
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
                size="small"
                onClick={() => handleQuantityChange("threshold", 1)}
                disabled={isLoading}
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                sx={{
                  ...labelStyles,
                  mb: 0,
                }}
              >
                Alasan
              </Typography>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontFamily: "Roboto, sans-serif",
                  color: optionalTextColor,
                  fontWeight: "400",
                }}
              >
                Opsional
              </Typography>
            </Box>
            <TextField
              fullWidth
              variant="outlined"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              multiline
              rows={3}
              placeholder="Masukkan alasan perubahan stok (opsional)"
              disabled={isLoading}
              error={!!errors.reason}
              helperText={errors.reason || ""}
              sx={commonTextFieldStyles}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: "flex", justifyContent: "center", mt: "auto" }}>
            <Box
              sx={{ display: "flex", gap: 2, maxWidth: "400px", width: "100%" }}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={handleCancel}
                disabled={isLoading}
                sx={{
                  backgroundColor: lightButtonBackground,
                  color: primaryDarkColor,
                  fontSize: "18px",
                  fontFamily: "Roboto, sans-serif",
                  fontWeight: "700",
                  padding: "16px 24px",
                  borderRadius: "6px",
                  textTransform: "none",
                  "&:hover": { backgroundColor: theme.palette.grey[300] },
                }}
              >
                Batalkan
              </Button>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                startIcon={<SaveIcon />}
                disabled={isLoading}
                sx={{
                  backgroundColor: primaryDarkColor,
                  color: "white",
                  fontSize: "18px",
                  fontFamily: "Roboto, sans-serif",
                  fontWeight: "700",
                  padding: "16px 24px",
                  borderRadius: "6px",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#1E2532" },
                }}
              >
                {isLoading ? "Menyimpan..." : "Simpan"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
};

export default EditStockPage;
