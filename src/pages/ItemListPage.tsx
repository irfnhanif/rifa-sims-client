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
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

import Header from "../components/Header";
import Footer from "../components/Footer";
import API_CONFIG from "../config/api";


interface ItemListPageProps {
  // onBack?: () => void;
}

interface Item {
  id: string;
  name: string;
  barcode: string;
  description: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Item[];
  errors: null | string[];
}

const fetchItems = async (
  page: number,
  size: number,
  name?: string
): Promise<Item[]> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (name && name.trim()) {
    params.append("name", name.trim().toLowerCase());
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}/items?${params}`, {
    method: "GET",
    headers: API_CONFIG.DEFAULT_HEADERS,
  });
  if (!response.ok) {
    throw new Error("Failed to fetch items");
  }
  const result: ApiResponse = await response.json();
  return result.data;
};

const ItemListPage: React.FC<ItemListPageProps> = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const primaryColor = "#2D3648";
  const primaryColorHover = "#1E2532";
  const lightButtonBackground = "#EDF0F7";
  const iconActionColor = "#2D3648";

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [serverSearchQuery, setServerSearchQuery] = useState(""); 

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["items", page, rowsPerPage, serverSearchQuery],
    queryFn: () => fetchItems(page, rowsPerPage, serverSearchQuery),
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

  const filteredItems = items.filter((item: Item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.barcode.toLowerCase().includes(searchLower) ||
      (item.description && item.description.toLowerCase().includes(searchLower))
    );
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddItemNav = () => {
    navigate("/items/add");
  };

  // Use filtered items for pagination
  const paginatedItems = filteredItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
          Error loading items:{" "}
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
        title="Daftar Barang"
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
              <Tooltip title="Tambah Barang">
                <IconButton
                  sx={{
                    padding: "8px",
                    background: primaryColor,
                    borderRadius: "6px",
                    color: "white",
                    "&:hover": { background: primaryColorHover },
                  }}
                  aria-label="add item"
                  onClick={handleAddItemNav}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          <TableContainer
            component={Paper}
            sx={{ borderRadius: "4px", outline: `2px solid #CBD2E0` }}
          >
            <Table sx={{ minWidth: 650 }} aria-label="item list table">
              <TableHead sx={{ backgroundColor: "rgba(45, 54, 72, 0.10)" }}>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: primaryColor,
                      fontFamily: "Roboto, sans-serif",
                      borderRight: `1px solid #CBD2E0`,
                      width: "30%",
                    }}
                  >
                    Nama Barang
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: primaryColor,
                      fontFamily: "Roboto, sans-serif",
                      borderRight: `1px solid #CBD2E0`,
                      width: "25%",
                    }}
                  >
                    Barcode
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: primaryColor,
                      fontFamily: "Roboto, sans-serif",
                      borderRight: `1px solid #CBD2E0`,
                      width: "30%",
                    }}
                  >
                    Deskripsi
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: primaryColor,
                      fontFamily: "Roboto, sans-serif",
                      width: "15%",
                    }}
                  >
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item: Item) => (
                    <TableRow key={item.id} hover sx={{}}>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontFamily: "Roboto, sans-serif",
                          borderRight: `1px solid #CBD2E0`,
                          verticalAlign: "top",
                        }}
                      >
                        {item.name}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "Roboto, sans-serif",
                          borderRight: `1px solid #CBD2E0`,
                          verticalAlign: "top",
                        }}
                      >
                        {item.barcode}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "Roboto, sans-serif",
                          borderRight: `1px solid #CBD2E0`,
                          whiteSpace: "pre-line",
                          verticalAlign: "top",
                        }}
                      >
                        {item.description || "-"}
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
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
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
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
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
                              <DeleteIcon sx={{ fontSize: "16px" }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      {searchTerm
                        ? `Tidak ada barang yang cocok dengan pencarian "${searchTerm}"`
                        : "Tidak ada data barang"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {filteredItems.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 15]}
              component="div"
              count={filteredItems.length}
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

export default ItemListPage;
