import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { useAuth } from "../../helper/use-auth";
import type { LoginRequest } from "../../types/user";

interface FormData {
  username: string;
  password: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  form?: string;
}

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin, isAuthenticated, isLoading } = useAuth();

  const primaryDarkColor = "#2D3648";
  const inputOutlineColor = "#CBD2E0";

  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const robotoFontFamily = "Roboto, sans-serif";

  const loginMutation = useMutation({
    mutationFn: (credentials: Partial<LoginRequest>) => authLogin(credentials),
    onSuccess: () => {
      setErrors({ form: "Login berhasil!" });
      const from = location.state?.from?.pathname || "/";
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    },
    onError: (error: Error) => {
      setErrors({ form: error.message });
    },
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
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
    }
    return { isValid: Object.keys(newErrors).length === 0, newErrors };
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const { isValid, newErrors } = validateForm();
    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    loginMutation.mutate({
      username: formData.username,
      password: formData.password,
    });
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

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  if (isLoading) {
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
          {/* App Logo/Title */}
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
            Masuk {/* cspell:disable-line */}
          </Typography>

          {errors.form && (
            <Alert
              severity={
                errors.form.includes("berhasil") ? "success" : "error"
              } /* cspell:disable-line */
              sx={{ width: "100%", fontFamily: robotoFontFamily }}
            >
              {errors.form}
            </Alert>
          )}

          <Box
            component="form"
            noValidate
            onSubmit={handleLogin}
            sx={{ width: "100%", mt: 1 }}
          >
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
                disabled={loginMutation.isPending}
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
              <Typography sx={labelStyles}>Password</Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                name="password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                placeholder="Masukkan password Anda" /* cspell:disable-line */
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password || ""}
                disabled={loginMutation.isPending}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          disabled={loginMutation.isPending}
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

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loginMutation.isPending}
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
              {loginMutation.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Masuk" /* cspell:disable-line */
              )}
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <MuiLink
                component="button"
                variant="body2"
                onClick={() => {
                  console.log("Navigate to Create Account page");
                  // navigate('/register');
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
                Belum Punya Akun? Buat Akun {/* cspell:disable-line */}
              </MuiLink>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
