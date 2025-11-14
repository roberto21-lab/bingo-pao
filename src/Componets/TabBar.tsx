// src/Componets/TabBar.tsx
import * as React from "react";
import { Box, Typography, Button } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import { useNavigate, useLocation } from "react-router-dom";

const TabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleJoin = () => {
    // Navegar a la página de salas
    navigate("/rooms");
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#1f2233",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(227, 191, 112, 0.1)",
        padding: "12px 16px",
        zIndex: 1000,
      }}
    >
      {/* Home Tab */}
      <Box
        onClick={() => navigate("/")}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          padding: "8px 16px",
          transition: "all 0.2s",
          flex: 1,
          "&:hover": {
            opacity: 0.8,
          },
        }}
      >
        <Box
          sx={{
            color: isActive("/") ? "#e3bf70" : "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.2s",
          }}
        >
          <HomeIcon />
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: isActive("/") ? "#e3bf70" : "#ffffff",
            fontSize: "12px",
            fontWeight: isActive("/") ? 600 : 400,
            transition: "color 0.2s",
          }}
        >
          Inicio
        </Typography>
      </Box>

      {/* Join Button - Centro */}
      <Button
        onClick={handleJoin}
        sx={{
          minWidth: "120px",
          height: "56px",
          background: "linear-gradient(135deg, rgba(201, 168, 90, 0.8) 0%, rgba(227, 191, 112, 0.9) 50%, rgba(240, 208, 138, 0.8) 100%)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          color: "#0f0f1e",
          fontWeight: 700,
          fontSize: "16px",
          borderRadius: "16px",
          textTransform: "none",
          border: "1px solid rgba(227, 191, 112, 0.3)",
          boxShadow: `
            0 8px 24px rgba(227, 191, 112, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset
          `,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          mx: 2,
          "&:hover": {
            background: "linear-gradient(135deg, rgba(212, 179, 102, 0.9) 0%, rgba(236, 200, 130, 1) 50%, rgba(245, 217, 154, 0.9) 100%)",
            boxShadow: `
              0 12px 32px rgba(227, 191, 112, 0.5),
              0 0 0 1px rgba(255, 255, 255, 0.2) inset
            `,
            transform: "translateY(-2px)",
          },
        }}
      >
        Unirse
      </Button>

      {/* Profile Tab */}
      <Box
        onClick={() => navigate("/profile")}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          padding: "8px 16px",
          transition: "all 0.2s",
          flex: 1,
          "&:hover": {
            opacity: 0.8,
          },
        }}
      >
        <Box
          sx={{
            color: isActive("/profile") ? "#e3bf70" : "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.2s",
          }}
        >
          <PersonIcon />
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: isActive("/profile") ? "#e3bf70" : "#ffffff",
            fontSize: "12px",
            fontWeight: isActive("/profile") ? 600 : 400,
            transition: "color 0.2s",
          }}
        >
          Perfil
        </Typography>
      </Box>
    </Box>
  );
};

export default TabBar;
