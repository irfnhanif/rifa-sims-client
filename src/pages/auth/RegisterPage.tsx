import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  CircularProgress,
  Alert,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { register } from "../../api/auth";
import type { RegisterRequest } from "../../types/user";

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  branch: number;
}

interface FormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
  branch?: string;
  form?: string;
}

const RegisterPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const primaryDarkColor = "#2D3648";
  const inputOutlineColor = "#CBD2E0";

  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    confirmPassword: "",
    branch: 1,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successData, setSuccessData] = useState({ data: "", message: "" });

  const robotoFontFamily = "Roboto, sans-serif";

  const registerMutation = useMutation({
    mutationFn: (data: Partial<RegisterRequest>) => register(data),
    onSuccess: (response: string[]) => {
      // response is [result.data, result.message]
      setSuccessData({
        data: response[0] || "",
        message: response[1] || "",
      });
      setSuccessDialogOpen(true);
    },
    onError: (error: Error) => {
      setErrors({ form: error.message });
    },
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    // For branch field, only allow numeric values 1 or 2
    if (name === "branch") {
      const numericValue = parseInt(value, 10);
      if (value === "" || (numericValue >= 1 && numericValue <= 2)) {
        setFormData((prev) => ({ ...prev, [name]: numericValue || 1 }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
    }
  };

  const handleBranchChange = (event: any) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, branch: value }));
    if (errors.branch) {
      setErrors((prev) => ({ ...prev, branch: undefined, form: undefined }));
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  // Prevent copy/paste for password fields
  const handlePasswordKeyDown = (event: React.KeyboardEvent) => {
    if (
      event.ctrlKey &&
      (event.key === "c" || event.key === "v" || event.key === "x")
    ) {
      event.preventDefault();
    }
  };

  const handlePasswordContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const validateForm = (): { isValid: boolean; newErrors: FormErrors } => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username =
        "Username tidak boleh kosong."; /* cspell:disable-line */
    }

    if (!formData.password) {
      newErrors.password =
        "Password tidak boleh kosong."; /* cspell:disable-line */
    } else if (formData.password.length < 8) {
      newErrors.password =
        "Password minimal 8 karakter."; /* cspell:disable-line */
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        "Konfirmasi password tidak boleh kosong."; /* cspell:disable-line */
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword =
        "Password tidak cocok."; /* cspell:disable-line */
    }

    if (!formData.branch || (formData.branch !== 1 && formData.branch !== 2)) {
      newErrors.branch =
        "Pilih cabang yang valid (1 atau 2)."; /* cspell:disable-line */
    }

    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const { isValid, newErrors } = validateForm();
    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    registerMutation.mutate({
      username: formData.username,
      password: formData.password,
      branch: formData.branch,
    });
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    navigate("/auth/login");
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
      fontFamily: robotoFontFamily,
    },
    "& .MuiFormLabel-root": {
      fontFamily: robotoFontFamily,
    },
    "& .MuiFormHelperText-root": {
      fontFamily: robotoFontFamily,
    },
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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          theme.palette.mode === "light"
            ? theme.palette.grey[100]
            : theme.palette.background.default,
        p: { xs: 2, sm: 3 },
      }}
    >
      <Container component="main" maxWidth="xs" disableGutters>
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: theme.spacing(2.5),
            borderRadius: "8px",
          }}
        >
          <Box
            sx={{
              width: 160,
              height: 32,
              background: primaryDarkColor,
              borderBottomLeftRadius: "8px",
              borderBottomRightRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontFamily: robotoFontFamily,
              fontWeight: "bold",
              fontSize: "14px",
              mb: 1,
            }}
          >
            Rifa-SIMS {/* cspell:disable-line */}
          </Box>

          <Typography
            component="h1"
            sx={{
              fontSize: "32px",
              fontFamily: robotoFontFamily,
              fontWeight: "700",
              color: "black",
              lineHeight: "41.60px",
              textAlign: "center",
            }}
          >
            Daftar {/* cspell:disable-line */}
          </Typography>

          {errors.form && (
            <Alert
              severity="error"
              sx={{ width: "100%", fontFamily: robotoFontFamily }}
            >
              {errors.form}
            </Alert>
          )}

          <Box
            component="form"
            noValidate
            onSubmit={handleRegister}
            sx={{ width: "100%", mt: 1 }}
          >
            {/* Username Field */}
            <Box sx={{ mb: "24px" }}>
              <Typography sx={labelStyles}>Username</Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                placeholder="Masukkan username Anda" /* cspell:disable-line */
                value={formData.username}
                onChange={handleInputChange}
                error={!!errors.username}
                helperText={errors.username || ""}
                disabled={registerMutation.isPending}
                sx={{
                  ...commonTextFieldStyles,
                  "& .MuiOutlinedInput-root": {
                    ...commonTextFieldStyles["& .MuiOutlinedInput-root"],
                    minHeight: "48px",
                  },
                }}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: "24px" }}>
              <Typography sx={labelStyles}>Password</Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                name="password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="new-password"
                placeholder="Masukkan password Anda" /* cspell:disable-line */
                value={formData.password}
                onChange={handleInputChange}
                onKeyDown={handlePasswordKeyDown}
                onContextMenu={handlePasswordContextMenu}
                error={!!errors.password}
                helperText={errors.password || ""}
                disabled={registerMutation.isPending}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          disabled={registerMutation.isPending}
                        >
                          {showPassword ? (
                            <VisibilityOff sx={{ color: primaryDarkColor }} />
                          ) : (
                            <Visibility sx={{ color: primaryDarkColor }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
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

            {/* Confirm Password Field */}
            <Box sx={{ mb: "24px" }}>
              <Typography sx={labelStyles}>
                Konfirmasi Password {/* cspell:disable-line */}
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                name="confirmPassword"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                placeholder="Konfirmasi password Anda" /* cspell:disable-line */
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onKeyDown={handlePasswordKeyDown}
                onContextMenu={handlePasswordContextMenu}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword || ""}
                disabled={registerMutation.isPending}
                slotProps={{
                  input: {},
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
            <Box sx={{ mb: "24px" }}>
              <Typography sx={labelStyles}>
                Cabang {/* cspell:disable-line */}
              </Typography>
              <FormControl fullWidth error={!!errors.branch}>
                <Select
                  value={formData.branch}
                  onChange={handleBranchChange}
                  disabled={registerMutation.isPending}
                  size="small"
                  sx={{
                    ...commonTextFieldStyles,
                    "& .MuiOutlinedInput-root": {
                      ...commonTextFieldStyles["& .MuiOutlinedInput-root"],
                      minHeight: "48px",
                    },
                  }}
                >
                  <MenuItem value={1}>
                    Cabang 1 {/* cspell:disable-line */}
                  </MenuItem>
                  <MenuItem value={2}>
                    Cabang 2 {/* cspell:disable-line */}
                  </MenuItem>
                </Select>
                {errors.branch && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{
                      mt: 0.5,
                      ml: 1.5,
                      fontFamily: robotoFontFamily,
                    }}
                  >
                    {errors.branch}
                  </Typography>
                )}
              </FormControl>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={registerMutation.isPending}
              sx={{
                mt: 0,
                mb: 1.5,
                padding: "16px 24px",
                backgroundColor: primaryDarkColor,
                color: "white",
                fontSize: "18px",
                fontFamily: robotoFontFamily,
                fontWeight: "700",
                lineHeight: "24px",
                borderRadius: "6px",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#1E2532",
                },
              }}
            >
              {registerMutation.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Daftar" /* cspell:disable-line */
              )}
            </Button>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "14px",
                  fontFamily: robotoFontFamily,
                  fontWeight: "700",
                  lineHeight: "24px",
                }}
              >
                Sudah Punya Akun? {/* cspell:disable-line */}
                <MuiLink
                  component="button"
                  variant="body2"
                  onClick={() => {
                    navigate("/auth/login");
                  }}
                  sx={{
                    fontSize: "14px",
                    fontFamily: robotoFontFamily,
                    fontWeight: "700",
                    color: primaryDarkColor,
                    lineHeight: "24px",
                    textTransform: "none",
                    textDecoration: "underline",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Masuk {/* cspell:disable-line */}
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>

      <Dialog
        open={successDialogOpen}
        onClose={handleSuccessDialogClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "8px",
              p: 2,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            fontFamily: robotoFontFamily,
            fontWeight: "700",
            color: primaryDarkColor,
            pb: 1,
          }}
        >
          Registrasi Berhasil {/* cspell:disable-line */}
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography
            sx={{
              fontFamily: robotoFontFamily,
              fontSize: "14px",
              fontWeight: "300",
              color: primaryDarkColor,
              mb: 2,
            }}
          >
            {successData.message}
          </Typography>

          <Typography
            sx={{
              fontFamily: robotoFontFamily,
              fontSize: "14px",
              color: "text.secondary",
              backgroundColor: theme.palette.grey[50],
              p: 2,
              borderRadius: 1,
              border: `1px solid ${theme.palette.grey[200]}`,
            }}
          >
            {successData.data}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pt: 2 }}>
          <Button
            onClick={handleSuccessDialogClose}
            variant="contained"
            sx={{
              backgroundColor: primaryDarkColor,
              color: "white",
              fontFamily: robotoFontFamily,
              fontWeight: "600",
              px: 4,
              py: 1,
              "&:hover": {
                backgroundColor: "#1E2532",
              },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegisterPage;
