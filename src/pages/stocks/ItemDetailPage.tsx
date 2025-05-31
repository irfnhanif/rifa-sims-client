import React, { useState, useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import type { ItemDetailResponse } from "../../types/item";
import { fetchItemDetailById } from "../../api/items";

interface StockDataPoint {
  date: string;
  stock: number;
  originalTimestamp: Date;
}

const ItemDetailPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const primaryDarkColor = "#2D3648";

  const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>("7days");

  const formatDateForJava = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const getDateRange = (timeFrame: string) => {
    const toDate = new Date();
    let fromDate: Date;
    switch (timeFrame) {
      case "today":
        fromDate = new Date(
          toDate.getFullYear(),
          toDate.getMonth(),
          toDate.getDate(),
          0,
          0,
          0
        );
        break;
      case "7days":
        fromDate = new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30days":
        fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90days":
        fromDate = new Date(toDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        fromDate = new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    return {
      fromDate: formatDateForJava(fromDate),
      toDate: formatDateForJava(toDate),
    };
  };

  const { fromDate, toDate } = getDateRange(selectedTimeFrame);

  const {
    data: itemDetailResponse,
    isLoading: isLoadingItem,
    error: fetchItemError,
  } = useQuery<ItemDetailResponse, Error>({
    queryKey: ["itemDetail", id, fromDate, toDate],
    queryFn: () => fetchItemDetailById(id!, fromDate, toDate),
    enabled: !!id,
  });

  const item = itemDetailResponse?.item;

  const chartData = useMemo((): StockDataPoint[] => {
    if (!itemDetailResponse?.stockAuditLogs) {
      return [];
    }
    return itemDetailResponse.stockAuditLogs
      .map((log) => {
        const timestamp = new Date(log.timestamp);
        return {
          date: timestamp.toLocaleDateString("id-ID", {
            month: "short",
            day: "numeric",
            hour: selectedTimeFrame === "today" ? "numeric" : undefined,
          }),
          stock: log.newStock,
          originalTimestamp: timestamp,
        };
      })
      .sort(
        (a, b) => a.originalTimestamp.getTime() - b.originalTimestamp.getTime()
      );
  }, [itemDetailResponse?.stockAuditLogs, selectedTimeFrame]);

  const handleTimeFrameChange = (event: SelectChangeEvent<string>) => {
    setSelectedTimeFrame(event.target.value as string);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const sectionLabelStyle = {
    color: primaryDarkColor,
    fontSize: "14px",
    fontFamily: "Roboto, sans-serif",
    fontWeight: "600",
    lineHeight: "16px",
    mb: 1,
  };

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

  if (fetchItemError) {
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Header title="Error" onBackClick={handleBackClick} />
        <Container sx={{ py: 3 }}>
          <Alert severity="error">
            Gagal memuat detail barang:{" "}
            {fetchItemError.message || "Kesalahan tidak diketahui"}
          </Alert>
        </Container>
        <Footer />
      </Box>
    );
  }

  if (!item) {
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Header title="Tidak Ditemukan" onBackClick={handleBackClick} />
        <Container sx={{ py: 3 }}>
          <Alert severity="warning">Detail barang tidak ditemukan.</Alert>
        </Container>
        <Footer />
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
        title="Detail Barang"
        showBackButton={true}
        onBackClick={handleBackClick}
      />

      <Container
        component="main"
        maxWidth={false}
        disableGutters
        sx={{ flexGrow: 1 }}
      >
        <Box
          sx={{
            px: { xs: 1, sm: 2, md: 3 },
            py: { xs: 1, sm: 2, md: 3 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: "black",
              fontSize: { xs: "20px", sm: "24px" },
              fontFamily: "Roboto, sans-serif",
              fontWeight: "700",
              lineHeight: 1.4,
            }}
          >
            {item.name}
          </Typography>

          <Paper elevation={2} sx={{ p: 2.5, borderRadius: "8px" }}>
            <Typography sx={sectionLabelStyle}>Deskripsi</Typography>
            <Typography
              variant="body1"
              sx={{
                fontFamily: "Roboto, sans-serif",
                whiteSpace: "pre-line",
                color: theme.palette.text.secondary,
                lineHeight: 1.65,
              }}
            >
              {item.description || "-"}
            </Typography>
          </Paper>

          <Paper elevation={2} sx={{ p: 2.5, borderRadius: "8px" }}>
            <Typography sx={sectionLabelStyle}>Barcode</Typography>
            <Typography
              variant="body1"
              sx={{
                fontFamily: "Roboto, sans-serif",
                color: theme.palette.text.primary,
                wordBreak: "break-all",
              }}
            >
              {item.barcode || "-"}
            </Typography>
          </Paper>

          <Paper
            elevation={2}
            sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: "8px" }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: { xs: 2, sm: 0 },
                mb: 2,
              }}
            >
              <Typography sx={sectionLabelStyle}>Grafik Stok</Typography>
              <FormControl
                size="small"
                sx={{ minWidth: { xs: "100%", sm: 150 } }}
              >
                <InputLabel
                  id="time-frame-select-label"
                  sx={{ fontFamily: "Roboto, sans-serif" }}
                >
                  Periode
                </InputLabel>
                <Select
                  labelId="time-frame-select-label"
                  id="time-frame-select"
                  value={selectedTimeFrame}
                  label="Periode"
                  onChange={handleTimeFrameChange}
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  <MenuItem
                    value="today"
                    sx={{ fontFamily: "Roboto, sans-serif", fontSize: "14px" }}
                  >
                    Hari Ini
                  </MenuItem>
                  <MenuItem
                    value="7days"
                    sx={{ fontFamily: "Roboto, sans-serif", fontSize: "14px" }}
                  >
                    7 Hari Terakhir
                  </MenuItem>
                  <MenuItem
                    value="30days"
                    sx={{ fontFamily: "Roboto, sans-serif", fontSize: "14px" }}
                  >
                    30 Hari Terakhir
                  </MenuItem>
                  <MenuItem
                    value="90days"
                    sx={{ fontFamily: "Roboto, sans-serif", fontSize: "14px" }}
                  >
                    90 Hari Terakhir
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box
              sx={{
                height: { xs: 250, sm: 300 },
                width: "100%",
              }}
            >
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 25,
                      right: 15,
                      left: 5,
                      bottom: 35,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.palette.divider}
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{
                        fontFamily: "Roboto, sans-serif",
                        fontSize: 12,
                        fill: theme.palette.text.secondary,
                      }}
                      axisLine={{ stroke: theme.palette.divider }}
                      tickLine={{ stroke: theme.palette.divider }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontFamily: "Roboto, sans-serif",
                        fontSize: 12,
                        fill: theme.palette.text.secondary,
                      }}
                      axisLine={{ stroke: theme.palette.divider }}
                      tickLine={{ stroke: theme.palette.divider }}
                    />
                    <Tooltip
                      contentStyle={{
                        fontFamily: "Roboto, sans-serif",
                        borderRadius: "8px",
                        fontSize: "14px",
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[3],
                      }}
                      formatter={(value: number) => [value, "Stok"]}
                      labelStyle={{
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="stock"
                      stroke={primaryDarkColor}
                      strokeWidth={2.5}
                      activeDot={{
                        r: 6,
                        fill: primaryDarkColor,
                        stroke: theme.palette.background.paper,
                        strokeWidth: 2,
                      }}
                      dot={{
                        r: 4,
                        fill: primaryDarkColor,
                        stroke: primaryDarkColor,
                        strokeWidth: 1,
                      }}
                    >
                      <LabelList
                        dataKey="stock"
                        position="top"
                        offset={8}
                        style={{
                          fill: primaryDarkColor,
                          fontSize: 12,
                          fontFamily: "Roboto, sans-serif",
                          fontWeight: "600",
                        }}
                      />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography
                  sx={{
                    textAlign: "center",
                    color: theme.palette.text.secondary,
                    fontFamily: "Roboto, sans-serif",
                    mt: 4,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isLoadingItem ? (
                    <CircularProgress size={30} />
                  ) : (
                    "Data grafik stok tidak tersedia untuk periode ini."
                  )}
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default ItemDetailPage;
