// src/Componets/BingoLogo.tsx
import * as React from "react";
import { Box } from "@mui/material";
import logoImage from "../assets/logo.png";

const BingoLogo: React.FC<{ size?: number }> = ({ size = 150 }) => {
  return (
    <Box
      sx={{
        position: "relative",
        width: size * 1.6,
        height: size * 1.6,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Contenedor del logo con la imagen */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src={logoImage}
          alt="Bingo PaO Logo"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 0 20px rgba(227, 191, 112, 0.5))",
          }}
        />
      </Box>
    </Box>
  );
};

export default BingoLogo;
