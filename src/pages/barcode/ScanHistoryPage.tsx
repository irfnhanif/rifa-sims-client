import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
  Alert,
  CircularProgress,
  IconButton,
  Pagination,
  Stack,
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
import {
  fetchScanHistory,
  deleteStockAuditLog,
} from "../../api/stock-audit-logs";
import { StockChangeType } from "../../types/stock-change-type";
import type {
  StockAuditLog,
  PaginatedHistoryResponse,
} from "../../types/stock-audit-log";

// Icons
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../../helper/use-auth";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

const ScanHistoryPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { user } = useAuth();

  const primaryDarkColor = "#2D3648";
  const cardOutlineColor = primaryDarkColor;

  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string>("");
  const [selectedLogName, setSelectedLogName] = useState<string>("");
  const rowsPerPage = 5;

  const {
    data: historyData,
    isLoading,
    error,
    isFetching,
  } = useQuery<PaginatedHistoryResponse, Error>({
    queryKey: ["scanHistory", currentPage, rowsPerPage],
    queryFn: () =>
      fetchScanHistory({
        page: currentPage - 1,
        size: rowsPerPage,
        username: user?.username,
      }),
    placeholderData: (previousData) => previousData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStockAuditLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanHistory"] });
      queryClient.invalidateQueries({ queryKey: ["stockAuditLogs"] });
      setDeleteDialogOpen(false);
      setSelectedLogId("");
      setSelectedLogName("");
    },
    onError: (error: Error) => {
      console.error("Error deleting audit log:", error);
      setDeleteDialogOpen(false);
    },
  });

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleDeleteClick = (id: string, itemName: string) => {
    setSelectedLogId(id);
    setSelectedLogName(itemName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedLogId) {
      deleteMutation.mutate(selectedLogId);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedLogId("");
    setSelectedLogName("");
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
      default:
        return type;
    }
  };

  const robotoFontFamily = "Roboto, sans-serif";

  const cardTitleStyle = {
    fontFamily: robotoFontFamily,
    fontWeight: "bold",
    fontSize: "1.1rem",
    color: primaryDarkColor,
    lineHeight: 1.4,
    mb: 0.5,
  };

  const cardOperationStyle = {
    fontFamily: robotoFontFamily,
    fontSize: "0.9rem",
    fontWeight: "600",
    color: primaryDarkColor,
    lineHeight: 1.4,
  };

  const cardTimestampStyle = {
    fontFamily: robotoFontFamily,
    fontSize: "0.85rem",
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
    mt: 0.25,
  };

  const cardTertiaryTextStyle = {
    fontFamily: robotoFontFamily,
    fontSize: "0.8rem",
    color: theme.palette.text.primary, // Changed from disabled to primary for better readability
    lineHeight: 1.4,
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
        title="Riwayat Stok" /* cspell:disable-line */
        showBackButton={true}
        onBackClick={handleBackClick}
      />

      <Container
        component="main"
        maxWidth="md"
        sx={{
          flexGrow: 1,
          py: { xs: 2, md: 3 },
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontFamily: robotoFontFamily,
            fontWeight: "700",
            fontSize: "24px",
            color: "black",
            mb: 3,
          }}
        >
          Terakhir Ditambahkan {/* cspell:disable-line */}
        </Typography>

        {isLoading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexGrow: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            Gagal memuat riwayat: {error.message} {/* cspell:disable-line */}
          </Alert>
        )}

        {!isLoading && !error && historyData && (
          <>
            <Stack spacing={1.5} sx={{ flexGrow: 1, overflowY: "auto", pr: 1 }}>
              {historyData.logs.length === 0 && (
                <Typography
                  sx={{
                    textAlign: "center",
                    fontFamily: robotoFontFamily,
                    color: theme.palette.text.secondary,
                    mt: 4,
                  }}
                >
                  Tidak ada riwayat scan yang ditemukan.
                  {/* cspell:disable-line */}
                </Typography>
              )}
              {historyData.logs.map((log: StockAuditLog) => (
                <Paper
                  key={log.id}
                  elevation={2}
                  sx={{
                    padding: theme.spacing(2.5),
                    background: "white",
                    borderRadius: "8px",
                    border: `2px solid ${cardOutlineColor}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Item Name */}
                    <Typography sx={cardTitleStyle}>{log.itemName}</Typography>

                    {/* Operation Type */}
                    <Typography sx={cardOperationStyle}>
                      {getStockChangeTypeDisplay(log.type)}
                    </Typography>

                    {/* Timestamp */}
                    <Typography sx={cardTimestampStyle}>
                      {formatTimestamp(log.timestamp)}
                    </Typography>

                    {/* Stock Changes */}
                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                      <Typography sx={cardTertiaryTextStyle}>
                        Stok lama: {log.oldStock} {/* cspell:disable-line */}
                      </Typography>
                      <Typography sx={cardTertiaryTextStyle}>
                        Stok baru: {log.newStock} {/* cspell:disable-line */}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Delete Button */}
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(log.id, log.itemName)}
                    disabled={deleteMutation.isPending}
                    sx={{
                      padding: "8px",
                      background: theme.palette.error.main,
                      borderRadius: "6px",
                      color: "white",
                      ml: 1,
                      "&:hover": {
                        background: theme.palette.error.dark,
                      },
                      "&:disabled": {
                        background: theme.palette.action.disabledBackground,
                        color: theme.palette.action.disabled,
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Stack>

            {historyData.totalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  pt: 3,
                  mt: "auto",
                }}
              >
                <Pagination
                  count={historyData.totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  disabled={isFetching}
                  sx={{
                    "& .MuiPaginationItem-root": {
                      fontFamily: robotoFontFamily,
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={selectedLogName}
      />

      <Footer />
    </Box>
  );
};

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  itemName,
}) => {
  const theme = useTheme();
  const primaryDarkColor = "#2D3648";
  const lightButtonBackground = "#EDF0F7";

  const contentText = itemName
    ? `Apakah Anda yakin ingin menghapus riwayat "${itemName}"? Tindakan ini tidak dapat diurungkan.` /* cspell:disable-line */
    : "Apakah Anda yakin ingin menghapus riwayat ini? Tindakan ini tidak dapat diurungkan."; /* cspell:disable-line */

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
            minWidth: "400px",
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
          Konfirmasi Penghapusan Riwayat {/* cspell:disable-line */}
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
          {contentText}
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

export default ScanHistoryPage;
