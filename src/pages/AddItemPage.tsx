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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Header from "../components/Header";
import Footer from "../components/Footer";

import type { CreateItemRequest } from "../types/item";
import { createItem } from "../api/items";

import RemoveIcon from "@mui/icons-material/RemoveCircleOutline";
import AddIcon from "@mui/icons-material/AddCircleOutline";
import SaveIcon from "@mui/icons-material/Save";

interface FormData {
  name: string;
  description: string;
  barcode: string;
  currentStock: number | string;
  threshold: number | string;
}

interface FormErrors {
  name?: string;
  description?: string;
  barcode?: string;
  currentStock?: string;
  threshold?: string;
  form?: string;
}

const AddItemPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const primaryDarkColor = "#2D3648";
  const inputOutlineColor = "#CBD2E0";
  const lightButtonBackground = "#EDF0F7";

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    barcode: "",
    currentStock: "",
    threshold: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Define success message constant to avoid spell-check issues
  const SUCCESS_MESSAGE = "berhasil";

  const createItemMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      // Invalidate and refetch items list
      queryClient.invalidateQueries({ queryKey: ["items"] });

      setErrors({ form: "Barang berhasil ditambahkan!" });
      setFormData({
        name: "",
        description: "",
        barcode: "",
        currentStock: "",
        threshold: "",
      });

      // Navigate back after success
      setTimeout(() => {
        navigate(-1);
      }, 500);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.log("Error received:", error);

      const serverFieldErrors: FormErrors = {};

      // Field mapping from backend field names to frontend field names
      const fieldMapping: Record<string, keyof FormErrors> = {
        // Backend field -> Frontend field
        name: "name",
        description: "description",
        barcode: "barcode",
        currentStock: "currentStock",
        threshold: "threshold"
      };

      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((errStr: string) => {
          console.log("Processing error:", errStr);

          // Split by first colon only to handle cases where message contains colons
          const colonIndex = errStr.indexOf(":");
          if (colonIndex !== -1) {
            const serverFieldKey = errStr.substring(0, colonIndex).trim();
            const errorMessage = errStr.substring(colonIndex + 1).trim();

            console.log(
              `Server field: "${serverFieldKey}", Message: "${errorMessage}"`
            );

            // Check if we have a mapping for this field
            const formFieldKey = fieldMapping[serverFieldKey];

            if (formFieldKey) {
              serverFieldErrors[formFieldKey] = errorMessage;
              console.log(
                `Mapped ${serverFieldKey} -> ${formFieldKey}: ${errorMessage}`
              );
            } else {
              // If field doesn't map to a form field, add to general form error
              console.log(
                `Unmapped field ${serverFieldKey}, adding to form error`
              );
              serverFieldErrors.form =
                (serverFieldErrors.form ? serverFieldErrors.form + "; " : "") +
                errStr;
            }
          } else {
            // If no colon found, treat as general error
            console.log(`No colon found in error: ${errStr}`);
            serverFieldErrors.form =
              (serverFieldErrors.form ? serverFieldErrors.form + "; " : "") +
              errStr;
          }
        });
      }

      // Set errors, prioritizing field-specific errors over general form error
      setErrors((prev) => ({
        ...prev,
        ...serverFieldErrors,
        // Only set form error if no field-specific errors were found
        form:
          Object.keys(serverFieldErrors).length === 0 || serverFieldErrors.form
            ? serverFieldErrors.form ||
              error.message ||
              "Terjadi kesalahan pada server."
            : serverFieldErrors.form,
      }));
    },
  });

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (errors.form) {
      setErrors((prev) => ({ ...prev, form: undefined }));
    }
  };

  const handleNumericChange = (
    name: keyof Pick<FormData, "currentStock" | "threshold">,
    value: string
  ) => {
    if (value === "" || /^[0-9\b]+$/.test(value)) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
      // Clear form error when user starts correcting field errors
      if (errors.form) {
        setErrors((prev) => ({ ...prev, form: undefined }));
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    // Clear form error when user starts correcting field errors
    if (errors.form) {
      setErrors((prev) => ({ ...prev, form: undefined }));
    }
  };

  const validateForm = (): { isValid: boolean; newErrors: FormErrors } => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Nama Barang tidak boleh kosong.";
    }
    if (!formData.barcode.trim()) {
      newErrors.barcode = "Barcode tidak boleh kosong.";
    }
    if (formData.currentStock !== "" && Number(formData.currentStock) < 0) {
      newErrors.currentStock = "Jumlah Stok tidak boleh negatif.";
    } else if (
      formData.currentStock !== "" &&
      isNaN(Number(formData.currentStock))
    ) {
      newErrors.currentStock = "Jumlah Stok harus berupa angka.";
    }
    if (formData.threshold !== "" && Number(formData.threshold) < 0) {
      newErrors.threshold = "Batas Minimal Stok tidak boleh negatif.";
    } else if (formData.threshold !== "" && isNaN(Number(formData.threshold))) {
      newErrors.threshold = "Batas Minimal Stok harus berupa angka.";
    }

    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const handleSave = async () => {
    setErrors({});

    const { isValid, newErrors } = validateForm();
    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    const requestBody: CreateItemRequest = {
      name: formData.name,
      description: formData.description,
      barcode: formData.barcode,
      currentStock: formData.currentStock ? Number(formData.currentStock) : 0,
      threshold: formData.threshold ? Number(formData.threshold) : 0,
    };

    createItemMutation.mutate(requestBody);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleBackClick = () => {
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
      "&:hover fieldset": {
        borderColor: primaryDarkColor,
      },
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
    color: primaryDarkColor,
    fontSize: "14px",
    fontFamily: "Roboto, sans-serif",
    fontWeight: "600",
    lineHeight: "16px",
    mb: 1,
    display: "block",
    textAlign: "left",
  };

  const isLoading = createItemMutation.isPending;

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
        title="Tambah Barang"
        showBackButton={true}
        onBackClick={handleBackClick}
      />

      <Container
        component="main"
        maxWidth={false}
        disableGutters
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
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
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Masukkan nama barang"
              error={!!errors.name}
              helperText={errors.name || ""}
              disabled={isLoading}
              sx={{
                ...commonTextFieldStyles,
                "& .MuiOutlinedInput-root": {
                  ...commonTextFieldStyles["& .MuiOutlinedInput-root"],
                  minHeight: "48px",
                },
              }}
            />
          </Box>

          <Box>
            <Typography sx={labelStyles}>Deskripsi</Typography>
            <TextField
              fullWidth
              variant="outlined"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={4}
              placeholder="Masukkan deskripsi barang"
              error={!!errors.description}
              helperText={errors.description || ""}
              disabled={isLoading}
              sx={commonTextFieldStyles}
            />
          </Box>

          <Box>
            <Typography sx={labelStyles}>Barcode</Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              name="barcode"
              value={formData.barcode}
              onChange={handleInputChange}
              placeholder="Masukkan atau scan barcode"
              error={!!errors.barcode}
              helperText={errors.barcode || ""}
              disabled={isLoading}
              sx={{
                ...commonTextFieldStyles,
                "& .MuiOutlinedInput-root": {
                  ...commonTextFieldStyles["& .MuiOutlinedInput-root"],
                  minHeight: "48px",
                },
              }}
            />
          </Box>

          <Box>
            <Typography sx={labelStyles}>Jumlah Stok</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                name="currentStock"
                type="text"
                inputMode="numeric"
                value={formData.currentStock}
                onChange={(e) =>
                  handleNumericChange("currentStock", e.target.value)
                }
                placeholder="0"
                error={!!errors.currentStock}
                helperText={errors.currentStock || ""}
                disabled={isLoading}
                sx={{
                  ...commonTextFieldStyles,
                  "& .MuiOutlinedInput-root": {
                    ...commonTextFieldStyles["& .MuiOutlinedInput-root"],
                    minHeight: "48px",
                    pr: 0.5,
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
            <Typography sx={labelStyles}>Batas Minimal Stok</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                name="threshold"
                type="text"
                inputMode="numeric"
                value={formData.threshold}
                onChange={(e) =>
                  handleNumericChange("threshold", e.target.value)
                }
                placeholder="0"
                error={!!errors.threshold}
                helperText={errors.threshold || ""}
                disabled={isLoading}
                sx={{
                  ...commonTextFieldStyles,
                  "& .MuiOutlinedInput-root": {
                    ...commonTextFieldStyles["& .MuiOutlinedInput-root"],
                    minHeight: "48px",
                    pr: 0.5,
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

          <Box sx={{ flexGrow: 1 }} />

          {/* Centered Button Container */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: "auto" }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                maxWidth: "400px",
                width: "100%",
              }}
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
                  lineHeight: "24px",
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
                  lineHeight: "24px",
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

export default AddItemPage;
