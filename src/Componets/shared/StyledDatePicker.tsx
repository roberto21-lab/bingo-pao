// src/Componets/shared/StyledDatePicker.tsx
import React from "react";
import { Box } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import { COLORS } from "../../constants/colors";
import { datePickerBoxStyles, datePickerTextFieldStyles } from "./formStyles";

type StyledDatePickerProps = {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  maxDate?: Date;
  required?: boolean;
  disabled?: boolean;
};

export const StyledDatePicker: React.FC<StyledDatePickerProps> = ({
  label,
  value,
  onChange,
  maxDate,
  required = false,
  disabled = false,
}) => {
  return (
    <Box sx={datePickerBoxStyles}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <DatePicker
          label={label}
          value={value}
          onChange={onChange}
          maxDate={maxDate}
          disabled={disabled}
          slotProps={{
            textField: {
              required,
              fullWidth: true,
              variant: "standard",
              inputProps: {
                style: {
                  color: COLORS.TEXT.PRIMARY,
                  WebkitTextFillColor: COLORS.TEXT.PRIMARY,
                },
              },
              sx: datePickerTextFieldStyles,
            },
            openPickerIcon: {
              sx: {
                color: COLORS.TEXT.PRIMARY,
                bgcolor: COLORS.BACKGROUND.WHITE,
                borderRadius: "4px",
                padding: "4px",
                "&:hover": {
                  color: COLORS.TEXT.PRIMARY,
                  bgcolor: COLORS.BACKGROUND.DISABLED,
                },
              },
            },
          }}
        />
      </LocalizationProvider>
    </Box>
  );
};

