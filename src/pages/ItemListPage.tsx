import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
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
} from "@mui/material";

// Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

interface ItemListPage {
  // onBack?: () => void;
}

interface Item {
  id: string; // UUID
  name: string;
  barcode: string;
  description: string;
}

const createMockItem = (
  idSuffix: number,
  name: string,
  barcode: string,
  description: string
): Item => ({
  id: `uuid-item-${idSuffix}-${Date.now()}`,
  name,
  barcode,
  description,
});

const mockItems: Item[] = [
  createMockItem(
    1,
    'Laptop Pro 15"',
    "LP15-2025-001",
    "High-performance laptop for professionals with a 15-inch Retina display, 16GB RAM, and 512GB SSD. Ideal for graphic design and video editing."
  ),
  createMockItem(
    2,
    "Wireless Ergonomic Mouse",
    "WM-ERG0-002",
    "Ergonomically designed wireless mouse with adjustable DPI settings and 6 programmable buttons. Long battery life."
  ),
  createMockItem(
    3,
    "Mechanical Gaming Keyboard",
    "MK-RGB-003",
    "RGB backlit mechanical keyboard with blue switches, N-key rollover, and dedicated media controls. Durable aluminum frame."
  ),
  createMockItem(
    4,
    "USB-C Multiport Hub",
    "UCHUB-7IN1-004",
    "7-in-1 USB-C hub with HDMI, 3x USB 3.0 ports, SD/MicroSD card readers, and USB-C Power Delivery."
  ),
  createMockItem(
    5,
    '27" QHD IPS Monitor',
    "MON27-QHD-IPS-005",
    "27-inch QHD (2560x1440) IPS monitor with 75Hz refresh rate, thin bezels, and wide viewing angles. Excellent color accuracy."
  ),
  createMockItem(
    6,
    "Adjustable Standing Desk",
    "DESK-ADJ-BLK-006",
    "Electric height-adjustable standing desk with a spacious work surface and memory presets. Promotes better posture."
  ),
  createMockItem(
    7,
    "Smart LED Desk Lamp",
    "LAMP-LED-SMRT-007",
    "Smart LED desk lamp with adjustable brightness, color temperature, and app control. Features a built-in USB charging port."
  ),
  createMockItem(
    8,
    "Flagship Smartphone Z",
    "PHONE-Z-256-008",
    "Latest generation flagship smartphone with a stunning OLED display, advanced camera system, and 256GB storage. 5G capable."
  ),
  createMockItem(
    9,
    "10-inch Android Tablet",
    "TAB-A10-128-009",
    "Versatile 10-inch Android tablet with 128GB storage, octa-core processor, and long-lasting battery. Great for media and productivity."
  ),
  createMockItem(
    10,
    "Full HD Webcam Pro",
    "WCAM-FHD-PRO-010",
    "Full HD 1080p webcam with built-in microphone, autofocus, and low-light correction. Perfect for video conferencing and streaming."
  ),
];

const ItemListPage: React.FC<ItemListPage> = (
  {
    /* onBack */
  }
) => {
  const theme = useTheme();
  const primaryColor = "#2D3648";
  const primaryColorHover = "#1E2532"; // Darker shade for hover on primaryColor buttons
  const lightButtonBackground = "#EDF0F7";
  const iconActionColor = "#2D3648";

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
    setPage(0);
  };

  const filteredItems = mockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.barcode.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm)
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedItems = filteredItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
      <AppBar position="static" sx={{ backgroundColor: primaryColor }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            Daftar Barang
          </Typography>
        </Toolbar>
      </AppBar>

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
              flexDirection: "row", // Ensures it's always a row
              alignItems: "center",
              gap: 2, // Spacing between TextField and the buttons Box
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Cari barang"
              value={searchTerm} 
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: "6px" },
              }}
              sx={{
                flexGrow: 1, // Allows TextField to grow and shrink
                minWidth: "150px", // Prevents TextField from becoming too small
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#CBD2E0" },
                  "&:hover fieldset": { borderColor: primaryColor },
                  "&.Mui-focused fieldset": { borderColor: primaryColor },
                },
                "& .MuiInputBase-input": {
                  fontSize: "16px",
                  fontFamily: "Inter, sans-serif",
                  color: "#2D3648",
                },
              }}
            />
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                flexShrink: 0 /* Prevents buttons from shrinking */,
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
                  // onClick={() => { /* Add your reload logic here */ }}
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
                  // onClick={() => { /* Add your add item logic here */ }}
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
                      fontFamily: "Inter, sans-serif",
                      borderRight: `1px solid #CBD2E0`,
                      width: "25%",
                    }}
                  >
                    Nama Barang
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: primaryColor,
                      fontFamily: "Inter, sans-serif",
                      borderRight: `1px solid #CBD2E0`,
                      width: "20%",
                    }}
                  >
                    Barcode
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: primaryColor,
                      fontFamily: "Inter, sans-serif",
                      borderRight: `1px solid #CBD2E0`,
                      width: "35%",
                    }}
                  >
                    Deskripsi
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: primaryColor,
                      fontFamily: "Inter, sans-serif",
                      width: "20%",
                    }}
                  >
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:nth-of-type(even)": {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontFamily: "Inter, sans-serif",
                          borderRight: `1px solid #CBD2E0`,
                          verticalAlign: "top",
                        }}
                      >
                        {item.name}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "Inter, sans-serif",
                          borderRight: `1px solid #CBD2E0`,
                          verticalAlign: "top",
                        }}
                      >
                        {item.barcode}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "Inter, sans-serif",
                          borderRight: `1px solid #CBD2E0`,
                          whiteSpace: "pre-line",
                          verticalAlign: "top",
                        }}
                      >
                        {item.description}
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: "top" }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              sx={{
                                padding: "10px",
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
                                padding: "10px",
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
                      Tidak ada barang yang cocok dengan pencarian Anda.
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

      <Box
        component="footer"
        sx={{
          py: 2,
          textAlign: "center",
          backgroundColor:
            theme.palette.mode === "light"
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} Rifa-SIMS. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default ItemListPage;
