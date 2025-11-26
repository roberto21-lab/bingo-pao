// src/Componets/shared/MetallicButton.tsx
import React from "react";
import { Button } from "@mui/material";

type MetallicButtonVariant = "gold" | "gray" | "red";

type MetallicButtonProps = Omit<React.ComponentProps<typeof Button>, "variant"> & {
  variant?: MetallicButtonVariant;
  fullWidth?: boolean;
};

const getMetallicStyles = (variant: MetallicButtonVariant, disabled: boolean) => {
  const baseStyles = {
    backfaceVisibility: "hidden" as const,
    position: "relative" as const,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-block",
    whiteSpace: "nowrap" as const,
    color: "#fff",
    fontWeight: 900,
    fontSize: "14px",
    py: 1.5,
    borderRadius: "8px",
    textTransform: "none" as const,
    transition: "all 0.2s ease",
  };

  if (variant === "gold") {
    return {
      ...baseStyles,
      textShadow: disabled
        ? "0px -1px 0px rgba(0,0,0,0.3)"
        : "0px -1px 0px rgba(0,0,0,0.5), 0px 1px 2px rgba(255, 215, 0, 0.3)",
      border: disabled ? "1px solid rgba(212, 175, 55, 0.3)" : "1px solid #d4af37",
      backgroundImage: disabled
        ? "none"
        : `
          repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .12) 3.75%),
          repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .04) 2.25%),
          repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .18) 1.2%),
          linear-gradient(180deg, #d4af37 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #f4d03f 53%, #ffd700 75%, #d4af37 100%)
        `,
      backgroundColor: disabled ? "rgba(212, 175, 55, 0.2)" : "transparent",
      boxShadow: disabled
        ? "none"
        : `
          inset 0px 1px 0px rgba(255,255,255,0.9),
          inset 0px -1px 0px rgba(0,0,0,0.2),
          0px 1px 3px rgba(0,0,0,0.4),
          0px 4px 12px rgba(212, 175, 55, 0.4),
          0px 0px 20px rgba(255, 215, 0, 0.2)
        `,
      "&:hover": disabled
        ? {}
        : {
            backgroundImage: `
              repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .15) 3.75%),
              repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .05) 2.25%),
              repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .2) 1.2%),
              linear-gradient(180deg, #f4d03f 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #ffed4e 53%, #ffd700 75%, #f4d03f 100%)
            `,
            boxShadow: `
              inset 0px 1px 0px rgba(255,255,255,1),
              inset 0px -1px 0px rgba(0,0,0,0.2),
              0px 2px 6px rgba(0,0,0,0.5),
              0px 6px 20px rgba(212, 175, 55, 0.5),
              0px 0px 30px rgba(255, 215, 0, 0.3)
            `,
            transform: "translateY(-1px)",
          },
      "&:active": disabled
        ? {}
        : {
            transform: "translateY(2px)",
            boxShadow: `
              inset 0px 1px 0px rgba(255,255,255,0.7),
              inset 0px -1px 0px rgba(0,0,0,0.3),
              0px 1px 2px rgba(0,0,0,0.4),
              0px 2px 8px rgba(212, 175, 55, 0.3),
              0px 0px 15px rgba(255, 215, 0, 0.15)
            `,
          },
      "&:disabled": {
        opacity: 0.5,
      },
    };
  }

  if (variant === "red") {
    return {
      ...baseStyles,
      textShadow: "0px -1px 0px rgba(0,0,0,0.5), 0px 1px 2px rgba(255, 87, 34, 0.3)",
      border: "1px solid #d32f2f",
      backgroundImage: `
        repeating-linear-gradient(left, rgba(255, 87, 34, 0) 0%, rgba(255, 87, 34, 0) 3%, rgba(255, 87, 34, .12) 3.75%),
        repeating-linear-gradient(left, rgba(211, 47, 47, 0) 0%, rgba(211, 47, 47, 0) 2%, rgba(211, 47, 47, .04) 2.25%),
        repeating-linear-gradient(left, rgba(255, 112, 67, 0) 0%, rgba(255, 112, 67, 0) .6%, rgba(255, 112, 67, .18) 1.2%),
        linear-gradient(180deg, #d32f2f 0%, #f44336 25%, #ff5722 38%, #f44336 47%, #e53935 53%, #f44336 75%, #d32f2f 100%)
      `,
      boxShadow: `
        inset 0px 1px 0px rgba(255,255,255,0.9),
        inset 0px -1px 0px rgba(0,0,0,0.2),
        0px 1px 3px rgba(0,0,0,0.4),
        0px 4px 12px rgba(211, 47, 47, 0.4),
        0px 0px 20px rgba(255, 87, 34, 0.2)
      `,
      "&:hover": {
        backgroundImage: `
          repeating-linear-gradient(left, rgba(255, 87, 34, 0) 0%, rgba(255, 87, 34, 0) 3%, rgba(255, 87, 34, .15) 3.75%),
          repeating-linear-gradient(left, rgba(211, 47, 47, 0) 0%, rgba(211, 47, 47, 0) 2%, rgba(211, 47, 47, .05) 2.25%),
          repeating-linear-gradient(left, rgba(255, 112, 67, 0) 0%, rgba(255, 112, 67, 0) .6%, rgba(255, 112, 67, .2) 1.2%),
          linear-gradient(180deg, #e53935 0%, #f44336 25%, #ff5722 38%, #f44336 47%, #ff7043 53%, #f44336 75%, #e53935 100%)
        `,
        boxShadow: `
          inset 0px 1px 0px rgba(255,255,255,1),
          inset 0px -1px 0px rgba(0,0,0,0.2),
          0px 2px 6px rgba(0,0,0,0.5),
          0px 6px 20px rgba(211, 47, 47, 0.5),
          0px 0px 30px rgba(255, 87, 34, 0.3)
        `,
        transform: "translateY(-1px)",
      },
      "&:active": {
        transform: "translateY(2px)",
        boxShadow: `
          inset 0px 1px 0px rgba(255,255,255,0.7),
          inset 0px -1px 0px rgba(0,0,0,0.3),
          0px 1px 2px rgba(0,0,0,0.4),
          0px 2px 8px rgba(211, 47, 47, 0.3),
          0px 0px 15px rgba(255, 87, 34, 0.15)
        `,
      },
    };
  }

  // gray variant
  return {
    ...baseStyles,
    textShadow: "0px -1px 0px rgba(0,0,0,0.4)",
    borderColor: "#7c7c7c",
    borderWidth: "1px",
    backgroundImage: `
      repeating-linear-gradient(left, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 6%, hsla(0,0%,100%, .1) 7.5%),
      repeating-linear-gradient(left, hsla(0,0%, 0%,0) 0%, hsla(0,0%, 0%,0) 4%, hsla(0,0%, 0%,.03) 4.5%),
      repeating-linear-gradient(left, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 1.2%, hsla(0,0%,100%,.15) 2.2%),
      linear-gradient(180deg, hsl(0,0%,78%) 0%, hsl(0,0%,90%) 47%, hsl(0,0%,78%) 53%, hsl(0,0%,70%) 100%)
    `,
    boxShadow: `
      inset 0px 1px 0px rgba(255,255,255,1),
      0px 1px 3px rgba(0,0,0,0.3),
      0px 4px 12px rgba(0, 0, 0, 0.2)
    `,
    "&:hover": {
      boxShadow: `
        inset 0px 1px 0px rgba(255,255,255,1),
        0px 2px 6px rgba(0,0,0,0.4),
        0px 6px 16px rgba(0, 0, 0, 0.3)
      `,
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(2px)",
      boxShadow: `
        inset 0px 1px 0px rgba(255,255,255,0.8),
        0px 1px 2px rgba(0,0,0,0.3),
        0px 2px 8px rgba(0, 0, 0, 0.15)
      `,
    },
  };
};

export const MetallicButton: React.FC<MetallicButtonProps> = ({
  variant = "gold",
  children,
  disabled = false,
  fullWidth = false,
  sx,
  ...props
}) => {
  const metallicStyles = getMetallicStyles(variant, disabled);

  return (
    <Button
      {...props}
      disabled={disabled}
      fullWidth={fullWidth}
      sx={{
        ...metallicStyles,
        ...sx,
      }}
    >
      {children}
    </Button>
  );
};

