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
        background: "rgba(74, 44, 26, 0.8)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "2px solid rgba(212, 175, 55, 0.3)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(212, 175, 55, 0.2)",
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
            color: isActive("/") ? "#d4af37" : "#f5e6d3",
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
            color: isActive("/") ? "#d4af37" : "#f5e6d3",
            fontSize: "12px",
            fontWeight: isActive("/") ? 600 : 400,
            transition: "color 0.2s",
          }}
        >
          Inicio
        </Typography>
      </Box>

      {/* Join Button - Lingote de Oro */}
      <Button
        onClick={handleJoin}
        disableRipple
        disableElevation
        sx={{
          minWidth: "140px",
          height: "64px",
          color: "#1a0f0a !important",
          fontWeight: 800,
          fontSize: "17px",
          letterSpacing: "0.5px",
          textTransform: "none",
          position: "relative",
          // Forma de lingote (trapecio con bordes redondeados)
          borderRadius: "6px 6px 10px 10px",
          // Efecto de trapecio usando transform skew sutil
          transform: "perspective(200px) rotateX(2deg)",
          transformStyle: "preserve-3d",
          // Gradiente dorado realista de lingote
          background: `
            linear-gradient(135deg, 
              #d4af37 0%,
              #f4d03f 15%,
              #ffd700 30%,
              #f4d03f 45%,
              #d4af37 60%,
              #b8941f 75%,
              #d4af37 90%,
              #f4d03f 100%
            ) !important
          `,
          backgroundSize: "200% 200%",
          animation: "goldShimmer 4s ease-in-out infinite",
          // Sombras profundas para efecto 3D de lingote
          boxShadow: `
            0 8px 24px rgba(0, 0, 0, 0.6),
            0 4px 12px rgba(212, 175, 55, 0.4),
            inset 0 2px 4px rgba(255, 255, 255, 0.3),
            inset 0 -4px 8px rgba(0, 0, 0, 0.4),
            inset 0 0 20px rgba(255, 215, 0, 0.2)
          `,
          // Bordes biselados
          border: "none !important",
          borderTop: "2px solid rgba(255, 255, 255, 0.4) !important",
          borderBottom: "3px solid rgba(0, 0, 0, 0.3) !important",
          // Deshabilitar estilos por defecto de MUI
          "&.MuiButton-root": {
            backgroundColor: "transparent",
            boxShadow: "none",
          },
          // Efecto de relieve
          "&::before": {
            content: '""',
            position: "absolute",
            top: "2px",
            left: "8%",
            right: "8%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)",
            borderRadius: "1px",
            zIndex: 1,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: "4px",
            left: "5%",
            right: "5%",
            height: "3px",
            background: "linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.3), transparent)",
            borderRadius: "2px",
            zIndex: 1,
          },
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          mx: 2,
          "&:hover": {
            transform: "perspective(200px) rotateX(2deg) translateY(-3px) scale(1.02)",
            background: `
              linear-gradient(135deg, 
                #d4af37 0%,
                #f4d03f 15%,
                #ffd700 30%,
                #f4d03f 45%,
                #d4af37 60%,
                #b8941f 75%,
                #d4af37 90%,
                #f4d03f 100%
              ) !important
            `,
            boxShadow: `
              0 12px 36px rgba(0, 0, 0, 0.7),
              0 6px 16px rgba(212, 175, 55, 0.5),
              inset 0 2px 4px rgba(255, 255, 255, 0.4),
              inset 0 -4px 8px rgba(0, 0, 0, 0.5),
              inset 0 0 25px rgba(255, 215, 0, 0.3)
            `,
          },
          "&:active": {
            transform: "perspective(200px) rotateX(2deg) translateY(0px) scale(0.99)",
            // Mantener exactamente el mismo estilo visual
            background: `
              linear-gradient(135deg, 
                #d4af37 0%,
                #f4d03f 15%,
                #ffd700 30%,
                #f4d03f 45%,
                #d4af37 60%,
                #b8941f 75%,
                #d4af37 90%,
                #f4d03f 100%
              ) !important
            `,
            boxShadow: `
              0 8px 24px rgba(0, 0, 0, 0.6),
              0 4px 12px rgba(212, 175, 55, 0.4),
              inset 0 2px 4px rgba(255, 255, 255, 0.3),
              inset 0 -4px 8px rgba(0, 0, 0, 0.4),
              inset 0 0 20px rgba(255, 215, 0, 0.2)
            `,
            borderTop: "2px solid rgba(255, 255, 255, 0.4) !important",
            borderBottom: "3px solid rgba(0, 0, 0, 0.3) !important",
            filter: "none",
          },
          "&:focus": {
            background: `
              linear-gradient(135deg, 
                #d4af37 0%,
                #f4d03f 15%,
                #ffd700 30%,
                #f4d03f 45%,
                #d4af37 60%,
                #b8941f 75%,
                #d4af37 90%,
                #f4d03f 100%
              ) !important
            `,
            boxShadow: `
              0 8px 24px rgba(0, 0, 0, 0.6),
              0 4px 12px rgba(212, 175, 55, 0.4),
              inset 0 2px 4px rgba(255, 255, 255, 0.3),
              inset 0 -4px 8px rgba(0, 0, 0, 0.4),
              inset 0 0 20px rgba(255, 215, 0, 0.2)
            `,
          },
          "@keyframes goldShimmer": {
            "0%, 100%": {
              backgroundPosition: "0% 50%",
            },
            "50%": {
              backgroundPosition: "100% 50%",
            },
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
            color: isActive("/profile") ? "#d4af37" : "#f5e6d3",
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
            color: isActive("/profile") ? "#d4af37" : "#f5e6d3",
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
