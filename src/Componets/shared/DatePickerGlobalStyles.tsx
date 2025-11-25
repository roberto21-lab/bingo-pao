// src/Componets/shared/DatePickerGlobalStyles.tsx
import React from "react";
import { GlobalStyles } from "@mui/material";
import { COLORS } from "../../constants/colors";
import { datePickerInputStyles } from "./formStyles";

export const DatePickerGlobalStyles: React.FC = () => {
  return (
    <GlobalStyles
      styles={{
        ".MuiPickersPopper-paper": {
          backgroundColor: `${COLORS.BACKGROUND.WHITE} !important`,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15) !important",
          "& .MuiPickersCalendarHeader-root": {
            backgroundColor: `${COLORS.GOLD.BASE} !important`,
            color: `${COLORS.BACKGROUND.WHITE} !important`,
            padding: "12px 16px !important",
            "& .MuiPickersCalendarHeader-label": {
              color: `${COLORS.BACKGROUND.WHITE} !important`,
              fontWeight: "700 !important",
              fontSize: "1rem !important",
            },
            "& .MuiIconButton-root": {
              color: `${COLORS.BACKGROUND.WHITE} !important`,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.2) !important",
              },
            },
          },
          "& .MuiDayCalendar-weekContainer": {
            "& .MuiPickersDay-root": {
              color: `${COLORS.BACKGROUND.WHITE} !important`,
              fontWeight: "500 !important",
              fontSize: "0.875rem !important",
              backgroundColor: `${COLORS.TEXT.PRIMARY} !important`,
              "&.Mui-selected": {
                backgroundColor: `${COLORS.GOLD.BASE} !important`,
                color: `${COLORS.BACKGROUND.WHITE} !important`,
                fontWeight: "700 !important",
                "&:hover": {
                  backgroundColor: `${COLORS.GOLD.DARK} !important`,
                  color: `${COLORS.BACKGROUND.WHITE} !important`,
                },
              },
              "&.MuiPickersDay-today": {
                border: `2px solid ${COLORS.GOLD.BASE} !important`,
                fontWeight: "700 !important",
                backgroundColor: `${COLORS.TEXT.PRIMARY} !important`,
                color: `${COLORS.BACKGROUND.WHITE} !important`,
              },
              "&:hover": {
                backgroundColor: "#333 !important",
                color: `${COLORS.BACKGROUND.WHITE} !important`,
              },
              "&.Mui-disabled": {
                color: `${COLORS.TEXT.SECONDARY} !important`,
                backgroundColor: `${COLORS.BACKGROUND.DISABLED} !important`,
              },
            },
          },
        },
        // Estilos para forzar color negro en inputs del DatePicker
        "div[role='textbox'] .MuiOutlinedInput-root fieldset, .MuiDatePicker-root .MuiOutlinedInput-root fieldset, .MuiTextField-root .MuiOutlinedInput-root:not(.Mui-disabled) fieldset": {
          borderColor: `${COLORS.BORDER.GOLD} !important`,
          borderWidth: "2px !important",
        },
        "div[role='textbox'] .MuiOutlinedInput-root:hover fieldset, .MuiDatePicker-root .MuiOutlinedInput-root:hover fieldset": {
          borderColor: `${COLORS.BORDER.GOLD_HOVER} !important`,
          borderWidth: "2px !important",
        },
        "div[role='textbox'] .MuiOutlinedInput-root.Mui-focused fieldset, .MuiDatePicker-root .MuiOutlinedInput-root.Mui-focused fieldset": {
          borderColor: `${COLORS.BORDER.GOLD} !important`,
          borderWidth: "2px !important",
        },
        // Forzar color negro en todos los inputs del DatePicker
        ".MuiDatePicker-root .MuiInputBase-input, .MuiDatePicker-root input, .MuiDatePicker-root input[type='text'], .MuiDatePicker-root .MuiInput-root input, div[role='textbox'] .MuiInputBase-input, div[role='textbox'] input, div[role='textbox'] input[type='text'], .MuiInputBase-input[value], input[value], .MuiTextField-root .MuiInputBase-input, .MuiTextField-root input, [style*='border'][style*='#d4af37'] input": datePickerInputStyles,
        ".MuiPickersInputBase-root, .MuiPickersInput-root, [class*='MuiPickersInput'], [class*='MuiPickersInputBase'], [class*='MuiPickersInputBase-root-MuiPickersInput-root']": {
          color: `${COLORS.TEXT.PRIMARY} !important`,
          "& input": datePickerInputStyles,
        },
      }}
    />
  );
};

