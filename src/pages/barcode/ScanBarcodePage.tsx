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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  BrowserMultiFormatReader,
  IScannerControls,
  DecodeHintType, // Import DecodeHintType
  BarcodeFormat, // Import BarcodeFormat
} from "@zxing-js/library";

import Header from "../../components/Header"; // Adjust path as needed
import Footer from "../../components/Footer"; // Adjust path as needed

// Icons
import FlashOnIcon from "@mui/icons-material/FlashOn";
import FlashOffIcon from "@mui/icons-material/FlashOff";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";

const ScanBarcodePage: React.FC<> = (/*{ onScanSuccess }*/) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const primaryDarkColor = "#2D3648";
  const scannerAreaBackground = "#EDF0F7";
  const scannerAreaOutline = `2px solid ${primaryDarkColor}`;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined
  );
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isLoadingCameras, setIsLoadingCameras] = useState<boolean>(true);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [scannerControls, setScannerControls] =
    useState<IScannerControls | null>(null);

  const codeReader = useMemo(() => {
    // --- UPDATED: Configure hints for 1D barcodes ---
    const hints = new Map();
    const oneDFormats = [
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.EAN_8,
      BarcodeFormat.EAN_13,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODE_128,
      BarcodeFormat.ITF, // Interleaved 2 of 5
      BarcodeFormat.CODABAR,
      // Add other 1D formats if needed, e.g., BarcodeFormat.RSS_14
    ];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, oneDFormats);
    // Optionally, if you want to be very strict and potentially improve performance for *only* 1D:
    // hints.set(DecodeHintType.ASSUME_CODE_39_CHECK_DIGIT, true); // Example if you primarily use Code 39
    // hints.set(DecodeHintType.TRY_HARDER, true); // Can sometimes help but might slow down

    return new BrowserMultiFormatReader(hints);
    // --- END OF UPDATE ---
  }, []);

  const startScan = useCallback(
    async (deviceId?: string) => {
      if (!videoRef.current) return;
      setIsScanning(true);
      setScanError(null);

      const targetDeviceId =
        deviceId ||
        selectedDeviceId ||
        (videoDevices.length > 0 ? videoDevices[0].deviceId : undefined);
      if (!targetDeviceId) {
        setScanError("Tidak ada kamera yang ditemukan atau dipilih.");
        setIsScanning(false);
        setIsLoadingCameras(false);
        return;
      }

      try {
        // Ensure previous streams are stopped if any controls exist
        if (scannerControls) {
          scannerControls.stop();
          setScannerControls(null);
        }
        codeReader.reset(); // Reset before starting a new scan

        const controls = await codeReader.decodeFromVideoDevice(
          targetDeviceId,
          videoRef.current,
          (result, error, innerControls) => {
            if (!scannerControls && innerControls) {
              // Store controls as soon as available
              setScannerControls(innerControls);
            }
            if (result) {
              console.log("Barcode detected:", result.getText());
              alert(`Barcode Terdeteksi: ${result.getText()}`);
              // onScanSuccess?.(result.getText());
              // Consider stopping the scan to prevent multiple detections or let user decide
              // innerControls.stop(); // Or use the main stopScan()
              setIsScanning(false);
            }
            if (
              error &&
              !(error.name === "NotFoundException") &&
              !(error.name === "FormatException") &&
              !(error.name === "ChecksumException")
            ) {
              // FormatException and ChecksumException can also be frequent for non-matching symbols
              // console.error("Scan error:", error); // Log for debugging but maybe don't show all to user
            }
          }
        );
        // Store controls if the callback didn't (e.g., if it was only called on first frame)
        if (controls && !scannerControls) {
          setScannerControls(controls);
        }
      } catch (err: any) {
        console.error("Failed to start scanner:", err);
        let message = `Gagal memulai kamera: ${err.message}.`;
        if (err.name === "NotAllowedError") {
          message =
            "Izin kamera tidak diberikan. Mohon aktifkan izin kamera di pengaturan browser Anda.";
        }
        setScanError(message);
        setIsScanning(false);
      }
    },
    [
      codeReader,
      selectedDeviceId,
      videoDevices,
      scannerControls /*, onScanSuccess*/,
    ]
  );

  const stopScan = useCallback(() => {
    if (scannerControls) {
      scannerControls.stop();
      setScannerControls(null);
    }
    // codeReader.reset(); // Reset can be called before starting a new scan instead of always on stop
    setIsScanning(false);
  }, [scannerControls]);

  useEffect(() => {
    setIsLoadingCameras(true);
    codeReader
      .listVideoInputDevices()
      .then((devices) => {
        setVideoDevices(devices);
        if (devices.length > 0) {
          const backCamera = devices.find((device) =>
            device.label.toLowerCase().includes("back")
          );
          const initialDeviceId = backCamera
            ? backCamera.deviceId
            : devices[0].deviceId;
          if (!selectedDeviceId) {
            // Only set if not already set (e.g. by user switching)
            setSelectedDeviceId(initialDeviceId);
          }
          startScan(initialDeviceId);
        } else {
          setScanError("Tidak ada kamera yang ditemukan.");
        }
      })
      .catch((err) => {
        console.error("Error listing video devices:", err);
        setScanError("Tidak dapat mengakses kamera. Mohon periksa izin.");
      })
      .finally(() => {
        setIsLoadingCameras(false);
      });

    return () => {
      stopScan(); // Ensure scanner stops when component unmounts
      codeReader.reset(); // Clean up the reader instance
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeReader]); // Dependency array carefully managed for camera initialization

  const handleToggleFlash = () => {
    if (scannerControls && scannerControls.stream) {
      const videoTrack = scannerControls.stream.getVideoTracks()[0];
      if (
        videoTrack &&
        typeof videoTrack.applyConstraints === "function" &&
        videoTrack.getCapabilities?.()?.torch
      ) {
        const currentFlashState = isFlashOn; // Rely on our state as getConstraints might not always return torch
        videoTrack
          .applyConstraints({ advanced: [{ torch: !currentFlashState }] })
          .then(() => setIsFlashOn(!currentFlashState))
          .catch((err) => {
            console.error("Error toggling flash:", err);
            setScanError("Fitur flash tidak didukung atau gagal diaktifkan.");
          });
      } else {
        setScanError("Fitur flash tidak didukung oleh kamera ini.");
      }
    }
  };

  const handleSwitchCamera = () => {
    if (videoDevices.length > 1) {
      stopScan();
      const currentIndex = videoDevices.findIndex(
        (device) => device.deviceId === selectedDeviceId
      );
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDeviceId = videoDevices[nextIndex].deviceId;
      setSelectedDeviceId(nextDeviceId);
      // startScan will be triggered by selectedDeviceId change if we make it a dependency
      // or call it manually after a short delay for stream release
      setTimeout(() => startScan(nextDeviceId), 200);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
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
            <Tooltip title={isFlashOn ? "Matikan Flash" : "Nyalakan Flash"}>
              <span>
                {" "}
                {/* Span wrapper for Tooltip when button is disabled */}
                <IconButton
                  onClick={handleToggleFlash}
                  disabled={
                    !isScanning ||
                    !scannerControls ||
                    !scannerControls.stream
                      ?.getVideoTracks()[0]
                      ?.getCapabilities?.()?.torch
                  }
                  sx={{
                    padding: "12px",
                    background: primaryDarkColor,
                    borderRadius: "6px",
                    color: "white",
                    "&:hover": { background: "#1E2532" },
                  }}
                >
                  {isFlashOn ? <FlashOffIcon /> : <FlashOnIcon />}
                </IconButton>
              </span>
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
              minHeight: "300px",
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: isScanning || isLoadingCameras ? "block" : "none",
              }}
            />
            {isLoadingCameras && (
              <CircularProgress sx={{ position: "absolute" }} />
            )}
            {!isLoadingCameras && scanError && !isScanning && (
              <Alert
                severity="error"
                sx={{ position: "absolute", m: 2, textAlign: "center" }}
              >
                {scanError}
              </Alert>
            )}
            <Box
              sx={{
                position: "absolute",
                width: "80%",
                height: "50%", // Adjusted for 1D barcode proportions
                maxWidth: "450px",
                maxHeight: "150px", // Max sizes
                border: "2px solid rgba(255,255,255,0.7)",
                borderRadius: "8px",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
              }}
            >
              <Box
                sx={{
                  // Central red line
                  position: "absolute",
                  top: "50%",
                  left: "2%",
                  width: "96%",
                  height: "2px",
                  backgroundColor: "rgba(255, 0, 0, 0.6)",
                  transform: "translateY(-50%)",
                  boxShadow: "0 0 3px rgba(255,0,0,0.8)",
                }}
              />
            </Box>
          </Paper>

          {scanError &&
            isScanning && ( // Temporary scan errors (like not found) could be shown subtly or logged
              <Typography
                variant="caption"
                color="error"
                sx={{ textAlign: "center", mt: 1 }}
              >
                {/* {scanError} - Potentially too noisy for "NotFoundException" */}
              </Typography>
            )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              py: 1,
              gap: { xs: 1, sm: "10px" },
            }}
          >
            <Tooltip title="Pilih dari Galeri (belum aktif)">
              <span>
                {" "}
                {/* Wrapper for disabled button tooltip */}
                <IconButton
                  disabled // Placeholder, not implemented
                  sx={{
                    padding: "12px",
                    border: scannerAreaOutline,
                    borderRadius: "6px",
                    color: primaryDarkColor,
                    "&:hover": { background: "rgba(45, 54, 72, 0.08)" },
                  }}
                >
                  <PhotoLibraryIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={isScanning ? "Hentikan Scan" : "Mulai Scan"}>
              <IconButton
                onClick={
                  isScanning ? stopScan : () => startScan(selectedDeviceId)
                }
                disabled={
                  isLoadingCameras || (!isScanning && !selectedDeviceId)
                } // Disable if no camera or still loading
                sx={{
                  padding: "16px",
                  background: primaryDarkColor,
                  borderRadius: "50%",
                  color: "white",
                  transform: "scale(1.15)",
                  "&:hover": { background: "#1E2532" },
                }}
              >
                <CameraAltIcon sx={{ fontSize: "28px" }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Ganti Kamera">
              <span>
                {" "}
                {/* Wrapper for disabled button tooltip */}
                <IconButton
                  onClick={handleSwitchCamera}
                  disabled={
                    videoDevices.length <= 1 || isLoadingCameras || isScanning
                  }
                  sx={{
                    padding: "12px",
                    border: scannerAreaOutline,
                    borderRadius: "6px",
                    color: primaryDarkColor,
                    "&:hover": { background: "rgba(45, 54, 72, 0.08)" },
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
