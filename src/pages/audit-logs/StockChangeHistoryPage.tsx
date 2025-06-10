import React, { useState } from "react";
import {
  Box,
  Container,
  TextField,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  useTheme,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Button,
  Typography,
  Collapse,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import type {
  StockAuditLog,
  StockChangeHistoryParam,
} from "../../types/stock-audit-log";
import { StockChangeType } from "../../types/stock-change-type";
import { fetchStockAuditLogs } from "../../api/stock-audit-logs";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

const StockChangeHistoryPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const primaryColor = "#2D3648";
  const primaryColorHover = "#1E2532";
  const lightButtonBackground = "#EDF0F7";

  const [filterExpanded, setFilterExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [itemNameSearch, setItemNameSearch] = useState("");
  const [usernameSearch, setUsernameSearch] = useState("");
  const [selectedChangeTypes, setSelectedChangeTypes] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

  const [appliedFilters, setAppliedFilters] = useState<
    Partial<StockChangeHistoryParam>
  >({
    page: 0,
    size: 10,
    sortBy: "timestamp",
    sortDirection: "DESC",
  });

  const {
    data: auditLogs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stockAuditLogs", appliedFilters],
    queryFn: () => fetchStockAuditLogs(appliedFilters),
  });

  const hasActiveFilters =
    itemNameSearch.trim() !== "" ||
    usernameSearch.trim() !== "" ||
    selectedChangeTypes.length > 0 ||
    fromDate !== null ||
    toDate !== null ||
    sortBy !== "timestamp" ||
    sortDirection !== "DESC";

  // Helper functions to determine search type
  const isPartialItemNameSearch = (): boolean => {
    return (
      itemNameSearch.trim() !== "" &&
      !auditLogs.some(
        (log: StockAuditLog) =>
          log.itemName.toLowerCase() === itemNameSearch.trim().toLowerCase()
      )
    );
  };

  const isPartialUsernameSearch = (): boolean => {
    return (
      usernameSearch.trim() !== "" &&
      !auditLogs.some(
        (log: StockAuditLog) =>
          log.username.toLowerCase() === usernameSearch.trim().toLowerCase()
      )
    );
  };

  // Helper function to check if names are outdated (only for exact matches)
  const isItemNameOutdated = (logItemName: string): boolean => {
    if (!itemNameSearch.trim() || isPartialItemNameSearch()) return false;
    return logItemName.toLowerCase() !== itemNameSearch.trim().toLowerCase();
  };

  const isUsernameOutdated = (logUsername: string): boolean => {
    if (!usernameSearch.trim() || isPartialUsernameSearch()) return false;
    return logUsername.toLowerCase() !== usernameSearch.trim().toLowerCase();
  };

  // Helper function to format names with asterisk if outdated
  const formatItemNameWithMarker = (logItemName: string): string => {
    return isItemNameOutdated(logItemName) ? `${logItemName}*` : logItemName;
  };

  const formatUsernameWithMarker = (logUsername: string): string => {
    return isUsernameOutdated(logUsername) ? `${logUsername}*` : logUsername;
  };

  // Check if any rows have outdated names
  const hasOutdatedNames = auditLogs.some(
    (log: StockAuditLog) =>
      isItemNameOutdated(log.itemName) || isUsernameOutdated(log.username)
  );

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    const newFilters = { ...appliedFilters, page: newPage };
    setAppliedFilters(newFilters);
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    const newFilters = {
      ...appliedFilters,
      size: newRowsPerPage,
      page: 0,
    };
    setAppliedFilters(newFilters);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleChangeTypeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedChangeTypes(
      typeof value === "string" ? value.split(",") : value
    );
  };

  const handleApplyFilters = () => {
    const filters: Partial<StockChangeHistoryParam> = {
      page: 0,
      size: rowsPerPage,
      sortBy,
      sortDirection,
    };

    if (itemNameSearch.trim()) {
      filters.itemName = itemNameSearch.trim();
    }
    if (usernameSearch.trim()) {
      filters.username = usernameSearch.trim();
    }
    if (selectedChangeTypes.length > 0) {
      filters.changeTypes = selectedChangeTypes as StockChangeType[];
    }
    if (fromDate) {
      filters.fromDate = fromDate.toISOString();
    }
    if (toDate) {
      filters.toDate = toDate.toISOString();
    }

    setAppliedFilters(filters);
    setPage(0);

    if (window.innerWidth < 768) {
      setFilterExpanded(false);
    }
  };

  const handleClearFilters = () => {
    setItemNameSearch("");
    setUsernameSearch("");
    setSelectedChangeTypes([]);
    setFromDate(null);
    setToDate(null);
    setSortBy("timestamp");
    setSortDirection("DESC");

    const defaultFilters = {
      page: 0,
      size: rowsPerPage,
      sortBy: "timestamp",
      sortDirection: "DESC" as const,
    };

    setAppliedFilters(defaultFilters);
    setPage(0);
  };

  const toggleFilterExpanded = () => {
    setFilterExpanded(!filterExpanded);
  };

  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const getStockChangeTypeDisplay = (type: string): string => {
    switch (type) {
      case StockChangeType.IN:
        return "Masuk"; /* cspell:disable-line */
      case StockChangeType.OUT:
        return "Keluar"; /* cspell:disable-line */
      case StockChangeType.MANUAL_EDIT:
        return "Edit Manual"; /* cspell:disable-line */
      case StockChangeType.AUTO_EDIT:
        return "Edit Otomatis"; /* cspell:disable-line */
      case StockChangeType.CREATE:
        return "Buat Baru"; /* cspell:disable-line */
      case StockChangeType.DELETE:
        return "Hapus"; /* cspell:disable-line */
      default:
        return type;
    }
  };

  const getStockChangeTypeColor = (
    type: string
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    switch (type) {
      case StockChangeType.IN:
        return "success";
      case StockChangeType.OUT:
        return "error";
      case StockChangeType.MANUAL_EDIT:
        return "info";
      case StockChangeType.AUTO_EDIT:
        return "primary";
      case StockChangeType.CREATE:
        return "success";
      case StockChangeType.DELETE:
        return "error";
      default:
        return "default";
    }
  };

  const getAllStockChangeTypes = () => {
    return Object.values(StockChangeType);
  };

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

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading audit logs: {/* cspell:disable-line */}
          {error instanceof Error ? error.message : "Unknown error"}
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
          title="Riwayat Perubahan Stok" /* cspell:disable-line */
          showBackButton={true}
          onBackClick={handleBackClick}
        />

        <Container
          component="main"
          maxWidth={false}
          disableGutters
          sx={{ flexGrow: 1 }}
        >
          <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
            <Paper
              elevation={1}
              sx={{
                mb: 3,
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: { xs: 2, sm: 3 },
                  pb: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
                onClick={toggleFilterExpanded}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "Roboto, sans-serif",
                    fontWeight: "600",
                    color: primaryColor,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <FilterListIcon />
                  Filter Data {/* cspell:disable-line */}
                  {hasActiveFilters && (
                    <Chip
                      label="Aktif" /* cspell:disable-line */
                      size="small"
                      color="primary"
                      variant="filled"
                      sx={{ ml: 1, fontSize: "0.7rem" }}
                    />
                  )}
                </Typography>

                <IconButton
                  onClick={toggleFilterExpanded}
                  sx={{
                    color: primaryColor,
                    transform: filterExpanded ? "rotate(0deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease-in-out",
                  }}
                >
                  {filterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={filterExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ p: { xs: 2, sm: 3 }, pt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                      alignItems: "stretch",
                    }}
                  >
                    <Box
                      sx={{
                        flex: {
                          xs: "1 1 100%",
                          sm: "1 1 calc(50% - 8px)",
                          md: "1 1 calc(25% - 12px)",
                        },
                        minWidth: { xs: "100%", sm: "200px", md: "180px" },
                      }}
                    >
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        label="Nama Barang" /* cspell:disable-line */
                        value={itemNameSearch}
                        onChange={(e) => setItemNameSearch(e.target.value)}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "#CBD2E0" },
                            "&:hover fieldset": { borderColor: primaryColor },
                            "&.Mui-focused fieldset": {
                              borderColor: primaryColor,
                            },
                          },
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        flex: {
                          xs: "1 1 100%",
                          sm: "1 1 calc(50% - 8px)",
                          md: "1 1 calc(25% - 12px)",
                        },
                        minWidth: { xs: "100%", sm: "200px", md: "180px" },
                      }}
                    >
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        label="Username"
                        value={usernameSearch}
                        onChange={(e) => setUsernameSearch(e.target.value)}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": { borderColor: "#CBD2E0" },
                            "&:hover fieldset": { borderColor: primaryColor },
                            "&.Mui-focused fieldset": {
                              borderColor: primaryColor,
                            },
                          },
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        flex: {
                          xs: "1 1 100%",
                          sm: "1 1 calc(50% - 8px)",
                          md: "1 1 calc(25% - 12px)",
                        },
                        minWidth: { xs: "100%", sm: "200px", md: "180px" },
                      }}
                    >
                      <FormControl fullWidth size="small">
                        <InputLabel>Jenis Perubahan</InputLabel>{" "}
                        {/* cspell:disable-line */}
                        <Select
                          multiple
                          value={selectedChangeTypes}
                          onChange={handleChangeTypeChange}
                          input={
                            <OutlinedInput
                              label="Jenis Perubahan" /* cspell:disable-line */
                            />
                          }
                          renderValue={(selected) => (
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}
                            >
                              {selected.map((value) => (
                                <Chip
                                  key={value}
                                  label={getStockChangeTypeDisplay(value)}
                                  size="small"
                                />
                              ))}
                            </Box>
                          )}
                          sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#CBD2E0",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: primaryColor,
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: primaryColor,
                            },
                          }}
                        >
                          {getAllStockChangeTypes().map((type) => (
                            <MenuItem key={type} value={type}>
                              {getStockChangeTypeDisplay(type)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Box
                      sx={{
                        flex: {
                          xs: "1 1 100%",
                          sm: "1 1 calc(50% - 8px)",
                          md: "1 1 calc(25% - 12px)",
                        },
                        minWidth: { xs: "100%", sm: "200px", md: "180px" },
                      }}
                    >
                      <FormControl fullWidth size="small">
                        <InputLabel>Urut Berdasarkan</InputLabel>{" "}
                        {/* cspell:disable-line */}
                        <Select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          label="Urut Berdasarkan" /* cspell:disable-line */
                          sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#CBD2E0",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: primaryColor,
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: primaryColor,
                            },
                          }}
                        >
                          <MenuItem value="timestamp">Waktu</MenuItem>{" "}
                          {/* cspell:disable-line */}
                          <MenuItem value="itemName">Nama Barang</MenuItem>{" "}
                          {/* cspell:disable-line */}
                          <MenuItem value="username">Username</MenuItem>
                          <MenuItem value="type">Jenis</MenuItem>{" "}
                          {/* cspell:disable-line */}
                        </Select>
                      </FormControl>
                    </Box>

                    <Box
                      sx={{
                        flex: {
                          xs: "1 1 100%",
                          sm: "1 1 calc(50% - 8px)",
                          md: "1 1 calc(25% - 12px)",
                        },
                        minWidth: { xs: "100%", sm: "200px", md: "180px" },
                      }}
                    >
                      <DatePicker
                        label="Dari Tanggal" /* cspell:disable-line */
                        value={fromDate}
                        onChange={(newValue) => setFromDate(newValue)}
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                            sx: {
                              "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: "#CBD2E0" },
                                "&:hover fieldset": {
                                  borderColor: primaryColor,
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: primaryColor,
                                },
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        flex: {
                          xs: "1 1 100%",
                          sm: "1 1 calc(50% - 8px)",
                          md: "1 1 calc(25% - 12px)",
                        },
                        minWidth: { xs: "100%", sm: "200px", md: "180px" },
                      }}
                    >
                      <DatePicker
                        label="Sampai Tanggal" /* cspell:disable-line */
                        value={toDate}
                        onChange={(newValue) => setToDate(newValue)}
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                            sx: {
                              "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: "#CBD2E0" },
                                "&:hover fieldset": {
                                  borderColor: primaryColor,
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: primaryColor,
                                },
                              },
                            },
                          },
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        flex: {
                          xs: "1 1 100%",
                          sm: "1 1 calc(50% - 8px)",
                          md: "1 1 calc(25% - 12px)",
                        },
                        minWidth: { xs: "100%", sm: "200px", md: "180px" },
                      }}
                    >
                      <FormControl fullWidth size="small">
                        <InputLabel>Arah Urutan</InputLabel>{" "}
                        {/* cspell:disable-line */}
                        <Select
                          value={sortDirection}
                          onChange={(e) =>
                            setSortDirection(e.target.value as "ASC" | "DESC")
                          }
                          label="Arah Urutan" /* cspell:disable-line */
                          sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#CBD2E0",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: primaryColor,
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: primaryColor,
                            },
                          }}
                        >
                          <MenuItem value="DESC">Terbaru ke Terlama</MenuItem>{" "}
                          {/* cspell:disable-line */}
                          <MenuItem value="ASC">
                            Terlama ke Terbaru {/* cspell:disable-line */}
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <Box
                      sx={{
                        flex: {
                          xs: "1 1 100%",
                          sm: "1 1 calc(50% - 8px)",
                          md: "1 1 calc(25% - 12px)",
                        },
                        minWidth: { xs: "100%", sm: "200px", md: "180px" },
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1, height: "100%" }}>
                        <Button
                          variant="contained"
                          onClick={handleApplyFilters}
                          startIcon={<SearchIcon />}
                          sx={{
                            backgroundColor: primaryColor,
                            "&:hover": { backgroundColor: primaryColorHover },
                            borderRadius: "6px",
                            fontFamily: "Roboto, sans-serif",
                            textTransform: "none",
                            flex: 1,
                          }}
                        >
                          Cari {/* cspell:disable-line */}
                        </Button>
                        <Tooltip title="Reset Filter">
                          <IconButton
                            onClick={handleClearFilters}
                            sx={{
                              padding: "8px",
                              background: lightButtonBackground,
                              borderRadius: "6px",
                              color: primaryColor,
                              "&:hover": {
                                background: theme.palette.grey[300],
                              },
                            }}
                          >
                            <ClearIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reload Data">
                          <IconButton
                            onClick={() => refetch()}
                            sx={{
                              padding: "8px",
                              background: lightButtonBackground,
                              borderRadius: "6px",
                              color: primaryColor,
                              "&:hover": {
                                background: theme.palette.grey[300],
                              },
                            }}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Collapse>
            </Paper>

            <TableContainer
              component={Paper}
              sx={{ borderRadius: "4px", outline: `2px solid #CBD2E0` }}
            >
              <Table sx={{ minWidth: 800 }} aria-label="stock audit log table">
                <TableHead sx={{ backgroundColor: "rgba(45, 54, 72, 0.10)" }}>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: primaryColor,
                        fontFamily: "Roboto, sans-serif",
                        borderRight: `1px solid #CBD2E0`,
                        width: "20%",
                      }}
                    >
                      Nama Barang {/* cspell:disable-line */}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: primaryColor,
                        fontFamily: "Roboto, sans-serif",
                        borderRight: `1px solid #CBD2E0`,
                        width: "15%",
                      }}
                    >
                      Username
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: primaryColor,
                        fontFamily: "Roboto, sans-serif",
                        borderRight: `1px solid #CBD2E0`,
                        width: "12%",
                      }}
                    >
                      Jenis {/* cspell:disable-line */}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: primaryColor,
                        fontFamily: "Roboto, sans-serif",
                        borderRight: `1px solid #CBD2E0`,
                        width: "10%",
                      }}
                    >
                      Stok Lama {/* cspell:disable-line */}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: primaryColor,
                        fontFamily: "Roboto, sans-serif",
                        borderRight: `1px solid #CBD2E0`,
                        width: "10%",
                      }}
                    >
                      Stok Baru {/* cspell:disable-line */}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: primaryColor,
                        fontFamily: "Roboto, sans-serif",
                        borderRight: `1px solid #CBD2E0`,
                        width: "18%",
                      }}
                    >
                      Waktu {/* cspell:disable-line */}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: primaryColor,
                        fontFamily: "Roboto, sans-serif",
                        width: "15%",
                      }}
                    >
                      Alasan {/* cspell:disable-line */}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log: StockAuditLog) => (
                      <TableRow key={log.id} hover>
                        <TableCell
                          sx={{
                            fontFamily: "Roboto, sans-serif",
                            borderRight: `1px solid #CBD2E0`,
                            verticalAlign: "top",
                          }}
                        >
                          {formatItemNameWithMarker(log.itemName)}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Roboto, sans-serif",
                            borderRight: `1px solid #CBD2E0`,
                            verticalAlign: "top",
                          }}
                        >
                          {formatUsernameWithMarker(log.username)}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Roboto, sans-serif",
                            borderRight: `1px solid #CBD2E0`,
                            verticalAlign: "top",
                          }}
                        >
                          <Chip
                            label={getStockChangeTypeDisplay(log.type)}
                            size="small"
                            color={getStockChangeTypeColor(log.type)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Roboto, sans-serif",
                            borderRight: `1px solid #CBD2E0`,
                            verticalAlign: "top",
                            textAlign: "center",
                          }}
                        >
                          {log.oldStock}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Roboto, sans-serif",
                            borderRight: `1px solid #CBD2E0`,
                            verticalAlign: "top",
                            textAlign: "center",
                          }}
                        >
                          {log.newStock}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Roboto, sans-serif",
                            borderRight: `1px solid #CBD2E0`,
                            verticalAlign: "top",
                          }}
                        >
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Roboto, sans-serif",
                            verticalAlign: "top",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {log.reason || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        Tidak ada data riwayat perubahan stok{" "}
                        {/* cspell:disable-line */}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {hasOutdatedNames && auditLogs.length > 0 && (
              <Box sx={{ mt: 2, px: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontStyle: "italic",
                    fontFamily: "Roboto, sans-serif",
                  }}
                >
                  * digunakan untuk menandakan nama barang atau nama pengguna
                  lama. {/* cspell:disable-line */}
                </Typography>
              </Box>
            )}

            {auditLogs.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 15, 25]}
                component="div"
                count={auditLogs.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Baris per halaman:" /* cspell:disable-line */
                labelDisplayedRows={
                  ({ from, to, count }) =>
                    `${from}-${to} dari ${
                      count !== -1 ? count : `lebih dari ${to}`
                    }` /* cspell:disable-line */
                }
                sx={{
                  mt: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  borderBottomLeftRadius: "4px",
                  borderBottomRightRadius: "4px",
                  backgroundColor: theme.palette.background.paper,
                  ".MuiTablePagination-toolbar": {
                    paddingLeft: { xs: "8px", sm: "16px" },
                  },
                  ".MuiTablePagination-actions": {
                    marginLeft: { xs: "8px", sm: "20px" },
                  },
                }}
              />
            )}
          </Box>
        </Container>

        <Footer />
      </Box>
    </LocalizationProvider>
  );
};

export default StockChangeHistoryPage;
