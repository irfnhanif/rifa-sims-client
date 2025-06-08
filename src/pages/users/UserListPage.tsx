import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Tooltip,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import type { User } from "../../types/user";
import { UserType } from "../../types/user-type";
import {
  fetchUsers,
  acceptUser,
  rejectUser,
  deleteUser,
} from "../../api/users";

// Icons
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface ConfirmActionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  contentText: string;
  itemName?: string;
}

interface BranchDetailDialogProps {
  open: boolean;
  onClose: () => void;
  branchNumber: number;
}

const UserListPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const lightActionBackground = "#EDF0F7";

  // Use 0-based indexing to match MUI conventions and server API
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0); // Reset to first page on new search
    }, 500); // 500ms debounce delay
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery<User[], Error>({
    queryKey: ["users", page, rowsPerPage, debouncedSearchTerm],
    queryFn: () =>
      fetchUsers(page, rowsPerPage, debouncedSearchTerm || undefined),
    placeholderData: (previousData) => previousData,
  });

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const acceptMutation = useMutation({
    mutationFn: acceptUser,
    onSuccess: handleMutationSuccess,
  });

  const rejectMutation = useMutation({
    mutationFn: rejectUser,
    onSuccess: handleMutationSuccess,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: handleMutationSuccess,
  });

  const handleBackClick = () => navigate(-1);

  // Use 0-based indexing for MUI pagination
  const handlePageChange = (_event: unknown, newPage: number) =>
    setPage(newPage);

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const openConfirmDialog = (user: User, action: "delete" | "reject") => {
    setSelectedUser(user);
    if (action === "delete") setIsDeleteDialogOpen(true);
    else if (action === "reject") setIsRejectDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setSelectedUser(null);
    setIsDeleteDialogOpen(false);
    setIsRejectDialogOpen(false);
  };

  const openBranchDialog = (branchNumber: number) => {
    setSelectedBranch(branchNumber);
    setIsBranchDialogOpen(true);
  };

  const robotoFontFamily = "Roboto, sans-serif";

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
        title="Manajemen Pengguna" /* cspell:disable-line */
        showBackButton={true}
        onBackClick={handleBackClick}
      />

      <Container
        component="main"
        maxWidth="lg"
        sx={{ flexGrow: 1, py: { xs: 2, md: 3 } }}
      >
        <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: "8px" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              mb: 3,
            }}
          >
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontFamily: robotoFontFamily,
                fontWeight: "700",
                flexGrow: 1,
              }}
            >
              Daftar Pengguna {/* cspell:disable-line */}
            </Typography>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Cari Pengguna..." /* cspell:disable-line */
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { fontFamily: robotoFontFamily, borderRadius: "6px" },
                },
              }}
              sx={{ minWidth: { xs: "100%", sm: "300px" } }}
            />
          </Box>

          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Alert severity="error">
              Gagal memuat pengguna: {error.message} {/* cspell:disable-line */}
            </Alert>
          )}

          {!isLoading && !error && (
            <>
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ backgroundColor: "rgba(45, 54, 72, 0.10)" }}>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontFamily: robotoFontFamily,
                          fontWeight: "bold",
                        }}
                      >
                        Nama Pengguna {/* cspell:disable-line */}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: robotoFontFamily,
                          fontWeight: "bold",
                        }}
                      >
                        Cabang & Jabatan {/* cspell:disable-line */}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: robotoFontFamily,
                          fontWeight: "bold",
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontFamily: robotoFontFamily,
                          fontWeight: "bold",
                        }}
                      >
                        Aksi {/* cspell:disable-line */}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Avatar>
                              {user.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography
                              sx={{
                                fontFamily: robotoFontFamily,
                                fontWeight: 500,
                              }}
                            >
                              {user.username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box>
                              <Typography
                                sx={{
                                  fontFamily: robotoFontFamily,
                                  fontWeight: 500,
                                }}
                              >
                                Cabang {user.branch} {/* cspell:disable-line */}
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: robotoFontFamily,
                                  color: "text.secondary",
                                  fontSize: "0.8rem",
                                }}
                              >
                                {user.role}
                              </Typography>
                            </Box>
                            <Tooltip
                              title="Detail Cabang" /* cspell:disable-line */
                            >
                              <IconButton
                                size="small"
                                onClick={() => openBranchDialog(user.branch)}
                                sx={{ ml: 1 }}
                              >
                                <InfoOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.status}
                            color={
                              user.status === UserType.ACTIVE
                                ? "success"
                                : "warning"
                            }
                            size="small"
                            sx={{
                              textTransform: "capitalize",
                              fontFamily: robotoFontFamily,
                              fontWeight: "bold",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {user.status === UserType.PENDING ? (
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 0.5,
                              }}
                            >
                              <Tooltip
                                title="Setujui" /* cspell:disable-line */
                              >
                                <IconButton
                                  size="small"
                                  sx={{
                                    background: lightActionBackground,
                                    color: theme.palette.success.main,
                                    "&:hover": {
                                      background: theme.palette.success.light,
                                    },
                                  }}
                                  onClick={() => acceptMutation.mutate(user.id)}
                                >
                                  <CheckCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Tolak" /* cspell:disable-line */>
                                <IconButton
                                  size="small"
                                  sx={{
                                    background: lightActionBackground,
                                    color: theme.palette.warning.main,
                                    "&:hover": {
                                      background: theme.palette.warning.light,
                                    },
                                  }}
                                  onClick={() =>
                                    openConfirmDialog(user, "reject")
                                  }
                                >
                                  <HighlightOffIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Tooltip title="Hapus" /* cspell:disable-line */>
                              <IconButton
                                size="small"
                                sx={{ color: theme.palette.error.main }}
                                onClick={() =>
                                  openConfirmDialog(user, "delete")
                                }
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={users.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="Baris per halaman:" /* cspell:disable-line */
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} dari ${
                    count !== -1
                      ? count
                      : `lebih dari ${to}` /* cspell:disable-line */
                  }`
                }
              />
            </>
          )}
        </Paper>
      </Container>

      {/* Confirmation Dialogs */}
      <ConfirmActionDialog
        open={isDeleteDialogOpen}
        onClose={closeConfirmDialog}
        onConfirm={() => {
          if (selectedUser) deleteMutation.mutate(selectedUser.id);
          closeConfirmDialog();
        }}
        itemName={selectedUser?.username}
        title="Hapus Pengguna?" /* cspell:disable-line */
        contentText="Apakah Anda yakin ingin menghapus pengguna" /* cspell:disable-line */
      />
      <ConfirmActionDialog
        open={isRejectDialogOpen}
        onClose={closeConfirmDialog}
        onConfirm={() => {
          if (selectedUser) rejectMutation.mutate(selectedUser.id);
          closeConfirmDialog();
        }}
        itemName={selectedUser?.username}
        title="Tolak Pengguna?" /* cspell:disable-line */
        contentText="Apakah Anda yakin ingin menolak permintaan pendaftaran pengguna" /* cspell:disable-line */
      />

      {/* Branch Detail Dialog */}
      <BranchDetailDialog
        open={isBranchDialogOpen}
        onClose={() => setIsBranchDialogOpen(false)}
        branchNumber={selectedBranch}
      />

      <Footer />
    </Box>
  );
};

const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  contentText,
  itemName,
}) => {
  const theme = useTheme();
  const primaryDarkColor = "#2D3648";
  const lightButtonBackground = "#EDF0F7";
  const robotoFontFamily = "Roboto, sans-serif";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-action-dialog-title"
      aria-describedby="confirm-action-dialog-description"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "8px",
            padding: theme.spacing(1),
            backgroundColor: "#f8f9fa",
            minWidth: "400px",
          },
        },
      }}
    >
      <DialogTitle
        id="confirm-action-dialog-title"
        sx={{
          padding: theme.spacing(3, 4, 2, 4),
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontFamily: robotoFontFamily,
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
          id="confirm-action-dialog-description"
          sx={{
            fontFamily: robotoFontFamily,
            fontSize: "16px",
            color: theme.palette.text.secondary,
          }}
        >
          {contentText} {itemName && <strong>{itemName}</strong>}?
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
            fontFamily: robotoFontFamily,
            fontWeight: "700",
            lineHeight: "24px",
            borderRadius: "6px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: theme.palette.grey[300],
            },
          }}
        >
          Batal {/* cspell:disable-line */}
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
            fontFamily: robotoFontFamily,
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
          Konfirmasi {/* cspell:disable-line */}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const BranchDetailDialog: React.FC<BranchDetailDialogProps> = ({
  open,
  onClose,
  branchNumber,
}) => {
  const theme = useTheme();
  const primaryDarkColor = "#2D3648";
  const lightButtonBackground = "#EDF0F7";

  const robotoFontFamily = "Roboto, sans-serif";

  const getBranchInfo = (branch: number) => {
    switch (branch) {
      case 1:
        return {
          name: "Cabang 1" /* cspell:disable-line */,
          address: "", // Empty as requested
        };
      case 2:
        return {
          name: "Cabang 2" /* cspell:disable-line */,
          address: "", // Empty as requested
        };
      default:
        return {
          name: "Cabang Tidak Diketahui" /* cspell:disable-line */,
          address: "",
        };
    }
  };

  const branchInfo = getBranchInfo(branchNumber);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
        sx={{
          padding: theme.spacing(3, 4, 2, 4),
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontFamily: robotoFontFamily,
            fontWeight: "700",
            color: primaryDarkColor,
            fontSize: "22px",
          }}
        >
          Detail Cabang {/* cspell:disable-line */}
        </Typography>
      </DialogTitle>
      <DialogContent
        sx={{
          padding: theme.spacing(0, 4, 3, 4),
        }}
      >
        <Box sx={{ py: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontFamily: robotoFontFamily,
              fontWeight: "600",
              color: primaryDarkColor,
              fontSize: "18px",
              mb: 2,
            }}
          >
            {branchInfo.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: robotoFontFamily,
              fontSize: "16px",
              color: theme.palette.text.secondary,
            }}
          >
            <strong>Alamat {/* cspell:disable-line */}:</strong>{" "}
            {branchInfo.address || "Belum diisi" /* cspell:disable-line */}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          padding: theme.spacing(2, 4, 3, 4),
          justifyContent: "center",
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            padding: "12px 24px",
            backgroundColor: lightButtonBackground,
            color: primaryDarkColor,
            fontSize: "16px",
            fontFamily: robotoFontFamily,
            fontWeight: "700",
            lineHeight: "24px",
            borderRadius: "6px",
            textTransform: "none",
            minWidth: "120px",
            "&:hover": {
              backgroundColor: theme.palette.grey[300],
            },
          }}
        >
          Tutup {/* cspell:disable-line */}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserListPage;
