import {
  useTheme,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Typography,
} from "@mui/material";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  title?: string;
  contentText?: string;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  itemName,
  title = "Konfirmasi Penghapusan Barang",
  contentText,
}) => {
  const theme = useTheme();
  const primaryDarkColor = "#2D3648";
  const lightButtonBackground = "#EDF0F7";

  const defaultContentText = itemName
    ? `Apakah Anda yakin ingin menghapus barang "${itemName}"? Tindakan ini tidak dapat diurungkan.`
    : "Apakah Anda yakin ingin menghapus barang ini? Tindakan ini tidak dapat diurungkan.";

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
          Kembali
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
          Hapus
        </Button>
      </DialogActions>
    </Dialog>
  );
};
