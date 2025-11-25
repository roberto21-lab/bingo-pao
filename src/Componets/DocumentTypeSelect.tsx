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

// Estilos consistentes con los otros modales
const textFieldStyles = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#ffffff",
    borderRadius: 2,
    "& fieldset": {
      borderColor: "#d4af37",
      borderWidth: 2,
    },
    "&:hover fieldset": {
      borderColor: "#b8941f",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#d4af37",
      boxShadow: "0 0 0 2px rgba(212, 175, 55, 0.2)",
    },
    "&.Mui-disabled": {
      bgcolor: "#f5f5f5",
      "& fieldset": {
        borderColor: "#e0e0e0",
      },
    },
  },
  "& .MuiInputLabel-root": {
    color: "#1a1008",
    fontWeight: 600,
    "&.Mui-focused": {
      color: "#d4af37",
    },
    "&.Mui-disabled": {
      color: "#999",
    },
  },
  "& .MuiInputBase-input": {
    color: "#1a1008",
    fontWeight: 500,
    "&.Mui-disabled": {
      WebkitTextFillColor: "#666 !important",
      color: "#666 !important",
    },
  },
  "& .MuiFormHelperText-root": {
    color: "#666",
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  "& .MuiSelect-icon": {
    color: "#1a1008",
  },
};

const menuItemStyles = {
  color: "#1a1008",
  bgcolor: "#ffffff",
  "&:hover": {
    bgcolor: "#fff9e6",
  },
  "&.Mui-selected": {
    bgcolor: "#fff9e6",
    color: "#1a1008",
    fontWeight: 600,
    "&:hover": {
      bgcolor: "#fff3cc",
    },
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
      <MenuItem value="" sx={menuItemStyles}>
        <em>Seleccione un tipo</em>
      </MenuItem>
      {documentTypes.map((type) => (
        <MenuItem key={type._id} value={type._id} sx={menuItemStyles}>
          {type.name}
        </MenuItem>
      ))}
    </TextField>
  );
};

