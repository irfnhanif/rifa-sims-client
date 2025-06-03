import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Box } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NotificationCenter from "./NavigationCenter";

interface HeaderProps {
  title: string;
  onBackClick?: () => void;
  showBackButton?: boolean;
  backgroundColor?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  onBackClick,
  showBackButton = true,
  backgroundColor = "#2D3648",
}) => {
  return (
    <AppBar position="static" sx={{ backgroundColor }}>
      <Toolbar>
        {showBackButton && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            sx={{ mr: 2 }}
            onClick={onBackClick}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: "bold" }}
        >
          {title}
        </Typography>
        
        {/* Move NotificationCenter inside the Toolbar */}
        <NotificationCenter />
      </Toolbar>
    </AppBar>
  );
};

export default Header;