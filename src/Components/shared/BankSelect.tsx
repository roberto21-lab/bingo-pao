// src/Components/shared/BankSelect.tsx
import React from "react";
import { TextField, MenuItem } from "@mui/material";
import { commonInputStyles, menuItemStyles } from "./formStyles";

type BankSelectProps = {
  value: string;
  onChange: (value: string) => void;
  banks: string[];
  disabled?: boolean;
  required?: boolean;
  label?: string;
};

export const BankSelect: React.FC<BankSelectProps> = ({
  value,
  onChange,
  banks,
  disabled = false,
  required = false,
  label = "Banco emisor",
}) => {
  return (
    <TextField
      select
      fullWidth
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      sx={commonInputStyles}
    >
      <MenuItem value="" sx={menuItemStyles}>
        <em>Seleccione un banco</em>
      </MenuItem>
      {banks.map((bank) => (
        <MenuItem key={bank} value={bank} sx={menuItemStyles}>
          {bank}
        </MenuItem>
      ))}
    </TextField>
  );
};

