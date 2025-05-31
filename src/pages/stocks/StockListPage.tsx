import React, { useState } from "react";
import {
  Box,
  Container,
  TextField,
  InputAdornment,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  useTheme,
  Tooltip,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import BarChartIcon from "@mui/icons-material/BarChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";

import type { ItemStock } from "../../types/item-stock";
import { fetchItemStocks } from "../../api/stocks";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

type StockFilter = "low" | "normal" | "empty";

interface FilterOption {
  value: StockFilter;
  label: string;
}

const StockListPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const primaryColor = "#2D3648";
  const lightButtonBackground = "#EDF0F7";
  const iconActionColor = "#2D3648";

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [serverSearchQuery, setServerSearchQuery] = useState("");
  const [stockFilters, setStockFilters] = useState<StockFilter[]>([]);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  const filterOptions: FilterOption[] = [
    { value: "empty", label: "Stok Kosong" },
    { value: "low", label: "Stok Menipis" },
    { value: "normal", label: "Stok Normal" },
  ];

  const {
    data: itemStocks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["itemStocks", page, rowsPerPage, serverSearchQuery],
    queryFn: () => fetchItemStocks(page, rowsPerPage, serverSearchQuery),
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleServerSearch = () => {
    setServerSearchQuery(searchTerm);
    setPage(0);
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleServerSearch();
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleDetailClick = (id: string) => {
    navigate(`/stocks/${id}/detail`);
  };

  const handleEditClick = (id: string) => {
    navigate(`/stocks/${id}/edit`);
  };

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleFilterToggle = (filterValue: StockFilter) => {
    setStockFilters((prev) => {
      if (prev.includes(filterValue)) {
        return prev.filter((f) => f !== filterValue);
      } else {
        return [...prev, filterValue];
      }
    });
    setPage(0);
  };

  const getFilteredStocks = (stocks: ItemStock[]) => {
    const searchFiltered = stocks.filter((stock: ItemStock) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        stock.item.name.toLowerCase().includes(searchLower) ||
        stock.item.barcode.toLowerCase().includes(searchLower) ||
        (stock.item.description &&
          stock.item.description.toLowerCase().includes(searchLower))
      );
    });

    if (stockFilters.length === 0) {
      return searchFiltered;
    }

    return searchFiltered.filter((stock) => {
      return stockFilters.some((filter) => {
        switch (filter) {
          case "empty":
            return stock.currentStock === 0;
          case "low":
            return (
              stock.currentStock > 0 && stock.currentStock <= stock.threshold
            );
          case "normal":
            return stock.currentStock > stock.threshold;
          default:
            return false;
        }
      });
    });
  };

  const filteredStocks = getFilteredStocks(itemStocks);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedStocks = filteredStocks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStockStatusColor = (currentStock: number, threshold: number) => {
    if (currentStock === 0) return "#f44336";
    if (currentStock <= threshold) return "#ff9800";
    return "#4caf50";
  };

  const getCurrentFilterLabel = () => {
    if (stockFilters.length === 0) return "Tidak ada filter";
    if (stockFilters.length === 1) {
      const option = filterOptions.find((opt) => opt.value === stockFilters[0]);
      return option ? option.label : "Filter aktif";
    }
    return `${stockFilters.length} filter aktif`;
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
          Error loading stocks:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </Alert>
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
        title="Daftar Stok Barang"
        onBackClick={handleBackClick}
        backgroundColor={primaryColor}
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
              p: 2,
              mb: 3,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Cari barang (klik ikon search atau tekan Enter untuk mencari di server)"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyUp={handleKeyUp}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Cari barang di server">
                        <IconButton
                          onClick={handleServerSearch}
                          edge="end"
                          sx={{
                            color: primaryColor,
                            "&:hover": {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <SearchIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: "6px" },
                },
              }}
              sx={{
                flexGrow: 1,
                minWidth: "150px",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#CBD2E0" },
                  "&:hover fieldset": { borderColor: primaryColor },
                  "&.Mui-focused fieldset": { borderColor: primaryColor },
                },
                "& .MuiInputBase-input": {
                  fontSize: "16px",
                  fontFamily: "Roboto, sans-serif",
                  color: "#2D3648",
                },
              }}
            />
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                flexShrink: 0,
              }}
            >
              <Tooltip title={`Filter: ${getCurrentFilterLabel()}`}>
                <IconButton
                  onClick={handleFilterMenuOpen}
                  sx={{
                    padding: "8px",
                    background:
                      stockFilters.length > 0
                        ? primaryColor
                        : lightButtonBackground,
                    borderRadius: "6px",
                    color: stockFilters.length > 0 ? "white" : primaryColor,
                    "&:hover": {
                      background:
                        stockFilters.length > 0
                          ? "#1E2532"
                          : theme.palette.grey[300],
                    },
                  }}
                  aria-label="filter stocks"
                >
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={handleFilterMenuClose}
                PaperProps={{
                  sx: {
                    borderRadius: "8px",
                    mt: 1,
                    minWidth: 200,
                    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontFamily: "Roboto, sans-serif",
                      fontWeight: "600",
                      color: primaryColor,
                      mb: 1,
                    }}
                  >
                    Filter Stok
                  </Typography>
                </Box>
                {filterOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    onClick={() => handleFilterToggle(option.value)}
                    sx={{
                      px: 1,
                      py: 0.5,
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={stockFilters.includes(option.value)}
                          sx={{
                            color: primaryColor,
                            "&.Mui-checked": {
                              color: primaryColor,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          sx={{
                            fontFamily: "Roboto, sans-serif",
                            fontSize: "14px",
                          }}
                        >
                          {option.label}
                        </Typography>
                      }
                      sx={{ margin: 0, width: "100%" }}
                    />
                  </MenuItem>
                ))}
              </Menu>
              <Tooltip title="Reload Data">
                <IconButton
                  sx={{
                    padding: "8px",
                    background: lightButtonBackground,
                    borderRadius: "6px",
                    color: primaryColor,
                    "&:hover": { background: theme.palette.grey[300] },
                  }}
                  aria-label="reload data"
                  onClick={() => refetch()}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          <TableContainer
            component={Paper}
            sx={{ borderRadius: "4px", outline: `2px solid #CBD2E0` }}
          >
            <Table sx={{ minWidth: 650 }} aria-label="stock list table">
              <TableHead sx={{ backgroundColor: "rgba(45, 54, 72, 0.10)" }}>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: primaryColor,
                      fontFamily: "Roboto, sans-serif",
                      borderRight: `1px solid #CBD2E0`,
                      width: "50%",
                    }}
                  >
                    Nama Barang
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: primaryColor,
                      fontFamily: "Roboto, sans-serif",
                      borderRight: `1px solid #CBD2E0`,
                      width: "20%",
                    }}
                  >
                    Stok Saat Ini
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: primaryColor,
                      fontFamily: "Roboto, sans-serif",
                      borderRight: `1px solid #CBD2E0`,
                      width: "20%",
                    }}
                  >
                    Batas Minimal
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: primaryColor,
                      fontFamily: "Roboto, sans-serif",
                      width: "10%",
                    }}
                  >
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStocks.length > 0 ? (
                  paginatedStocks.map((stock: ItemStock) => (
                    <TableRow key={stock.id} hover>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontFamily: "Roboto, sans-serif",
                          borderRight: `1px solid #CBD2E0`,
                          verticalAlign: "top",
                        }}
                      >
                        {stock.item.name}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontFamily: "Roboto, sans-serif",
                          borderRight: `1px solid #CBD2E0`,
                          verticalAlign: "top",
                          color: getStockStatusColor(
                            stock.currentStock,
                            stock.threshold
                          ),
                          fontWeight: "600",
                        }}
                      >
                        {stock.currentStock}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontFamily: "Roboto, sans-serif",
                          borderRight: `1px solid #CBD2E0`,
                          verticalAlign: "top",
                        }}
                      >
                        {stock.threshold}
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: "top" }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Tooltip title="Detail & Grafik">
                            <IconButton
                              size="small"
                              onClick={() => handleDetailClick(stock.id)}
                              sx={{
                                padding: "8px",
                                background: lightButtonBackground,
                                borderRadius: "6px",
                                color: iconActionColor,
                                "&:hover": {
                                  background: theme.palette.grey[300],
                                },
                              }}
                            >
                              <BarChartIcon sx={{ fontSize: "16px" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Stok">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(stock.id)}
                              sx={{
                                padding: "8px",
                                background: lightButtonBackground,
                                borderRadius: "6px",
                                color: iconActionColor,
                                "&:hover": {
                                  background: theme.palette.grey[300],
                                },
                              }}
                            >
                              <EditIcon sx={{ fontSize: "16px" }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      {searchTerm || stockFilters.length > 0
                        ? `Tidak ada stok yang cocok dengan filter yang dipilih`
                        : "Tidak ada data stok"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {filteredStocks.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 15]}
              component="div"
              count={filteredStocks.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Baris per halaman:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} dari ${
                  count !== -1 ? count : `lebih dari ${to}`
                }`
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
  );
};

export default StockListPage;
