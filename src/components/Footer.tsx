import React from "react";
import { Box, Typography, useTheme } from "@mui/material";

interface FooterProps {
  companyName?: string;
  year?: number;
}

const Footer: React.FC<FooterProps> = ({
  companyName = "Rifa-SIMS",
  year = new Date().getFullYear(),
}) => {
  const theme = useTheme();

  return (
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
        &copy; {year} {companyName}. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
