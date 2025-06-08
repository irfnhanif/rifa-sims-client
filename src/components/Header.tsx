import React from "react";
import { AppBar, Toolbar, Typography, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAuth } from "../helper/use-auth";
import NotificationCenter from "./NavigationCenter";
import { UserRole } from "../types/user-role";

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
  const { user } = useAuth();
  const isOwner = user?.roles?.includes(UserRole.OWNER) ?? false;

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
        {isOwner && <NotificationCenter />}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
