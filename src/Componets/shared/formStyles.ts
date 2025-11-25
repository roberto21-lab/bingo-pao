// src/Componets/shared/formStyles.ts
// Estilos compartidos para formularios

import { COLORS } from "../../constants/colors";

export const commonInputStyles = {
  "& .MuiOutlinedInput-root": {
    bgcolor: COLORS.BACKGROUND.WHITE,
    borderRadius: 2,
    "& fieldset": {
      borderColor: COLORS.BORDER.GOLD,
      borderWidth: 2,
    },
    "&:hover fieldset": {
      borderColor: COLORS.BORDER.GOLD_HOVER,
    },
    "&.Mui-focused fieldset": {
      borderColor: COLORS.BORDER.GOLD,
      boxShadow: "0 0 0 2px rgba(212, 175, 55, 0.2)",
    },
    "&.Mui-disabled": {
      bgcolor: COLORS.BACKGROUND.DISABLED,
      "& fieldset": {
        borderColor: COLORS.BORDER.LIGHT,
      },
    },
  },
  "& .MuiInputLabel-root": {
    color: COLORS.TEXT.PRIMARY,
    fontWeight: 600,
    "&.Mui-focused": {
      color: COLORS.GOLD.BASE,
    },
    "&.Mui-disabled": {
      color: COLORS.TEXT.DISABLED,
    },
  },
  "& .MuiInputBase-input": {
    color: COLORS.TEXT.PRIMARY,
    fontWeight: 500,
    "&::placeholder": {
      color: "rgba(26, 16, 8, 0.5)",
      opacity: 1,
    },
    "&.Mui-disabled": {
      WebkitTextFillColor: `${COLORS.TEXT.SECONDARY} !important`,
      color: `${COLORS.TEXT.SECONDARY} !important`,
    },
  },
  "& .MuiFormHelperText-root": {
    color: COLORS.TEXT.SECONDARY,
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  "& .MuiSelect-icon": {
    color: COLORS.TEXT.PRIMARY,
  },
} as const;

export const menuItemStyles = {
  color: COLORS.TEXT.PRIMARY,
  bgcolor: COLORS.BACKGROUND.WHITE,
  "&:hover": {
    bgcolor: "#fff9e6",
  },
  "&.Mui-selected": {
    bgcolor: "#fff9e6",
    color: COLORS.TEXT.PRIMARY,
    fontWeight: 600,
    "&:hover": {
      bgcolor: "#fff3cc",
    },
  },
} as const;

export const datePickerInputStyles = {
  color: `${COLORS.TEXT.PRIMARY} !important`,
  WebkitTextFillColor: `${COLORS.TEXT.PRIMARY} !important`,
  caretColor: `${COLORS.TEXT.PRIMARY} !important`,
} as const;

export const datePickerBoxStyles = {
  width: "100%",
  border: `2px solid ${COLORS.BORDER.GOLD}`,
  borderRadius: 2,
  bgcolor: COLORS.BACKGROUND.WHITE,
  p: 1.5,
  position: "relative" as const,
  "&:hover": {
    borderColor: COLORS.BORDER.GOLD_HOVER,
  },
  "&:focus-within": {
    borderColor: COLORS.BORDER.GOLD,
    boxShadow: "0 0 0 2px rgba(212, 175, 55, 0.2)",
  },
  "& input, & input[type='text'], & .MuiInputBase-input, & .MuiInput-input, & .MuiInputBase-root input, & .MuiInput-root input": datePickerInputStyles,
  "& .MuiPickersInputBase-root, & .MuiPickersInput-root, & [class*='MuiPickersInput']": {
    color: `${COLORS.TEXT.PRIMARY} !important`,
    "& input": datePickerInputStyles,
  },
} as const;

export const datePickerTextFieldStyles = {
  "& .MuiInput-root": {
    "&::before, &::after": { display: "none" },
    "& input": datePickerInputStyles,
  },
  "& .MuiInputLabel-root": {
    color: `${COLORS.TEXT.PRIMARY} !important`,
    fontWeight: 600,
    "&.Mui-focused": {
      color: `${COLORS.GOLD.BASE} !important`,
    },
  },
  "& .MuiInputBase-input": {
    ...datePickerInputStyles,
    fontWeight: 500,
    cursor: "pointer",
    "&::-webkit-input-placeholder, &::placeholder": {
      color: `${COLORS.TEXT.PRIMARY} !important`,
      WebkitTextFillColor: `${COLORS.TEXT.PRIMARY} !important`,
    },
  },
  "& input, & input[type='text'], & input[value]": datePickerInputStyles,
} as const;

