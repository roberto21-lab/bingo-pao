import React, { useState, useEffect } from "react";
import { TextField, MenuItem, CircularProgress } from "@mui/material";
import { getDocumentTypes, type DocumentType } from "../Services/documentTypes.service";

type DocumentTypeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  sx?: any;
};

const textFieldStyles = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(31, 19, 9, 0.95)",
    borderRadius: 2,
    "& fieldset": {
      borderColor: "rgba(212, 175, 55, 0.4)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(244, 208, 63, 0.8)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(244, 208, 63, 1)",
      boxShadow: "0 0 0 1px rgba(244, 208, 63, 0.6)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(245, 230, 211, 0.8)",
  },
  "& .MuiInputBase-input": {
    color: "#f5e6d3",
  },
  "& .Mui-disabled": {
    WebkitTextFillColor: "#f5e6d3 !important",
  },
};

export const DocumentTypeSelect: React.FC<DocumentTypeSelectProps> = ({
  value,
  onChange,
  disabled = false,
  label = "Tipo de documento",
  required = false,
  error = false,
  helperText,
  fullWidth = true,
  sx,
}) => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        setLoading(true);
        const types = await getDocumentTypes();
        // Filtrar solo los tipos activos
        const activeTypes = types.filter((type) => type.is_active);
        setDocumentTypes(activeTypes);
        setErrorState(null);
      } catch (err: any) {
        console.error("Error al cargar tipos de documento:", err);
        setErrorState("Error al cargar tipos de documento");
      } finally {
        setLoading(false);
      }
    };

    loadDocumentTypes();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  if (loading) {
    return (
      <TextField
        fullWidth={fullWidth}
        label={label}
        value=""
        disabled
        required={required}
        error={error}
        helperText={helperText}
        sx={{ ...textFieldStyles, ...sx }}
        InputProps={{
          endAdornment: <CircularProgress size={20} sx={{ color: "#d4af37" }} />,
        }}
      />
    );
  }

  if (errorState) {
    return (
      <TextField
        fullWidth={fullWidth}
        label={label}
        value=""
        disabled
        required={required}
        error={true}
        helperText={errorState}
        sx={{ ...textFieldStyles, ...sx }}
      />
    );
  }

  return (
    <TextField
      select
      fullWidth={fullWidth}
      label={label}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      error={error}
      helperText={helperText}
      sx={{ ...textFieldStyles, ...sx }}
    >
      <MenuItem
        value=""
        sx={{
          bgcolor: "rgba(31, 19, 9, 0.95)",
          color: "#f5e6d3",
          "&:hover": {
            bgcolor: "rgba(212, 175, 55, 0.2)",
          },
        }}
      >
        <em>Seleccione un tipo</em>
      </MenuItem>
      {documentTypes.map((type) => (
        <MenuItem
          key={type._id}
          value={type._id}
          sx={{
            bgcolor: "rgba(31, 19, 9, 0.95)",
            color: "#f5e6d3",
            "&:hover": {
              bgcolor: "rgba(212, 175, 55, 0.2)",
            },
            "&.Mui-selected": {
              bgcolor: "rgba(212, 175, 55, 0.3)",
              "&:hover": {
                bgcolor: "rgba(212, 175, 55, 0.4)",
              },
            },
          }}
        >
          {type.name}
        </MenuItem>
      ))}
    </TextField>
  );
};

