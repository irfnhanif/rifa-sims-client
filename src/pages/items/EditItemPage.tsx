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
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import type { Item } from "../../types/item";
import { fetchItemById, updateItem } from "../../api/items";

import SaveIcon from "@mui/icons-material/Save";

interface FormData {
  id: string;
  name: string;
  description: string;
  barcode: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  barcode?: string;
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
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const SUCCESS_MESSAGE = "berhasil";

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
      });
    }
  }, [item]);

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Item> }) =>
      updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item", id] });

      setErrors({ form: "Barang berhasil diperbarui!" });

      setTimeout(() => {
        navigate(-1);
      }, 1000);
    },
    onError: (error: any) => {
      console.log("Error received:", error);

      const serverFieldErrors: FormErrors = {};

      const fieldMapping: Record<string, keyof FormErrors> = {
        name: "name",
        description: "description",
        barcode: "barcode",
      };

      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((errStr: string) => {
          console.log("Processing error:", errStr);

          const colonIndex = errStr.indexOf(":");
          if (colonIndex !== -1) {
            const serverFieldKey = errStr.substring(0, colonIndex).trim();
            const errorMessage = errStr.substring(colonIndex + 1).trim();

            console.log(
              `Server field: "${serverFieldKey}", Message: "${errorMessage}"`
            );

            const formFieldKey = fieldMapping[serverFieldKey];

            if (formFieldKey) {
              serverFieldErrors[formFieldKey] = errorMessage;
              console.log(
                `Mapped ${serverFieldKey} -> ${formFieldKey}: ${errorMessage}`
              );
            } else {
              console.log(
                `Unmapped field ${serverFieldKey}, adding to form error`
              );
              serverFieldErrors.form =
                (serverFieldErrors.form ? serverFieldErrors.form + "; " : "") +
                errStr;
            }
          } else {
            console.log(`No colon found in error: ${errStr}`);
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
              "Terjadi kesalahan pada server."
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

  const validateForm = (): { isValid: boolean; newErrors: FormErrors } => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Nama Barang tidak boleh kosong.";
    }
    if (!formData.barcode.trim()) {
      newErrors.barcode = "Barcode tidak boleh kosong.";
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
          Error loading item:{" "}
          {fetchError instanceof Error ? fetchError.message : "Unknown error"}
        </Alert>
      </Box>
    );
  }

  if (!item) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Item tidak ditemukan</Alert>
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
        title="Edit Barang"
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

export default EditItemPage;
