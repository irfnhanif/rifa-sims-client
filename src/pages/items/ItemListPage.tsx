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
  Snackbar,
  Dialog,
  DialogTitle,
  Typography,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

import type { Item } from "../../types/item";
import { fetchItems, deleteItem } from "../../api/items";
import { useAuth } from "../../helper/use-auth";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { UserRole } from "../../types/user-role";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  title?: string;
  contentText?: string;
}

const ItemListPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const primaryColor = "#2D3648";
  const primaryColorHover = "#1E2532";
  const lightButtonBackground = "#EDF0F7";
  const iconActionColor = "#2D3648";

  const isOwner = user?.roles?.includes(UserRole.OWNER) ?? false;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [serverSearchQuery, setServerSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["items", page, rowsPerPage, serverSearchQuery],
    queryFn: () => fetchItems(page, rowsPerPage, serverSearchQuery),
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: (message) => {
      setSnackbar({
        open: true,
        message: message || "Item berhasil dihapus" /* cspell:disable-line */,
        severity: "success",
      });
      refetch();
      setDeleteDialogOpen(false);
      setItemToDelete(null);

      queryClient.invalidateQueries({ queryKey: ["stockAuditLogs"] });
    },
    onError: (error: Error) => {
      setSnackbar({
        open: true,
        message:
          error.message || "Gagal menghapus item" /* cspell:disable-line */,
        severity: "error",
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
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

  const handleEditClick = (id: string) => {
    navigate(`/items/${id}/edit`);
  };

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
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
        title="Daftar Barang" /* cspell:disable-line */
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
              placeholder="Cari barang (klik ikon search atau tekan Enter untuk mencari di server)" /* cspell:disable-line */
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyUp={handleKeyUp}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        title="Cari barang di server" /* cspell:disable-line */
                      >
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
              {/* Only show Add button for OWNER */}
              {isOwner && (
                <Tooltip title="Tambah Barang" /* cspell:disable-line */>
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
              )}
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
                      width: isOwner ? "30%" : "40%",
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
                      width: isOwner ? "25%" : "30%",
                    }}
                  >
                    Barcode
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      color: primaryColor,
                      fontFamily: "Roboto, sans-serif",
                      borderRight: isOwner ? `1px solid #CBD2E0` : "none",
                      width: isOwner ? "30%" : "30%",
                    }}
                  >
                    Deskripsi {/* cspell:disable-line */}
                  </TableCell>
                  {isOwner && (
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        color: primaryColor,
                        fontFamily: "Roboto, sans-serif",
                        width: "15%",
                      }}
                    >
                      Aksi {/* cspell:disable-line */}
                    </TableCell>
                  )}
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
                          borderRight: isOwner ? `1px solid #CBD2E0` : "none",
                          whiteSpace: "pre-line",
                          verticalAlign: "top",
                        }}
                      >
                        {item.description || "-"}
                      </TableCell>
                      {isOwner && (
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
                                onClick={() => handleEditClick(item.id)}
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
                                onClick={() => handleDeleteClick(item)}
                                disabled={deleteItemMutation.isPending}
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
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={isOwner ? 4 : 3}
                      align="center"
                      sx={{ py: 3 }}
                    >
                      {
                        searchTerm
                          ? `Tidak ada barang yang cocok dengan pencarian "${searchTerm}"` /* cspell:disable-line */
                          : "Tidak ada data barang" /* cspell:disable-line */
                      }
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
              labelRowsPerPage="Baris per halaman:" /* cspell:disable-line */
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} dari ${
                  /* cspell:disable-line */
                  count !== -1
                    ? count
                    : `lebih dari ${to}` /* cspell:disable-line */
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

      {/* Delete Confirmation Dialog - Only for OWNER */}
      {isOwner && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          itemName={itemToDelete?.name}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  itemName,
  title = "Konfirmasi Penghapusan Barang" /* cspell:disable-line */,
  contentText,
}) => {
  const theme = useTheme();
  const primaryDarkColor = "#2D3648";
  const lightButtonBackground = "#EDF0F7";

  const defaultContentText = itemName
    ? `Apakah Anda yakin ingin menghapus barang "${itemName}"? Tindakan ini tidak dapat diurungkan.` /* cspell:disable-line */
    : "Apakah Anda yakin ingin menghapus barang ini? Tindakan ini tidak dapat diurungkan."; /* cspell:disable-line */

  const finalContentText = contentText || defaultContentText;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-delete-dialog-title"
      aria-describedby="confirm-delete-dialog-description"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "8px",
            padding: theme.spacing(1),
            backgroundColor: "#f8f9fa",
          },
        },
      }}
    >
      <DialogTitle
        id="confirm-delete-dialog-title"
        sx={{
          padding: theme.spacing(3, 4, 2, 4),
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontFamily: "Inter, sans-serif",
            fontWeight: "700",
            color: primaryDarkColor,
            fontSize: "22px",
          }}
        >
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent
        sx={{
          padding: theme.spacing(0, 4, 3, 4),
        }}
      >
        <DialogContentText
          id="confirm-delete-dialog-description"
          sx={{
            fontFamily: "Inter, sans-serif",
            fontSize: "16px",
            color: theme.palette.text.secondary,
          }}
        >
          {finalContentText}
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          padding: theme.spacing(2, 4, 3, 4),
          gap: theme.spacing(2),
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            flexGrow: 1,
            padding: "12px 20px",
            backgroundColor: lightButtonBackground,
            color: primaryDarkColor,
            fontSize: "16px",
            fontFamily: "Inter, sans-serif",
            fontWeight: "700",
            lineHeight: "24px",
            borderRadius: "6px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: theme.palette.grey[300],
            },
          }}
        >
          Kembali {/* cspell:disable-line */}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            flexGrow: 1,
            padding: "12px 20px",
            backgroundColor: primaryDarkColor,
            color: "white",
            fontSize: "16px",
            fontFamily: "Inter, sans-serif",
            fontWeight: "700",
            lineHeight: "24px",
            borderRadius: "6px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#1E2532",
            },
          }}
          autoFocus
        >
          Hapus {/* cspell:disable-line */}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemListPage;
