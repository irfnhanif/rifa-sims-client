import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  useTheme,
  Alert,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Paper,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
} from "@zxing/library";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import type { CreateItemRequest } from "../../types/item";
import { createItem } from "../../api/items";

import RemoveIcon from "@mui/icons-material/RemoveCircleOutline";
import AddIcon from "@mui/icons-material/AddCircleOutline";
import SaveIcon from "@mui/icons-material/Save";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface FormData {
  name: string;
  description: string;
  barcode: string;
  currentStock: number | string;
  threshold: number | string;
  wholesalePrice: number | string;
  retailPrice: number | string;
  profitPercentage: number | string;
}

interface FormErrors {
  name?: string;
  description?: string;
  barcode?: string;
  currentStock?: string;
  threshold?: string;
  wholesalePrice?: string;
  retailPrice?: string;
  profitPercentage?: string;
  form?: string;
}

const AddItemPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const primaryDarkColor = "#2D3648";
  const inputOutlineColor = "#CBD2E0";
  const lightButtonBackground = "#EDF0F7";
  const scannerAreaBackground = "#EDF0F7";
  const scannerAreaOutline = `2px solid ${primaryDarkColor}`;

  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isLoadingCameras, setIsLoadingCameras] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [isProcessingBarcode, setIsProcessingBarcode] =
    useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef<boolean>(false);
  const isUnmountedRef = useRef<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    barcode: "",
    currentStock: "",
    threshold: "",
    wholesalePrice: "",
    retailPrice: "",
    profitPercentage: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const SUCCESS_MESSAGE = "berhasil";

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

  const hints = useMemo(() => {
    const hintMap = new Map();
    const oneDFormats = [
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.EAN_8,
      BarcodeFormat.EAN_13,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODE_128,
      BarcodeFormat.ITF,
    ];
    hintMap.set(DecodeHintType.POSSIBLE_FORMATS, oneDFormats);
    return hintMap;
  }, []);

  const stopScan = useCallback(() => {
    scanningRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
      videoRef.current.load();
    }

    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (error) {
        console.warn("Error resetting code reader:", error);
      }
      codeReaderRef.current = null;
    }

    if (!isUnmountedRef.current) {
      setIsScanning(false);
      setIsProcessingBarcode(false);
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((track) => track.stop());

      if (!isUnmountedRef.current) {
        setPermissionDenied(false);
        setNeedsPermission(false);
      }
      return true;
    } catch (error) {
      console.error("Camera permission denied:", error);

      if (!isUnmountedRef.current) {
        setPermissionDenied(true);
        setNeedsPermission(false);
        setScanError(
          "Izin kamera diperlukan untuk memindai barcode. Harap aktifkan akses kamera di pengaturan browser Anda."
        );
      }
      return false;
    }
  }, []);

  const handleBarcodeDetected = useCallback(
    (barcode: string) => {
      if (isProcessingBarcode || !scanningRef.current || isUnmountedRef.current)
        return;

      scanningRef.current = false;
      setIsProcessingBarcode(true);

      setFormData((prev) => ({ ...prev, barcode }));

      if (errors.barcode) {
        setErrors((prev) => ({ ...prev, barcode: undefined }));
      }

      setTimeout(() => {
        stopScan();
        setIsScannerOpen(false);
      }, 1500);
    },
    [stopScan, errors.barcode, isProcessingBarcode]
  );

  const startBarcodeScanning = useCallback(async () => {
    if (!codeReaderRef.current || !videoRef.current || isUnmountedRef.current) {
      return;
    }

    scanningRef.current = true;

    try {
      const result = await codeReaderRef.current.decodeOnceFromVideoDevice(
        undefined,
        videoRef.current
      );

      if (result && scanningRef.current && !isUnmountedRef.current) {
        const barcode = result.getText();
        handleBarcodeDetected(barcode);
      }
    } catch (error) {
      if (isUnmountedRef.current) return;

      if (error instanceof NotFoundException) {
        if (scanningRef.current) {
          setTimeout(() => {
            if (scanningRef.current && !isUnmountedRef.current) {
              startBarcodeScanning();
            }
          }, 500);
        }
      } else {
        if (scanningRef.current) {
          setTimeout(() => {
            if (scanningRef.current && !isUnmountedRef.current) {
              startBarcodeScanning();
            }
          }, 500);
        }
      }
    }
  }, [handleBarcodeDetected]);

  const startScan = useCallback(async () => {
    if (!videoRef.current || isUnmountedRef.current) return;

    setIsScanning(true);
    setScanError(null);
    setIsProcessingBarcode(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (isUnmountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error("Video element not available"));
          return;
        }

        const handleLoadedMetadata = () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener(
              "loadedmetadata",
              handleLoadedMetadata
            );
          }
          resolve();
        };

        const handleError = (error: Event) => {
          if (videoRef.current) {
            videoRef.current.removeEventListener("error", handleError);
          }
          reject(error);
        };

        videoRef.current.addEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        videoRef.current.addEventListener("error", handleError);
      });

      if (isUnmountedRef.current) return;

      if (videoRef.current) {
        try {
          if (videoRef.current.paused || videoRef.current.readyState < 3) {
            await videoRef.current.play();
          }
        } catch (playError) {
          throw new Error("Failed to start video playback");
        }
      }

      if (isUnmountedRef.current) return;

      codeReaderRef.current = new BrowserMultiFormatReader(hints);

      setTimeout(() => {
        if (!isUnmountedRef.current) {
          startBarcodeScanning();
        }
      }, 500);
    } catch (err: unknown) {
      if (isUnmountedRef.current) return;

      let message = `Gagal memulai kamera: ${
        err instanceof Error ? err.message : "Kesalahan tidak diketahui"
      }.`;

      if (err instanceof Error && err.name === "NotAllowedError") {
        message =
          "Izin kamera ditolak. Harap aktifkan akses kamera di pengaturan browser Anda.";
        setPermissionDenied(true);
      } else if (err instanceof Error && err.name === "NotReadableError") {
        message =
          "Kamera sedang digunakan atau tidak tersedia. Silakan coba lagi.";
      }
      setScanError(message);
      setIsScanning(false);
    }
  }, [hints, startBarcodeScanning]);

  const initializeCamera = useCallback(async () => {
    if (isUnmountedRef.current) return;

    setIsLoadingCameras(true);

    const hasPermission = await requestCameraPermission();
    if (!hasPermission || isUnmountedRef.current) {
      setIsLoadingCameras(false);
      return false;
    }

    if (!isUnmountedRef.current) {
      setIsLoadingCameras(false);
    }
    return true;
  }, [requestCameraPermission]);

  const handleOpenScanner = async () => {
    setIsScannerOpen(true);
    setScanError(null);
    setPermissionDenied(false);
    setNeedsPermission(false);
    setIsProcessingBarcode(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanError("Browser Anda tidak mendukung akses kamera");
      setIsLoadingCameras(false);
      return;
    }

    try {
      const permissionResult = await navigator.permissions?.query({
        name: "camera" as PermissionName,
      });

      if (permissionResult?.state === "granted") {
        setNeedsPermission(false);
        const hasPermission = await initializeCamera();
        if (hasPermission) {
          setTimeout(() => {
            if (!isUnmountedRef.current) {
              startScan();
            }
          }, 500);
        }
      } else {
        setNeedsPermission(true);
        setIsLoadingCameras(false);
      }
    } catch {
      setNeedsPermission(true);
      setIsLoadingCameras(false);
    }
  };

  const handleCloseScanner = () => {
    stopScan();
    setIsScannerOpen(false);
    setScanError(null);
    setPermissionDenied(false);
    setNeedsPermission(false);
    setIsProcessingBarcode(false);
  };

  const handleRequestPermission = async () => {
    setNeedsPermission(false);
    const hasPermission = await initializeCamera();
    if (hasPermission) {
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          startScan();
        }
      }, 500);
    }
  };

  const handleRetryScanner = () => {
    setScanError(null);
    setIsProcessingBarcode(false);
    startScan();
  };

  const handleStartScan = () => {
    if (isScanning) {
      stopScan();
    } else {
      startScan();
    }
  };

  const getCameraIcon = () => {
    if (isProcessingBarcode) {
      return <CheckCircleIcon sx={{ fontSize: "28px", color: "#4caf50" }} />;
    }
    if (isScanning) {
      return <StopIcon sx={{ fontSize: "28px" }} />;
    }
    return <PlayArrowIcon sx={{ fontSize: "28px" }} />;
  };

  const getCameraTooltip = () => {
    if (isProcessingBarcode) {
      return "Memproses Barcode";
    }
    if (isScanning) {
      return "Hentikan Pemindaian";
    }
    return "Mulai Pemindaian";
  };

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      stopScan();
    };
  }, [stopScan]);

  useEffect(() => {
    isUnmountedRef.current = false;
  }, []);

  const createItemMutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["stockAuditLogs"] });

      setErrors({
        form: "Barang berhasil ditambahkan!",
      });
      setFormData({
        name: "",
        description: "",
        barcode: "",
        currentStock: "",
        threshold: "",
        wholesalePrice: "",
        retailPrice: "",
        profitPercentage: "",
      });

      setTimeout(() => {
        navigate(-1);
      }, 1000);
    },
    onError: (error: Error & { errors?: string[]; status?: number }) => {
      const serverFieldErrors: FormErrors = {};

      const fieldMapping: Record<string, keyof FormErrors> = {
        name: "name",
        description: "description",
        barcode: "barcode",
        currentStock: "currentStock",
        threshold: "threshold",
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
    name: keyof Pick<
      FormData,
      "currentStock" | "threshold" | "profitPercentage"
    >,
    value: string
  ) => {
    if (name === "profitPercentage") {
      if (value === "" || /^-?[0-9]*\.?[0-9]*$/.test(value)) {
        const numValue = parseFloat(value) || 0;

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
    } else {
      if (value === "" || /^[0-9\b]+$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
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
    name: keyof Pick<
      FormData,
      "currentStock" | "threshold" | "profitPercentage"
    >,
    delta: number
  ) => {
    setFormData((prev) => {
      const currentValue = Number(prev[name]) || 0;
      let newValue = currentValue + delta;

      if (name === "profitPercentage") {
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
      } else {
        newValue = Math.max(0, newValue);
        return { ...prev, [name]: newValue };
      }
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

    const wholesalePrice =
      typeof formData.wholesalePrice === "string"
        ? parseCurrency(formData.wholesalePrice.toString())
        : Number(formData.wholesalePrice) || 0;
    if (wholesalePrice <= 0) {
      newErrors.wholesalePrice = "Harga Grosir harus lebih dari 0.";
    }

    const retailPrice =
      typeof formData.retailPrice === "string"
        ? parseCurrency(formData.retailPrice.toString())
        : Number(formData.retailPrice) || 0;
    if (retailPrice <= 0) {
      newErrors.retailPrice = "Harga Eceran harus lebih dari 0.";
    }

    const profitPercentage = Number(formData.profitPercentage) || 0;
    if (profitPercentage < 0) {
      newErrors.profitPercentage = "Margin Keuntungan tidak boleh negatif.";
    } else if (profitPercentage > 100) {
      newErrors.profitPercentage =
        "Margin Keuntungan tidak boleh lebih dari 100%.";
    }

    if (wholesalePrice > 0 && retailPrice > 0 && retailPrice < wholesalePrice) {
      newErrors.retailPrice =
        "Harga Eceran tidak boleh lebih rendah dari Harga Grosir.";
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
              <Tooltip title="Pindai Barcode">
                <IconButton
                  onClick={handleOpenScanner}
                  disabled={isLoading}
                  sx={{
                    background: primaryDarkColor,
                    color: "white",
                    borderRadius: "6px",
                    padding: "12px",
                    minHeight: "48px",
                    "&:hover": { background: "#1E2532" },
                    "&:disabled": {
                      background: theme.palette.grey[400],
                      color: theme.palette.grey[200],
                    },
                  }}
                >
                  <QrCodeScannerIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box>
            <Typography sx={labelStyles}>Harga Grosir</Typography>
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
            <Typography sx={labelStyles}>Margin Keuntungan</Typography>
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
            <Typography sx={labelStyles}>Harga Eceran</Typography>
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

          <Box>
            <Typography sx={labelStyles}>Jumlah Stok</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
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
            <Typography sx={labelStyles}>Batas Minimal Stok</Typography>
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

      <Dialog
        open={isScannerOpen}
        onClose={handleCloseScanner}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              maxHeight: "90vh",
              mx: { xs: 1, sm: 2 },
              my: { xs: 1, sm: 2 },
              width: { xs: "calc(100% - 16px)", sm: "calc(100% - 32px)" },
              maxWidth: { xs: "none", sm: "500px" },
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
            px: { xs: 2, sm: 3 },
            fontWeight: 600,
            fontSize: { xs: "1.1rem", sm: "1.25rem" },
          }}
        >
          Pindai Barcode
          <IconButton
            onClick={handleCloseScanner}
            sx={{
              color: theme.palette.grey[500],
              "&:hover": { color: theme.palette.grey[700] },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          <Paper
            elevation={0}
            sx={{
              position: "relative",
              background: scannerAreaBackground,
              border: scannerAreaOutline,
              borderRadius: "8px",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: { xs: "250px", sm: "300px" },
              aspectRatio: "4/3",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: isScanning ? "block" : "none",
              }}
            />

            {(isLoadingCameras || isProcessingBarcode) && (
              <Box sx={{ position: "absolute", textAlign: "center" }}>
                <CircularProgress />
                <Typography
                  variant="body2"
                  sx={{ mt: 1, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                >
                  {isProcessingBarcode
                    ? "Memproses barcode..."
                    : "Memuat kamera..."}
                </Typography>
              </Box>
            )}

            {needsPermission && (
              <Box
                sx={{
                  position: "absolute",
                  textAlign: "center",
                  p: { xs: 2, sm: 3 },
                }}
              >
                <QrCodeScannerIcon
                  sx={{
                    fontSize: { xs: 48, sm: 64 },
                    color: primaryDarkColor,
                    mb: 2,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{ mb: 2, fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  Akses Kamera Diperlukan
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 3,
                    color: theme.palette.text.secondary,
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  }}
                >
                  Aplikasi memerlukan izin untuk mengakses kamera untuk memindai
                  barcode
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleRequestPermission}
                  size={window.innerWidth < 600 ? "small" : "medium"}
                  sx={{
                    background: primaryDarkColor,
                    color: "white",
                    "&:hover": { background: "#1E2532" },
                  }}
                  startIcon={<QrCodeScannerIcon />}
                >
                  Izinkan Akses Kamera
                </Button>
              </Box>
            )}

            {permissionDenied && (
              <Box
                sx={{
                  position: "absolute",
                  textAlign: "center",
                  p: { xs: 2, sm: 3 },
                }}
              >
                <CloseIcon
                  sx={{
                    fontSize: { xs: 48, sm: 64 },
                    color: theme.palette.error.main,
                    mb: 2,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: theme.palette.error.main,
                    fontSize: { xs: "1rem", sm: "1.25rem" },
                  }}
                >
                  Izin Kamera Ditolak
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 3,
                    color: theme.palette.text.secondary,
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  }}
                >
                  Harap aktifkan izin kamera di pengaturan browser Anda,
                  kemudian coba lagi
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleRequestPermission}
                  size={window.innerWidth < 600 ? "small" : "medium"}
                  sx={{
                    borderColor: primaryDarkColor,
                    color: primaryDarkColor,
                    "&:hover": {
                      borderColor: "#1E2532",
                      backgroundColor: "rgba(45, 54, 72, 0.08)",
                    },
                  }}
                  startIcon={<QrCodeScannerIcon />}
                >
                  Coba Lagi
                </Button>
              </Box>
            )}

            {!isLoadingCameras &&
              !isScanning &&
              !needsPermission &&
              !permissionDenied &&
              !scanError &&
              !isProcessingBarcode && (
                <Box sx={{ position: "absolute", textAlign: "center" }}>
                  <QrCodeScannerIcon
                    sx={{
                      fontSize: { xs: 48, sm: 64 },
                      color: theme.palette.grey[400],
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 2,
                      color: theme.palette.text.secondary,
                      fontSize: { xs: "0.8rem", sm: "0.875rem" },
                    }}
                  >
                    Klik tombol untuk memulai pemindaian
                  </Typography>
                </Box>
              )}

            {isScanning && (
              <Box
                sx={{
                  position: "absolute",
                  width: "80%",
                  height: "40%",
                  border: "2px solid rgba(255,255,255,0.7)",
                  borderRadius: "8px",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                }}
              />
            )}

            {isProcessingBarcode && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  color: "white",
                  backgroundColor: "#4caf50",
                  padding: 3,
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 48, color: "white", mb: 1 }} />
                <Typography
                  variant="h6"
                  sx={{ color: "white", fontWeight: 600 }}
                >
                  Barcode Terdeteksi!
                </Typography>
                <Typography variant="body2" sx={{ color: "white", mt: 1 }}>
                  Menutup Pemindai...
                </Typography>
              </Box>
            )}

            {scanError && (
              <Box
                sx={{
                  position: "absolute",
                  textAlign: "center",
                  p: { xs: 2, sm: 3 },
                }}
              >
                <Alert
                  severity="error"
                  sx={{ mb: 2, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={handleRetryScanner}
                    >
                      Coba Lagi
                    </Button>
                  }
                >
                  {scanError}
                </Alert>
              </Box>
            )}
          </Paper>

          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              mt: 2,
              color: theme.palette.text.secondary,
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
            }}
          >
            {isScanning
              ? "Arahkan kamera ke barcode untuk memindai secara otomatis"
              : isProcessingBarcode
              ? "Sedang memproses barcode yang terdeteksi..."
              : "Tekan tombol untuk memulai pemindaian barcode"}
          </Typography>

          {!needsPermission &&
            !permissionDenied &&
            !isLoadingCameras &&
            !isProcessingBarcode && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mt: 2,
                }}
              >
                <Tooltip title={getCameraTooltip()}>
                  <IconButton
                    onClick={handleStartScan}
                    disabled={false}
                    sx={{
                      padding: { xs: "16px", sm: "20px" },
                      background: primaryDarkColor,
                      borderRadius: "50%",
                      color: "white",
                      transform: { xs: "scale(1.1)", sm: "scale(1.2)" },
                      "&:hover": {
                        background: "#1E2532",
                        transform: { xs: "scale(1.15)", sm: "scale(1.25)" },
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    {getCameraIcon()}
                  </IconButton>
                </Tooltip>
              </Box>
            )}
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddItemPage;
