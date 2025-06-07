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
  Paper,
  Avatar,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../helper/use-auth";
import type {
  User,
  EditUserRequest,
  UserWithTokenResponse,
} from "../../types/user";
import { updateUser } from "../../api/users";

// Icons
import SaveIcon from "@mui/icons-material/Save";
import apiConfig from "../../config/api";

interface FormErrors {
  username?: string;
  branch?: string;
  form?: string;
}

interface ApiError extends Error {
  errors?: string[];
  status?: number;
}

const EditProfilePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const user = location.state?.user as User;

  const primaryDarkColor = "#2D3648";
  const inputOutlineColor = "#CBD2E0";
  const lightButtonBackground = "#EDF0F7";

  const [formData, setFormData] = useState<EditUserRequest>({
    username: "",
    branch: 1,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        branch: user.branch,
      });
    }
  }, [user]);

  const updateMutation = useMutation<
    UserWithTokenResponse,
    ApiError,
    Partial<EditUserRequest>
  >({
    mutationFn: (userData: Partial<EditUserRequest>) => {
      if (!user?.id) {
        throw new Error("User ID not found");
      }
      return updateUser(user.id, userData);
    },
    onSuccess: async (response: UserWithTokenResponse) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });

      const usernameChanged = formData.username !== user.username;

      if (usernameChanged) {
        try {
          // Update the token with the new one from the response
          apiConfig.setToken(response.token);
          setErrors({
            form: "Profil berhasil diperbarui!" /* cspell:disable-line */,
          });
        } catch {
          setErrors({
            form: "Profil diperbarui. Silakan login ulang." /* cspell:disable-line */,
          });
          setTimeout(async () => {
            await logout();
            navigate("/auth/login");
          }, 2000);
          return;
        }
      } else {
        setErrors({
          form: "Profil berhasil diperbarui!" /* cspell:disable-line */,
        });
      }
      setTimeout(() => navigate("/users/profile"), 1500);
    },
    onError: (error: ApiError) => {
      const serverErrors: { [key: string]: string } = {};

      // Handle server validation errors if they exist
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((errStr: string) => {
          const [key, ...msg] = errStr.split(":");
          serverErrors[key.trim()] = msg.join(":").trim();
        });
      }

      setErrors({
        ...serverErrors,
        form:
          error.message ||
          "Gagal memperbarui profil." /* cspell:disable-line */,
      });
    },
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const handleSelectChange = (event: SelectChangeEvent<number>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const validateForm = () => {
    const newErrors: { username?: string; branch?: string } = {};
    if (!formData.username.trim())
      newErrors.username =
        "Nama Pengguna tidak boleh kosong." /* cspell:disable-line */;
    if (!formData.branch || (formData.branch !== 1 && formData.branch !== 2))
      newErrors.branch = "Cabang harus dipilih." /* cspell:disable-line */;
    return newErrors;
  };

  const handleSave = () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!user) {
      setErrors({ form: "User data not found" });
      return;
    }

    // Send only the fields that can be updated
    const updateData: Partial<EditUserRequest> = {
      username: formData.username,
      branch: formData.branch,
    };

    updateMutation.mutate(updateData);
  };

  const handleCancel = () => navigate(-1);

  // Redirect if no user data
  if (!user) {
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Header title="Error" onBackClick={handleCancel} />
        <Container sx={{ py: 3 }}>
          <Alert severity="error">
            User data not found. Please go back and try again.
          </Alert>
        </Container>
        <Footer />
      </Box>
    );
  }

  const robotoFontFamily = "Roboto, sans-serif";
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
    "& .MuiInputBase-input, & .MuiSelect-select": {
      fontFamily: robotoFontFamily,
    },
    "& .MuiFormHelperText-root": { fontFamily: robotoFontFamily },
  };

  const labelStyles = {
    color: primaryDarkColor,
    fontSize: "14px",
    fontFamily: robotoFontFamily,
    fontWeight: "600",
    lineHeight: "16px",
    mb: 1,
    display: "block",
    textAlign: "left" as const,
  };

  const isLoading = updateMutation.isPending;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      <Header
        title="Edit Profil" /* cspell:disable-line */
        showBackButton={true}
        onBackClick={handleCancel}
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
            p: { xs: 3, sm: 4 },
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
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
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              gap: "24px",
            }}
          >
            {errors.form && (
              <Alert
                severity={
                  errors.form.includes("berhasil" /* cspell:disable-line */)
                    ? "success"
                    : "error"
                }
              >
                {errors.form}
              </Alert>
            )}

            {/* Avatar Section (Display Only) */}
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  fontSize: "3rem",
                  backgroundColor: primaryDarkColor,
                }}
              >
                {formData.username.charAt(0).toUpperCase()}
              </Avatar>
            </Box>

            {/* Username Field */}
            <Box>
              <Typography sx={labelStyles}>
                Nama Pengguna {/* cspell:disable-line */}
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Masukkan nama pengguna" /* cspell:disable-line */
                disabled={isLoading}
                error={!!errors.username}
                helperText={errors.username || ""}
                sx={{
                  ...commonTextFieldStyles,
                  "& .MuiOutlinedInput-root": {
                    ...commonTextFieldStyles["& .MuiOutlinedInput-root"],
                    minHeight: "48px",
                  },
                }}
              />
            </Box>

            {/* Branch Field */}
            <Box>
              <Typography sx={labelStyles}>
                Cabang {/* cspell:disable-line */}
              </Typography>
              <FormControl
                fullWidth
                error={!!errors.branch}
                disabled={isLoading}
              >
                <Select
                  name="branch"
                  value={formData.branch}
                  onChange={handleSelectChange}
                  displayEmpty
                  sx={{
                    ...commonTextFieldStyles,
                    "& .MuiOutlinedInput-root": {
                      ...commonTextFieldStyles["& .MuiOutlinedInput-root"],
                      minHeight: "48px",
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <em>Pilih Cabang {/* cspell:disable-line */}</em>
                  </MenuItem>
                  <MenuItem value={1}>
                    Cabang 1 {/* cspell:disable-line */}
                  </MenuItem>
                  <MenuItem value={2}>
                    Cabang 2 {/* cspell:disable-line */}
                  </MenuItem>
                </Select>
                {errors.branch && (
                  <Typography
                    color="error"
                    variant="caption"
                    sx={{ mt: 0.5, ml: 1.5, fontFamily: robotoFontFamily }}
                  >
                    {errors.branch}
                  </Typography>
                )}
              </FormControl>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCancel}
                disabled={isLoading}
                sx={{
                  flex: 1,
                  backgroundColor: lightButtonBackground,
                  color: primaryDarkColor,
                  fontSize: "18px",
                  fontFamily: robotoFontFamily,
                  fontWeight: "700",
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
                  isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                disabled={isLoading}
                sx={{
                  flex: 1,
                  backgroundColor: primaryDarkColor,
                  color: "white",
                  fontSize: "18px",
                  fontFamily: robotoFontFamily,
                  fontWeight: "700",
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
        </Paper>
      </Container>
      <Footer />
    </Box>
  );
};

export default EditProfilePage;
