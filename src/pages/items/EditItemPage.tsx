import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  useTheme,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import type { Item } from "../../types/item";
import { fetchItemById, updateItem } from "../../api/items";

import RemoveIcon from "@mui/icons-material/RemoveCircleOutline";
import AddIcon from "@mui/icons-material/AddCircleOutline";
import SaveIcon from "@mui/icons-material/Save";

interface FormData {
  id: string;
  name: string;
  description: string;
  barcode: string;
  wholesalePrice: number | string;
  retailPrice: number | string;
  profitPercentage: number | string;
}

interface FormErrors {
  name?: string;
  description?: string;
  barcode?: string;
  wholesalePrice?: string;
  retailPrice?: string;
  profitPercentage?: string;
  form?: string;
}

const EditItemPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  const primaryDarkColor = "#2D3648";
  const inputOutlineColor = "#CBD2E0";
  const lightButtonBackground = "#EDF0F7";

  const [formData, setFormData] = useState<FormData>({
    id: "",
    name: "",
    description: "",
    barcode: "",
    wholesalePrice: "",
    retailPrice: "",
    profitPercentage: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const SUCCESS_MESSAGE = "berhasil"; /* cspell:disable-line */

  const formatCurrency = (value: number | string): string => {
    const numValue =
      typeof value === "string"
        ? parseFloat(value.replace(/[^\d]/g, ""))
        : value;
    if (isNaN(numValue) || numValue === 0) return "";
    return numValue.toLocaleString("id-ID");
  };

  const parseCurrency = (value: string): number => {
    const cleanValue = value.replace(/[^\d]/g, "");
    return cleanValue ? parseInt(cleanValue, 10) : 0;
  };

  const calculateProfitPercentage = (
    wholesale: number,
    retail: number
  ): number => {
    if (wholesale <= 0) return 0;
    return ((retail - wholesale) / wholesale) * 100;
  };

  const calculateRetailPrice = (
    wholesale: number,
    profitPercentage: number
  ): number => {
    return wholesale + (wholesale * profitPercentage) / 100;
  };

  const {
    data: item,
    isLoading: isLoadingItem,
    error: fetchError,
  } = useQuery({
    queryKey: ["item", id],
    queryFn: () => fetchItemById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id || "",
        name: item.name || "",
        description: item.description || "",
        barcode: item.barcode || "",
        wholesalePrice: item.wholesalePrice || "",
        retailPrice: item.retailPrice || "",
        profitPercentage: item.profitPercentage || "",
      });
    }
  }, [item]);

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Item> }) =>
      updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item", id] });
      queryClient.invalidateQueries({ queryKey: ["stockAuditLogs"] });

      setErrors({
        form: "Barang berhasil diperbarui!" /* cspell:disable-line */,
      });

      setTimeout(() => {
        navigate(-1);
      }, 1000);
    },
    onError: (error: any) => {
      const serverFieldErrors: FormErrors = {};

      const fieldMapping: Record<string, keyof FormErrors> = {
        name: "name",
        description: "description",
        barcode: "barcode",
        wholesalePrice: "wholesalePrice",
        retailPrice: "retailPrice",
        profitPercentage: "profitPercentage",
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
          Object.keys(serverFieldErrors).length === 0 || serverFieldErrors.form
            ? serverFieldErrors.form ||
              error.message ||
              "Terjadi kesalahan pada server." /* cspell:disable-line */
            : serverFieldErrors.form,
      }));
    },
  });

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value || "" }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (errors.form) {
      setErrors((prev) => ({ ...prev, form: undefined }));
    }
  };

  const handleCurrencyChange = (
    name: keyof Pick<FormData, "wholesalePrice" | "retailPrice">,
    value: string
  ) => {
    const cleanValue = value.replace(/[^\d]/g, "");
    if (cleanValue === "" || /^[0-9]+$/.test(cleanValue)) {
      const numericValue = cleanValue ? parseInt(cleanValue, 10) : "";

      setFormData((prev) => {
        const newData = { ...prev, [name]: numericValue };

        const wholesalePrice =
          name === "wholesalePrice"
            ? Number(numericValue) || 0
            : typeof prev.wholesalePrice === "string"
            ? parseCurrency(prev.wholesalePrice)
            : Number(prev.wholesalePrice) || 0;

        if (name === "wholesalePrice" && Number(numericValue) > 0) {
          const profitPercentage = Number(prev.profitPercentage) || 0;
          const calculatedRetailPrice = calculateRetailPrice(
            Number(numericValue),
            profitPercentage
          );
          newData.retailPrice = Math.round(calculatedRetailPrice);
        } else if (
          name === "retailPrice" &&
          Number(numericValue) > 0 &&
          wholesalePrice > 0
        ) {
          const calculatedProfitPercentage = calculateProfitPercentage(
            wholesalePrice,
            Number(numericValue)
          );
          newData.profitPercentage = calculatedProfitPercentage.toFixed(2);
        }

        return newData;
      });

      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
      if (errors.form) {
        setErrors((prev) => ({ ...prev, form: undefined }));
      }
    }
  };

  const handleNumericChange = (
    name: keyof Pick<FormData, "profitPercentage">,
    value: string
  ) => {
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      const numValue = parseFloat(value) || 0;
      if (numValue <= 100) {
        setFormData((prev) => {
          const newData = { ...prev, [name]: value };

          const wholesalePrice =
            typeof prev.wholesalePrice === "string"
              ? parseCurrency(prev.wholesalePrice)
              : Number(prev.wholesalePrice) || 0;

          if (wholesalePrice > 0) {
            const calculatedRetailPrice = calculateRetailPrice(
              wholesalePrice,
              numValue
            );
            newData.retailPrice = Math.round(calculatedRetailPrice);
          }

          return newData;
        });

        if (errors[name]) {
          setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
        if (errors.form) {
          setErrors((prev) => ({ ...prev, form: undefined }));
        }
      }
    }
  };

  const handleQuantityChange = (
    name: keyof Pick<FormData, "profitPercentage">,
    delta: number
  ) => {
    setFormData((prev) => {
      const currentValue = Number(prev[name]) || 0;
      let newValue = currentValue + delta;
      newValue = Math.max(0, Math.min(100, newValue));

      const newData = { ...prev, [name]: newValue };

      const wholesalePrice =
        typeof prev.wholesalePrice === "string"
          ? parseCurrency(prev.wholesalePrice)
          : Number(prev.wholesalePrice) || 0;

      if (wholesalePrice > 0) {
        const calculatedRetailPrice = calculateRetailPrice(
          wholesalePrice,
          newValue
        );
        newData.retailPrice = Math.round(calculatedRetailPrice);
      }

      return newData;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (errors.form) {
      setErrors((prev) => ({ ...prev, form: undefined }));
    }
  };

  const validateForm = (): { isValid: boolean; newErrors: FormErrors } => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name =
        "Nama Barang tidak boleh kosong." /* cspell:disable-line */;
    }
    if (!formData.barcode.trim()) {
      newErrors.barcode =
        "Barcode tidak boleh kosong." /* cspell:disable-line */;
    }

    const wholesalePrice =
      typeof formData.wholesalePrice === "string"
        ? parseCurrency(formData.wholesalePrice.toString())
        : Number(formData.wholesalePrice) || 0;
    if (wholesalePrice <= 0) {
      newErrors.wholesalePrice =
        "Harga Grosir harus lebih dari 0." /* cspell:disable-line */;
    }

    const retailPrice =
      typeof formData.retailPrice === "string"
        ? parseCurrency(formData.retailPrice.toString())
        : Number(formData.retailPrice) || 0;
    if (retailPrice <= 0) {
      newErrors.retailPrice =
        "Harga Eceran harus lebih dari 0." /* cspell:disable-line */;
    }

    const profitPercentage = Number(formData.profitPercentage) || 0;
    if (profitPercentage < 0) {
      newErrors.profitPercentage =
        "Margin Keuntungan tidak boleh negatif." /* cspell:disable-line */;
    } else if (profitPercentage > 100) {
      newErrors.profitPercentage =
        "Margin Keuntungan tidak boleh lebih dari 100%." /* cspell:disable-line */;
    }

    if (wholesalePrice > 0 && retailPrice > 0 && retailPrice < wholesalePrice) {
      newErrors.retailPrice =
        "Harga Eceran tidak boleh lebih rendah dari Harga Grosir." /* cspell:disable-line */;
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

    const updateData = {
      name: formData.name,
      description: formData.description,
      barcode: formData.barcode,
      wholesalePrice:
        typeof formData.wholesalePrice === "string"
          ? parseCurrency(formData.wholesalePrice)
          : Number(formData.wholesalePrice) || 0,
      retailPrice:
        typeof formData.retailPrice === "string"
          ? parseCurrency(formData.retailPrice.toString())
          : Number(formData.retailPrice) || 0,
      profitPercentage: Number(formData.profitPercentage) || 0,
    };

    updateItemMutation.mutate({ id: formData.id, data: updateData });
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

  const isLoading = updateItemMutation.isPending;

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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading item:
          {fetchError instanceof Error ? fetchError.message : "Unknown error"}
        </Alert>
      </Box>
    );
  }

  if (!item) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Item tidak ditemukan</Alert>{" "}
        {/* cspell:disable-line */}
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
        title="Edit Barang" /* cspell:disable-line */
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
            <Typography sx={labelStyles}>Nama Barang</Typography>{" "}
            {/* cspell:disable-line */}
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Masukkan nama barang" /* cspell:disable-line */
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
            <Typography sx={labelStyles}>Deskripsi</Typography>{" "}
            {/* cspell:disable-line */}
            <TextField
              fullWidth
              variant="outlined"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={4}
              placeholder="Masukkan deskripsi barang" /* cspell:disable-line */
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
              placeholder="Masukkan atau scan barcode" /* cspell:disable-line */
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
            <Typography sx={labelStyles}>Harga Grosir</Typography>{" "}
            {/* cspell:disable-line */}
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              name="wholesalePrice"
              value={formatCurrency(formData.wholesalePrice)}
              onChange={(e) =>
                handleCurrencyChange("wholesalePrice", e.target.value)
              }
              placeholder="0"
              error={!!errors.wholesalePrice}
              helperText={errors.wholesalePrice || ""}
              disabled={isLoading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">Rp</InputAdornment>
                  ),
                },
                htmlInput: {
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  type: "text",
                  autoComplete: "off",
                },
              }}
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
            <Typography sx={labelStyles}>Margin Keuntungan</Typography>{" "}
            {/* cspell:disable-line */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                name="profitPercentage"
                value={formData.profitPercentage}
                onChange={(e) =>
                  handleNumericChange("profitPercentage", e.target.value)
                }
                placeholder="0"
                error={!!errors.profitPercentage}
                helperText={errors.profitPercentage || ""}
                disabled={isLoading}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  },
                  htmlInput: {
                    inputMode: "decimal",
                    type: "text",
                    autoComplete: "off",
                  },
                }}
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
                onClick={() => handleQuantityChange("profitPercentage", -1)}
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
                onClick={() => handleQuantityChange("profitPercentage", 1)}
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
            <Typography sx={labelStyles}>Harga Eceran</Typography>{" "}
            {/* cspell:disable-line */}
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              name="retailPrice"
              value={formatCurrency(formData.retailPrice)}
              onChange={(e) =>
                handleCurrencyChange("retailPrice", e.target.value)
              }
              placeholder="0"
              error={!!errors.retailPrice}
              helperText={errors.retailPrice || ""}
              disabled={isLoading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">Rp</InputAdornment>
                  ),
                },
                htmlInput: {
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  type: "text",
                  autoComplete: "off",
                },
              }}
              sx={{
                ...commonTextFieldStyles,
                "& .MuiOutlinedInput-root": {
                  ...commonTextFieldStyles["& .MuiOutlinedInput-root"],
                  minHeight: "48px",
                },
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

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
                Batalkan {/* cspell:disable-line */}
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
                {
                  isLoading
                    ? "Menyimpan..." /* cspell:disable-line */
                    : "Simpan" /* cspell:disable-line */
                }
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default EditItemPage;
