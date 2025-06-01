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
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
} from "@zxing/library"; // cSpell:ignore zxing

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { fetchItemStockByBarcode } from "../../api/stocks";
import type { BarcodeScanResponse } from "../../types/item-stock";

// Icons
import FlashOnIcon from "@mui/icons-material/FlashOn";
import FlashOffIcon from "@mui/icons-material/FlashOff";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import CameraAltIcon from "@mui/icons-material/CameraAlt"
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import HistoryIcon from "@mui/icons-material/History";

// Extend MediaTrackCapabilities to include torch
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

  const stopScan = useCallback(() => {
    console.log("Stopping scan...");

    // Stop scanning
    scanningRef.current = false;

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("Track stopped:", track.kind);
      });
      streamRef.current = null;
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
      videoRef.current.load(); // Reset video element completely
    }

    // Reset reader
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
      // Check for flash support
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      const track = stream.getVideoTracks()[0];
      const capabilities =
        track.getCapabilities() as ExtendedMediaTrackCapabilities;

      if (!isUnmountedRef.current) {
        setHasFlash(!!capabilities.torch);
      }

      // Stop the test stream
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
          "Izin kamera diperlukan untuk memindai barcode. Harap aktifkan akses kamera di pengaturan browser Anda." // cSpell:ignore Izin kamera diperlukan untuk memindai Harap aktifkan akses pengaturan browser Anda
        );
      }
      return false;
    }
  }, []);

  const handleBarcodeDetected = useCallback(
    async (barcode: string) => {
      if (isProcessingBarcode || !scanningRef.current || isUnmountedRef.current)
        return;

      // Stop scanning immediately when barcode is found
      scanningRef.current = false;
      setIsProcessingBarcode(true);

      // Stop the camera stream directly here
      stopScan();

      try {
        console.log("Processing barcode:", barcode);
        const response: BarcodeScanResponse[] = await fetchItemStockByBarcode(
          barcode
        );

        if (isUnmountedRef.current) return;

        if (response.length === 0) {
          setScanError("Barcode tidak ditemukan dalam sistem"); // cSpell:ignore tidak ditemukan dalam sistem
          setIsProcessingBarcode(false);
          return;
        }

        if (response.length === 1) {
          navigate(`/input-scan/${response[0].id}`, {
            state: { itemName: response[0].itemName, barcode },
          });
        } else {
          navigate("/choose-item", {
            state: { items: response, barcode },
          });
        }
      } catch (error) {
        console.error("Error processing barcode:", error);
        if (!isUnmountedRef.current) {
          setScanError("Gagal memproses barcode. Silakan coba lagi."); // cSpell:ignore Gagal memproses Silakan coba lagi
          setIsProcessingBarcode(false);
        }
      }
    },
    [navigate, isProcessingBarcode, stopScan]
  );

  const startBarcodeScanning = useCallback(async () => {
    if (!codeReaderRef.current || !videoRef.current || isUnmountedRef.current) {
      console.error("Barcode reader or video not initialized");
      return;
    }

    console.log("Starting barcode scanning");
    scanningRef.current = true;

    try {
      // Use decodeOnceFromVideoDevice for single scan
      const result = await codeReaderRef.current.decodeOnceFromVideoDevice(
        undefined, // Use default video device
        videoRef.current
      );

      if (result && scanningRef.current && !isUnmountedRef.current) {
        const barcode = result.getText();
        console.log("Barcode detected:", barcode);
        await handleBarcodeDetected(barcode);
      }
    } catch (error) {
      if (isUnmountedRef.current) return;

      if (error instanceof NotFoundException) {
        // No barcode found, continue scanning
        if (scanningRef.current) {
          // Retry after a short delay
          setTimeout(() => {
            if (scanningRef.current && !isUnmountedRef.current) {
              startBarcodeScanning();
            }
          }, 500);
        }
      } else {
        console.error("Unexpected error during barcode scanning:", error);
        if (scanningRef.current) {
          // Retry on unexpected errors
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
      console.log("Requesting camera access...");
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

      console.log("Camera access granted");

      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error("Video element not available"));
          return;
        }

        const handleLoadedMetadata = () => {
          console.log("Video metadata loaded");
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
          // Check if video is already playing before calling play()
          if (videoRef.current.paused || videoRef.current.readyState < 3) {
            await videoRef.current.play();
            console.log("Video playback started");
          } else {
            console.log("Video already playing");
          }
        } catch (playError) {
          console.error("Error starting video playbook:", playError);
          throw new Error("Failed to start video playback");
        }
      }

      if (isUnmountedRef.current) return;

      // Initialize barcode reader
      codeReaderRef.current = new BrowserMultiFormatReader(hints);

      // Start scanning after a short delay to ensure video is ready
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          startBarcodeScanning();
        }
      }, 500);

      // Check flash capability
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
        // cSpell:ignore Gagal memulai kamera
        err instanceof Error ? err.message : "Kesalahan tidak diketahui" // cSpell:ignore Kesalahan tidak diketahui
      }.`;

      if (err instanceof Error && err.name === "NotAllowedError") {
        message =
          "Izin kamera ditolak. Harap aktifkan akses kamera di pengaturan browser Anda."; // cSpell:ignore Izin kamera ditolak Harap aktifkan akses pengaturan browser Anda
        setPermissionDenied(true);
      } else if (err instanceof Error && err.name === "NotReadableError") {
        message =
          "Kamera sedang digunakan atau tidak tersedia. Silakan coba lagi."; // cSpell:ignore Kamera sedang digunakan atau tidak tersedia Silakan coba lagi
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
      setScanError("Browser Anda tidak mendukung akses kamera"); // cSpell:ignore Browser Anda tidak mendukung akses kamera
      setIsLoadingCameras(false);
      return;
    }

    // Check if permission was already granted
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

        // Fallback for browsers that don't support permissions API
        setNeedsPermission(true);
        setIsLoadingCameras(false);
      });

    return () => {
      console.log("Component unmounting, cleaning up...");
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
      setScanError("Kamera tidak tersedia untuk mengaktifkan lampu kilat"); // cSpell:ignore Kamera tidak tersedia untuk mengaktifkan lampu kilat
      return;
    }

    const track = streamRef.current.getVideoTracks()[0];
    if (!track) {
      setScanError("Track video tidak ditemukan"); // cSpell:ignore Track video tidak ditemukan
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
        "Gagal mengaktifkan lampu kilat. Fitur mungkin tidak didukung." // cSpell:ignore Gagal mengaktifkan lampu kilat Fitur mungkin tidak didukung
      );
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleScanHistory = () => {
    navigate("/scan-history");
  };

  const handleRetry = () => {
    setScanError(null);
    setIsProcessingBarcode(false);
    startScan();
  };

  // Function to get the appropriate camera icon
  const getCameraIcon = () => {
    if (isProcessingBarcode) {
      return (
        <FiberManualRecordIcon sx={{ fontSize: "28px", color: "#ff1744" }} />
      );
    }
    if (isScanning) {
      return <StopIcon sx={{ fontSize: "28px" }} />;
    }
    return <PlayArrowIcon sx={{ fontSize: "28px" }} />;
  };

  // Function to get the appropriate tooltip text
  const getCameraTooltip = () => {
    if (isProcessingBarcode) {
      return "Memproses Barcode"; // cSpell:ignore Memproses
    }
    if (isScanning) {
      return "Hentikan Pemindaian"; // cSpell:ignore Hentikan Pemindaian
    }
    return "Mulai Pemindaian"; // cSpell:ignore Mulai Pemindaian
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
        title="Pindai Barcode" // cSpell:ignore Pindai
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

            {(isLoadingCameras || isProcessingBarcode) && (
              <Box sx={{ position: "absolute", textAlign: "center" }}>
                <CircularProgress />
                {isProcessingBarcode && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Memproses barcode... {/* cSpell:ignore Memproses */}
                  </Typography>
                )}
                {isLoadingCameras && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Memuat kamera... {/* cSpell:ignore Memuat kamera */}
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
                  Akses Kamera Diperlukan{" "}
                  {/* cSpell:ignore Akses Kamera Diperlukan */}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, color: theme.palette.text.secondary }}
                >
                  Aplikasi memerlukan izin untuk mengakses kamera untuk memindai{" "}
                  {/* cSpell:ignore Aplikasi memerlukan izin untuk mengakses kamera untuk memindai */}
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
                  Izinkan Akses Kamera{" "}
                  {/* cSpell:ignore Izinkan Akses Kamera */}
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
                  Izin Kamera Ditolak {/* cSpell:ignore Izin Kamera Ditolak */}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, color: theme.palette.text.secondary }}
                >
                  Harap aktifkan izin kamera di pengaturan browser Anda,{" "}
                  {/* cSpell:ignore Harap aktifkan izin kamera pengaturan browser Anda */}
                  kemudian coba lagi {/* cSpell:ignore kemudian coba lagi */}
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
                  Coba Lagi {/* cSpell:ignore Coba Lagi */}
                </Button>
              </Box>
            )}

            {!isLoadingCameras &&
              !isScanning &&
              !needsPermission &&
              !permissionDenied &&
              !isProcessingBarcode && (
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
                        Coba Lagi {/* cSpell:ignore Coba Lagi */}
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
              title={isFlashOn ? "Matikan Lampu Kilat" : "Nyalakan Lampu Kilat"} // cSpell:ignore Matikan Lampu Kilat Nyalakan
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
                  isLoadingCameras || needsPermission || permissionDenied
                }
                sx={{
                  padding: "20px",
                  background: isProcessingBarcode
                    ? "#ff1744"
                    : primaryDarkColor,
                  borderRadius: "50%",
                  color: "white",
                  transform: "scale(1.2)",
                  "&:hover": {
                    background: isProcessingBarcode ? "#d50000" : "#1E2532",
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

            {/* Empty space to balance the layout */}
            <Box sx={{ width: "48px" }} />
          </Box>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default ScanBarcodePage;
