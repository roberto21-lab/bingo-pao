// src/Components/shared/GlassDialog.tsx
import React from "react";
import { Dialog } from "@mui/material";

type GlassDialogProps = Omit<React.ComponentProps<typeof Dialog>, "PaperProps"> & {
  children: React.ReactNode;
};

export const GlassDialog: React.FC<GlassDialogProps> = ({
  children,
  ...props
}) => {
  return (
    <Dialog
      {...props}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(25px) saturate(120%)",
            WebkitBackdropFilter: "blur(25px) saturate(120%)",
          },
        },
      }}
      PaperProps={{
        className: "glass-effect",
        sx: {
          backgroundColor: "rgba(31, 19, 9, 0.92)",
          backdropFilter: "blur(40px) saturate(150%)",
          WebkitBackdropFilter: "blur(40px) saturate(150%)",
          borderRadius: "24px",
          border: "2px solid rgba(212, 175, 55, 0.3)",
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              rgba(31, 19, 9, 0.92) 0px,
              rgba(35, 22, 11, 0.94) 1px,
              rgba(40, 25, 13, 0.92) 2px,
              rgba(35, 22, 11, 0.94) 3px,
              rgba(31, 19, 9, 0.92) 4px,
              rgba(31, 19, 9, 0.92) 12px,
              rgba(35, 22, 11, 0.94) 13px,
              rgba(40, 25, 13, 0.92) 14px,
              rgba(35, 22, 11, 0.94) 15px,
              rgba(31, 19, 9, 0.92) 16px
            ),
            linear-gradient(
              90deg,
              rgba(31, 19, 9, 0.92) 0%,
              rgba(35, 22, 11, 0.93) 25%,
              rgba(40, 25, 13, 0.92) 50%,
              rgba(35, 22, 11, 0.93) 75%,
              rgba(31, 19, 9, 0.92) 100%
            ),
            radial-gradient(ellipse 400px 300px at 30% 40%, rgba(50, 30, 15, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 350px 250px at 70% 60%, rgba(45, 28, 14, 0.12) 0%, transparent 60%)
          `,
          backgroundSize: `
            100% 32px,
            200% 100%,
            100% 100%,
            100% 100%
          `,
          boxShadow: `
            0 0 30px rgba(255, 255, 255, 0.06),
            0 0 60px rgba(255, 255, 255, 0.04),
            0 0 90px rgba(255, 255, 255, 0.02),
            0 15px 50px rgba(0, 0, 0, 0.6),
            0 30px 80px rgba(0, 0, 0, 0.4)
          `,
          position: "relative",
          overflow: "visible",
          transform: "translateY(-10px)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-5px",
            left: "-5px",
            right: "-5px",
            bottom: "-5px",
            borderRadius: "29px",
            background: `
              radial-gradient(circle 150px at top left, rgba(255, 255, 255, 0.12) 0%, transparent 60%),
              radial-gradient(circle 150px at top right, rgba(255, 255, 255, 0.12) 0%, transparent 60%),
              radial-gradient(circle 150px at bottom left, rgba(255, 255, 255, 0.1) 0%, transparent 60%),
              radial-gradient(circle 150px at bottom right, rgba(255, 255, 255, 0.1) 0%, transparent 60%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 30%, rgba(255, 255, 255, 0.08) 100%)
            `,
            zIndex: -1,
            filter: "blur(20px)",
            opacity: 0.4,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "110%",
            height: "110%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 30%, transparent 70%)",
            filter: "blur(35px)",
            zIndex: -2,
            pointerEvents: "none",
          },
        },
      }}
    >
      {children}
    </Dialog>
  );
};

