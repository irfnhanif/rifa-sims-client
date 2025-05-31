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
  lineElementClasses,
  markElementClasses,
} from "@mui/x-charts/LineChart";
import { ChartsGrid } from "@mui/x-charts/ChartsGrid";
import { ChartsTooltip } from "@mui/x-charts/ChartsTooltip";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import type { ItemDetailResponse } from "../../types/item";
import { fetchItemDetailById } from "../../api/items";

interface StockDataPoint {
  [key: string]: Date | number;
  x: Date;
  stock: number;
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
      .map((log) => ({
        x: new Date(log.timestamp),
        stock: log.newStock,
      }))
      .sort((a, b) => a.x.getTime() - b.x.getTime());
  }, [itemDetailResponse?.stockAuditLogs]);

  const handleTimeFrameChange = (event: SelectChangeEvent<string>) => {
    setSelectedTimeFrame(event.target.value as string);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const sectionLabelStyle = {
    color: primaryDarkColor,
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
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
            Error loading item details:{" "}
            {fetchItemError.message || "Unknown error"}
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
        <Header title="Not Found" onBackClick={handleBackClick} />
        <Container sx={{ py: 3 }}>
          <Alert severity="warning">Item details not found.</Alert>
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
        title="Item Details"
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
            px: { xs: 2, sm: 3, md: "36px" },
            py: { xs: 2, sm: 3, md: "24px" },
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: "black",
              fontSize: "24px",
              fontFamily: "Inter, sans-serif",
              fontWeight: "700",
              lineHeight: "33.60px",
            }}
          >
            {item.name}
          </Typography>

          <Paper elevation={2} sx={{ p: 2.5, borderRadius: "8px" }}>
            <Typography sx={sectionLabelStyle}>Description</Typography>
            <Typography
              variant="body1"
              sx={{
                fontFamily: "Inter, sans-serif",
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
                fontFamily: "Inter, sans-serif",
                color: theme.palette.text.primary,
                wordBreak: "break-all",
              }}
            >
              {item.barcode || "-"}
            </Typography>
          </Paper>

          <Paper elevation={2} sx={{ p: 2.5, borderRadius: "8px" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography sx={sectionLabelStyle}>Stock Trend</Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel
                  id="time-frame-select-label"
                  sx={{ fontFamily: "Inter, sans-serif" }}
                >
                  Period
                </InputLabel>
                <Select
                  labelId="time-frame-select-label"
                  id="time-frame-select"
                  value={selectedTimeFrame}
                  label="Period"
                  onChange={handleTimeFrameChange}
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                >
                  <MenuItem
                    value="today"
                    sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
                  >
                    Today
                  </MenuItem>
                  <MenuItem
                    value="7days"
                    sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
                  >
                    Last 7 Days
                  </MenuItem>
                  <MenuItem
                    value="30days"
                    sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
                  >
                    Last 30 Days
                  </MenuItem>
                  <MenuItem
                    value="90days"
                    sx={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
                  >
                    Last 90 Days
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ height: 300, width: "100%" }}>
              {chartData.length > 0 ? (
                <LineChart
                  dataset={chartData}
                  series={[
                    {
                      dataKey: "stock",
                      label: "Stock",
                      color: primaryDarkColor,
                      showMark: true,
                    },
                  ]}
                  xAxis={[
                    {
                      dataKey: "x",
                      scaleType: "time",
                      valueFormatter: (date: Date) =>
                        date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        }),
                    },
                  ]}
                  yAxis={[
                    {
                      scaleType: "linear",
                    },
                  ]}
                  width={undefined}
                  height={300}
                  margin={{ top: 25, right: 20, left: 40, bottom: 40 }}
                  sx={{
                    [`.${lineElementClasses.root}`]: {
                      strokeWidth: 2.5,
                    },
                    [`.${markElementClasses.root}`]: {
                      stroke: primaryDarkColor,
                      fill: primaryDarkColor,
                      strokeWidth: 2,
                      r: 4,
                      "&:hover": {
                        r: 6,
                      },
                    },
                    ".MuiChartsAxis-tickContainer .MuiChartsAxis-tickLabel": {
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                    },
                    ".MuiChartsTooltip-root": {
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                    },
                  }}
                >
                  <ChartsGrid horizontal />
                  <ChartsTooltip trigger="item" />
                </LineChart>
              ) : (
                <Typography
                  sx={{
                    textAlign: "center",
                    color: theme.palette.text.secondary,
                    fontFamily: "Inter, sans-serif",
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
                    "Stock trend data not available for this period."
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
