// src/Components/shared/SearchBar.tsx
import React from "react";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  numbersOnly?: boolean; // Si es true, solo permite números
  disabled?: boolean; // Si es true, deshabilita el input
};

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Buscar por número de cartón...",
  numbersOnly = false,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Si numbersOnly es true, solo permitir números
    if (numbersOnly) {
      // Remover cualquier carácter que no sea número
      const numericValue = inputValue.replace(/\D/g, '');
      onChange(numericValue);
    } else {
      onChange(inputValue);
    }
  };

  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      inputProps={{
        inputMode: numbersOnly ? 'numeric' : 'text',
        pattern: numbersOnly ? '[0-9]*' : undefined,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "#1a1008", fontSize: "22px" }} />
          </InputAdornment>
        ),
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          background: "linear-gradient(135deg, rgba(212, 175, 55, 0.9) 0%, rgba(244, 208, 63, 1) 50%, rgba(212, 175, 55, 0.9) 100%)",
          borderRadius: "12px",
          border: "1.5px solid rgba(212, 175, 55, 1)",
          boxShadow: "0 2px 8px rgba(212, 175, 55, 0.5)",
          transition: "all 0.3s ease",
          "& fieldset": {
            borderColor: "transparent",
          },
          "&:hover": {
            boxShadow: "0 4px 16px rgba(212, 175, 55, 0.7)",
            transform: "translateY(-1px)",
          },
          "&:hover fieldset": {
            borderColor: "transparent",
          },
          "&.Mui-focused": {
            boxShadow: "0 6px 20px rgba(212, 175, 55, 0.8)",
            transform: "translateY(-1px)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "transparent",
          },
          "& input": {
            color: "#1a1008",
            fontSize: "15px",
            fontWeight: 700,
            padding: "14px 12px",
            "&::placeholder": {
              color: "rgba(26, 16, 8, 0.6)",
              opacity: 1,
              fontWeight: 500,
            },
          },
        },
      }}
    />
  );
};

