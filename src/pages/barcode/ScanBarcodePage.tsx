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
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
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

  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isLoadingCameras, setIsLoadingCameras] = useState<boolean>(true);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [isProcessingBarcode, setIsProcessingBarcode] =
    useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [currentCamera, setCurrentCamera] = useState<"environment" | "user">(
    "environment"
  );
  const [hasFlash, setHasFlash] = useState<boolean>(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);

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

  const checkDeviceCapabilities = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setHasMultipleCameras(videoInputDevices.length > 1);

      // Check for flash support
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      const track = stream.getVideoTracks()[0];
      const capabilities =
        track.getCapabilities() as ExtendedMediaTrackCapabilities;
      setHasFlash(!!capabilities.torch);

      // Stop the test stream
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.error("Error checking device capabilities:", err);
      setHasMultipleCameras(false);
      setHasFlash(false);
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentCamera },
      });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionDenied(false);
      setNeedsPermission(false);
      return true;
    } catch (error) {
      console.error("Camera permission denied:", error);
      setPermissionDenied(true);
      setNeedsPermission(false);
      setScanError(
        "Camera permission is required to scan bar codes. Please enable camera access in your browser settings."
      ); // cSpell:ignore barcodes
      return false;
    }
  }, [currentCamera]);

  const handleBarcodeDetected = useCallback(
    async (barcode: string) => {
      if (isProcessingBarcode || !scanningRef.current) return;

      // Stop scanning immediately when barcode is found
      scanningRef.current = false;
      setIsProcessingBarcode(true);

      // Stop the camera stream directly here
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.pause();
      }

      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }

      setIsScanning(false);
      setIsFlashOn(false);

      try {
        console.log("Processing barcode:", barcode);
        const response: BarcodeScanResponse[] = await fetchItemStockByBarcode(
          barcode
        );

        if (response.length === 0) {
          setScanError("Barcode not found in system");
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
        setScanError("Failed to process barcode. Please try again.");
        setIsProcessingBarcode(false);
      }
    },
    [navigate, isProcessingBarcode]
  );

  const startBarcodeScanning = useCallback(async () => {
    if (!codeReaderRef.current || !videoRef.current) {
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

      if (result && scanningRef.current) {
        const barcode = result.getText();
        console.log("Barcode detected:", barcode);
        await handleBarcodeDetected(barcode);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        // No barcode found, continue scanning
        if (scanningRef.current) {
          // Retry after a short delay
          setTimeout(() => {
            if (scanningRef.current) {
              startBarcodeScanning();
            }
          }, 500);
        }
      } else {
        console.error("Unexpected error during barcode scanning:", error);
        if (scanningRef.current) {
          // Retry on unexpected errors
          setTimeout(() => {
            if (scanningRef.current) {
              startBarcodeScanning();
            }
          }, 500);
        }
      }
    }
  }, [handleBarcodeDetected]);

  const startScan = useCallback(async () => {
    if (!videoRef.current) return;

    setIsScanning(true);
    setScanError(null);
    setIsFlashOn(false);
    setIsProcessingBarcode(false);

    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      console.log("Camera access granted");

      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      await new Promise<void>((resolve, reject) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            resolve();
          };
          videoRef.current.onerror = reject;
        }
      });

      if (videoRef.current) {
        try {
          // Check if video is already playing before calling play()
          if (videoRef.current.paused || videoRef.current.readyState < 2) {
            await videoRef.current.play();
            console.log("Video playback started");
          } else {
            console.log("Video already playing");
          }
        } catch (playError) {
          console.error("Error starting video playback:", playError);
          throw new Error("Failed to start video playback");
        }
      }

      // Initialize barcode reader
      codeReaderRef.current = new BrowserMultiFormatReader(hints);

      // Start scanning after a short delay to ensure video is ready
      setTimeout(() => {
        startBarcodeScanning();
      }, 500);

      // Check flash capability
      const track = stream.getVideoTracks()[0];
      const capabilities =
        track.getCapabilities() as ExtendedMediaTrackCapabilities;
      setHasFlash(!!capabilities.torch);
    } catch (err: unknown) {
      console.error("Failed to start scanner:", err);
      let message = `Failed to start camera: ${
        err instanceof Error ? err.message : "Unknown error"
      }.`;
      if (err instanceof Error && err.name === "NotAllowedError") {
        message =
          "Camera permission denied. Please enable camera access in your browser settings.";
        setPermissionDenied(true);
      } else if (err instanceof Error && err.name === "NotReadableError") {
        message = "Camera is busy or not available. Please try again.";
      }
      setScanError(message);
      setIsScanning(false);
    }
  }, [currentCamera, hints, startBarcodeScanning]);

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
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }

    setIsScanning(false);
    setIsFlashOn(false);
  }, []);

  const initializeCamera = useCallback(async () => {
    setIsLoadingCameras(true);

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      setIsLoadingCameras(false);
      return;
    }

    await checkDeviceCapabilities();
    setIsLoadingCameras(false);
  }, [requestCameraPermission, checkDeviceCapabilities]);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanError("Your browser does not support camera access");
      setIsLoadingCameras(false);
      return;
    }

    // Check if permission was already granted
    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((result) => {
        if (result.state === "granted") {
          setNeedsPermission(false);
          initializeCamera();
        } else {
          setNeedsPermission(true);
          setIsLoadingCameras(false);
        }
      })
      .catch(() => {
        // Fallback for browsers that don't support permissions API
        setNeedsPermission(true);
        setIsLoadingCameras(false);
      });

    return () => {
      console.log("Component unmounting, cleaning up...");
      stopScan();
    };
  }, [initializeCamera, stopScan]);

  const handleRequestPermission = async () => {
    setNeedsPermission(false);
    await initializeCamera();
  };

  const handleToggleFlash = async () => {
    if (!streamRef.current) {
      setScanError("Camera not available to activate flash");
      return;
    }

    const track = streamRef.current.getVideoTracks()[0];
    if (!track) {
      setScanError("Video track not found");
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
      setScanError("Failed to activate flash. Feature may not be supported.");
    }
  };

  const handleSwitchCamera = async () => {
    if (!hasMultipleCameras) {
      setScanError("Only one camera available");
      return;
    }

    try {
      console.log("Switching camera...");

      // Stop current scan completely
      stopScan();

      // Wait for cleanup to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Switch camera
      setCurrentCamera((prev) =>
        prev === "environment" ? "user" : "environment"
      );

      // Wait a bit more for camera to be released
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Start with new camera
      await startScan();
    } catch (err: unknown) {
      console.error("Error switching camera:", err);
      setScanError("Failed to switch camera. Please try manually.");
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
        title="Scan Barcode"
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
            <Tooltip title="Scan History">
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
              maxHeight: "60vh", // Constrain maximum height
              aspectRatio: "4/3", // Set a consistent aspect ratio
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
                    Processing barcode...
                  </Typography>
                )}
                {isLoadingCameras && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Loading camera...
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
                  Camera Access Required
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, color: theme.palette.text.secondary }}
                >
                  The application needs permission to access the camera to scan
                  bar codes
                  {/* cSpell:ignore barcodes */}
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
                  Allow Camera Access
                </Button>
              </Box>
            )}

            {!isLoadingCameras && permissionDenied && (
              <Box sx={{ position: "absolute", textAlign: "center", p: 3 }}>
                <CameraAltIcon
                  sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2 }}
                />
                <Typography
                  variant="h6"
                  sx={{ mb: 2, color: theme.palette.error.main }}
                >
                  Camera Permission Denied
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, color: theme.palette.text.secondary }}
                >
                  Please enable camera permission in your browser settings, then
                  try again
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
                  Try Again
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
                        Retry
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
              gap: 4,
              py: 1,
            }}
          >
            <Tooltip title={isFlashOn ? "Turn Off Flash" : "Turn On Flash"}>
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

            <Tooltip title={isScanning ? "Stop Scan" : "Start Scan"}>
              <IconButton
                onClick={isScanning ? stopScan : startScan}
                disabled={
                  isLoadingCameras ||
                  isProcessingBarcode ||
                  needsPermission ||
                  permissionDenied
                }
                sx={{
                  padding: "16px",
                  background: primaryDarkColor,
                  borderRadius: "50%",
                  color: "white",
                  transform: "scale(1.15)",
                  "&:hover": { background: "#1E2532" },
                  "&:disabled": {
                    background: theme.palette.grey[400],
                    color: theme.palette.grey[200],
                  },
                }}
              >
                <CameraAltIcon sx={{ fontSize: "28px" }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Switch Camera">
              <span>
                <IconButton
                  onClick={handleSwitchCamera}
                  disabled={
                    !hasMultipleCameras ||
                    isLoadingCameras ||
                    isProcessingBarcode ||
                    needsPermission ||
                    permissionDenied
                  }
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
                  <FlipCameraIosIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default ScanBarcodePage;
