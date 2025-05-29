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
  title = "Konfirmasi Penghapusan", // Default title
  contentText,
}) => {
  const theme = useTheme();
  const primaryDarkColor = "#2D3648"; // From your Figma
  const lightButtonBackground = "#EDF0F7"; // From your Figma

  // Construct the confirmation message
  const defaultContentText = itemName
    ? `Apakah Anda yakin ingin menghapus barang "${itemName}"? Tindakan ini tidak dapat diurungkan.`
    : "Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat diurungkan.";

  const finalContentText = contentText || defaultContentText;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-delete-dialog-title"
      aria-describedby="confirm-delete-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: "8px", // Figma: borderRadius: 8
          // The outline: '2px #2D3648 solid' with outlineOffset: '-2px' is a bit unconventional for MUI Dialogs.
          // MUI Dialogs use Paper with elevation. Adding a stark outline might conflict visually.
          // A border could be an alternative if a strong edge is needed.
          // For now, relying on standard dialog elevation and custom borderRadius.
          // If a border is strictly needed: border: `2px solid ${primaryDarkColor}`,
          padding: theme.spacing(1), // Corresponds to Figma's inner content padding: 32, DialogTitle/Content/Actions handle their own padding. This is an overall padding for the dialog Paper. Figma padding: 32 overall from edge to content.
          // MUI DialogTitle, DialogContent, DialogActions provide standard padding that usually works well.
          // Let's adjust DialogContent padding to better match Figma.
        },
      }}
    >
      <DialogTitle
        id="confirm-delete-dialog-title"
        sx={{
          padding: theme.spacing(3, 4, 2, 4), // Approx Figma's padding: 32, gap: 24 (adjusting from default)
          // Figma gap 10 from headline elements.
          // Placeholder height: 32. This title itself will have content.
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontFamily: "Inter, sans-serif",
            fontWeight: "700",
            color: primaryDarkColor,
            fontSize: "22px" /* Adjusted for prominence */,
          }}
        >
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent
        sx={{
          padding: theme.spacing(0, 4, 3, 4), // Approx Figma's padding: 32, gap: 24
          // Figma had gap 8 from content elements.
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
          padding: theme.spacing(2, 4, 3, 4), // Approx Figma's padding: 32 for bottom area
          gap: theme.spacing(2) /* Figma: gap: 16px */,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            flexGrow: 1, // If buttons should take available space, though Figma implies fixed padding
            padding: "12px 20px", // Figma values
            backgroundColor: lightButtonBackground,
            color: primaryDarkColor,
            fontSize: "16px",
            fontFamily: "Inter, sans-serif",
            fontWeight: "700",
            lineHeight: "24px",
            borderRadius: "6px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: theme.palette.grey[300], // Slightly darker hover for light button
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
            padding: "12px 20px", // Figma values
            backgroundColor: primaryDarkColor,
            color: "white",
            fontSize: "16px",
            fontFamily: "Inter, sans-serif",
            fontWeight: "700",
            lineHeight: "24px",
            borderRadius: "6px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#1E2532", // Darker shade of primaryDarkColor
            },
          }}
          autoFocus // Good practice for the affirmative action
        >
          Hapus
        </Button>
      </DialogActions>
    </Dialog>
  );
};
