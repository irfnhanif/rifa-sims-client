import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Container,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  useTheme,
  Tooltip,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
} from "@zxing/library";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { fetchItemStockByBarcode } from "../../api/stocks";
import type { BarcodeScanResponse } from "../../types/item-stock";

import FlashOnIcon from "@mui/icons-material/FlashOn";
import FlashOffIcon from "@mui/icons-material/FlashOff";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import HistoryIcon from "@mui/icons-material/History";

interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

const ScanBarcodePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const primaryDarkColor = "#2D3648";
  const scannerAreaBackground = "#EDF0F7";
  const scannerAreaOutline = `2px solid ${primaryDarkColor}`;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef<boolean>(false);
  const isUnmountedRef = useRef<boolean>(false);

  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isLoadingCameras, setIsLoadingCameras] = useState<boolean>(true);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [isProcessingBarcode, setIsProcessingBarcode] =
    useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [hasFlash, setHasFlash] = useState<boolean>(false);

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

  const barcodeMutation = useMutation({
    mutationFn: fetchItemStockByBarcode,
    onSuccess: (response: BarcodeScanResponse[], barcode: string) => {
      if (isUnmountedRef.current) return;

      if (response.length === 0) {
        setScanError("Barcode tidak ditemukan dalam sistem");
        setIsProcessingBarcode(false);
        return;
      }

      if (response.length === 1) {
        navigate(`/scan/${response[0].itemStockId}/input`, {
          state: { itemName: response[0].itemName, barcode: barcode, currentStock: response[0].currentStock },
        });
      } else {
        navigate("/scan/choose-item", {
          state: { items: response, barcode: barcode },
        });
      }
    },
    onError: () => {
      if (!isUnmountedRef.current) {
        setScanError("Gagal memproses barcode. Silakan coba lagi.");
        setIsProcessingBarcode(false);
      }
    },
  });

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
      setIsFlashOn(false);
    }
  }, []);

  const checkDeviceCapabilities = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      const track = stream.getVideoTracks()[0];
      const capabilities =
        track.getCapabilities() as ExtendedMediaTrackCapabilities;

      if (!isUnmountedRef.current) {
        setHasFlash(!!capabilities.torch);
      }

      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.error("Error checking device capabilities:", err);
      if (!isUnmountedRef.current) {
        setHasFlash(false);
      }
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

      stopScan();
      barcodeMutation.mutate(barcode);
    },
    [isProcessingBarcode, stopScan, barcodeMutation]
  );

  const startBarcodeScanning = useCallback(async () => {
    if (!codeReaderRef.current || !videoRef.current || isUnmountedRef.current) {
      console.error("Barcode reader or video not initialized");
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
        console.error("Unexpected error during barcode scanning:", error);
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
    setIsFlashOn(false);
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
          console.error("Error starting video playbook:", playError);
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

      const track = stream.getVideoTracks()[0];
      const capabilities =
        track.getCapabilities() as ExtendedMediaTrackCapabilities;
      if (!isUnmountedRef.current) {
        setHasFlash(!!capabilities.torch);
      }
    } catch (err: unknown) {
      if (isUnmountedRef.current) return;

      console.error("Failed to start scanner:", err);
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
      return;
    }

    await checkDeviceCapabilities();

    if (!isUnmountedRef.current) {
      setIsLoadingCameras(false);
    }
  }, [requestCameraPermission, checkDeviceCapabilities]);

  useEffect(() => {
    isUnmountedRef.current = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanError("Browser Anda tidak mendukung akses kamera");
      setIsLoadingCameras(false);
      return;
    }

    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((result) => {
        if (isUnmountedRef.current) return;

        if (result.state === "granted") {
          setNeedsPermission(false);
          initializeCamera();
        } else {
          setNeedsPermission(true);
          setIsLoadingCameras(false);
        }
      })
      .catch(() => {
        if (isUnmountedRef.current) return;

        setNeedsPermission(true);
        setIsLoadingCameras(false);
      });

    return () => {
      isUnmountedRef.current = true;
      stopScan();
    };
  }, [initializeCamera, stopScan]);

  const handleRequestPermission = async () => {
    setNeedsPermission(false);
    await initializeCamera();
  };

  const handleToggleFlash = async () => {
    if (!streamRef.current) {
      setScanError("Kamera tidak tersedia untuk mengaktifkan lampu kilat");
      return;
    }

    const track = streamRef.current.getVideoTracks()[0];
    if (!track) {
      setScanError("Track video tidak ditemukan");
      return;
    }

    try {
      await track.applyConstraints({
        advanced: [{ torch: !isFlashOn } as MediaTrackConstraintSet],
      });
      setIsFlashOn(!isFlashOn);
      setScanError(null);
    } catch (err: unknown) {
      console.error("Error toggling flash:", err);
      setScanError(
        "Gagal mengaktifkan lampu kilat. Fitur mungkin tidak didukung."
      );
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleScanHistory = () => {
    navigate("/scan/history");
  };

  const handleRetry = () => {
    setScanError(null);
    setIsProcessingBarcode(false);
    startScan();
  };

  const getCameraIcon = () => {
    if (isProcessingBarcode || barcodeMutation.isPending) {
      return (
        <FiberManualRecordIcon sx={{ fontSize: "28px", color: "#ff1744" }} />
      );
    }
    if (isScanning) {
      return <StopIcon sx={{ fontSize: "28px" }} />;
    }
    return <PlayArrowIcon sx={{ fontSize: "28px" }} />;
  };

  const getCameraTooltip = () => {
    if (isProcessingBarcode || barcodeMutation.isPending) {
      return "Memproses Barcode";
    }
    if (isScanning) {
      return "Hentikan Pemindaian";
    }
    return "Mulai Pemindaian";
  };

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
        title="Pindai Barcode"
        showBackButton={true}
        onBackClick={handleBackClick}
      />

      <Container
        component="main"
        maxWidth={false}
        disableGutters
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            px: { xs: 2, sm: 3, md: "36px" },
            py: { xs: 2, sm: 3, md: "24px" },
            gap: "24px",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Tooltip title="Riwayat Pemindaian">
              <IconButton
                onClick={handleScanHistory}
                sx={{
                  padding: "12px",
                  background: primaryDarkColor,
                  borderRadius: "6px",
                  color: "white",
                  "&:hover": { background: "#1E2532" },
                }}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Paper
            elevation={0}
            sx={{
              flexGrow: 1,
              position: "relative",
              background: scannerAreaBackground,
              border: scannerAreaOutline,
              borderRadius: "4px",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
              maxHeight: "60vh",
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
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            />

            {(isLoadingCameras ||
              isProcessingBarcode ||
              barcodeMutation.isPending) && (
              <Box sx={{ position: "absolute", textAlign: "center" }}>
                <CircularProgress />
                {(isProcessingBarcode || barcodeMutation.isPending) && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Memproses barcode...
                  </Typography>
                )}
                {isLoadingCameras && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Memuat kamera...
                  </Typography>
                )}
              </Box>
            )}

            {!isLoadingCameras && needsPermission && (
              <Box sx={{ position: "absolute", textAlign: "center", p: 3 }}>
                <CameraAltIcon
                  sx={{ fontSize: 64, color: primaryDarkColor, mb: 2 }}
                />
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Akses Kamera Diperlukan
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, color: theme.palette.text.secondary }}
                >
                  Aplikasi memerlukan izin untuk mengakses kamera untuk memindai
                  barcode
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleRequestPermission}
                  sx={{
                    background: primaryDarkColor,
                    color: "white",
                    "&:hover": { background: "#1E2532" },
                    padding: "12px 24px",
                    borderRadius: "8px",
                  }}
                  startIcon={<CameraAltIcon />}
                >
                  Izinkan Akses Kamera
                </Button>
              </Box>
            )}

            {!isLoadingCameras && permissionDenied && (
              <Box sx={{ position: "absolute", textAlign: "center", p: 3 }}>
                <StopIcon
                  sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2 }}
                />
                <Typography
                  variant="h6"
                  sx={{ mb: 2, color: theme.palette.error.main }}
                >
                  Izin Kamera Ditolak
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, color: theme.palette.text.secondary }}
                >
                  Harap aktifkan izin kamera di pengaturan browser Anda,
                  kemudian coba lagi
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleRequestPermission}
                  sx={{
                    borderColor: primaryDarkColor,
                    color: primaryDarkColor,
                    "&:hover": {
                      borderColor: "#1E2532",
                      backgroundColor: "rgba(45, 54, 72, 0.08)",
                    },
                    padding: "12px 24px",
                    borderRadius: "8px",
                  }}
                  startIcon={<CameraAltIcon />}
                >
                  Coba Lagi
                </Button>
              </Box>
            )}

            {!isLoadingCameras &&
              !isScanning &&
              !needsPermission &&
              !permissionDenied &&
              !isProcessingBarcode &&
              !barcodeMutation.isPending && (
                <Box sx={{ position: "absolute", textAlign: "center" }}>
                  <CameraAltIcon
                    sx={{ fontSize: 64, color: theme.palette.grey[400] }}
                  />
                </Box>
              )}

            {!isLoadingCameras &&
              scanError &&
              !isScanning &&
              !permissionDenied &&
              !needsPermission && (
                <Box sx={{ position: "absolute", textAlign: "center", p: 3 }}>
                  <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={handleRetry}
                      >
                        Coba Lagi
                      </Button>
                    }
                  >
                    {scanError}
                  </Alert>
                </Box>
              )}

            {isScanning && (
              <Box
                sx={{
                  position: "absolute",
                  width: "80%",
                  height: "50%",
                  maxWidth: "450px",
                  maxHeight: "150px",
                  border: "2px solid rgba(255,255,255,0.7)",
                  borderRadius: "8px",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                }}
              />
            )}
          </Paper>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 3,
              py: 1,
            }}
          >
            <Tooltip
              title={isFlashOn ? "Matikan Lampu Kilat" : "Nyalakan Lampu Kilat"}
            >
              <span>
                <IconButton
                  onClick={handleToggleFlash}
                  disabled={!isScanning || !hasFlash}
                  sx={{
                    padding: "12px",
                    border: scannerAreaOutline,
                    borderRadius: "6px",
                    color: primaryDarkColor,
                    "&:hover": { background: "rgba(45, 54, 72, 0.08)" },
                    "&:disabled": {
                      borderColor: theme.palette.grey[300],
                      color: theme.palette.grey[400],
                    },
                  }}
                >
                  {isFlashOn ? <FlashOffIcon /> : <FlashOnIcon />}
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={getCameraTooltip()}>
              <IconButton
                onClick={isScanning ? stopScan : startScan}
                disabled={
                  isLoadingCameras ||
                  needsPermission ||
                  permissionDenied ||
                  barcodeMutation.isPending
                }
                sx={{
                  padding: "20px",
                  background:
                    isProcessingBarcode || barcodeMutation.isPending
                      ? "#ff1744"
                      : primaryDarkColor,
                  borderRadius: "50%",
                  color: "white",
                  transform: "scale(1.2)",
                  "&:hover": {
                    background:
                      isProcessingBarcode || barcodeMutation.isPending
                        ? "#d50000"
                        : "#1E2532",
                    transform: "scale(1.25)",
                  },
                  "&:disabled": {
                    background: theme.palette.grey[400],
                    color: theme.palette.grey[200],
                    transform: "scale(1.2)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {getCameraIcon()}
              </IconButton>
            </Tooltip>

            <Box sx={{ width: "48px" }} />
          </Box>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default ScanBarcodePage;
