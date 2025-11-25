// src/Componets/shared/FormStepper.tsx
import React from "react";
import { Stepper, Step, StepLabel } from "@mui/material";
import { COLORS } from "../../constants/colors";

type FormStepperProps = {
  steps: string[];
  activeStep: number;
};

export const FormStepper: React.FC<FormStepperProps> = ({ steps, activeStep }) => {
  return (
    <Stepper
      activeStep={activeStep}
      sx={{
        mt: { xs: 2, sm: 3 },
        mb: { xs: 3, sm: 4 },
        "& .MuiStepLabel-root": {
          "& .MuiStepLabel-label": {
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          },
        },
      }}
      orientation="horizontal"
    >
      {steps.map((label) => (
        <Step key={label}>
          <StepLabel
            sx={{
              "& .MuiStepLabel-label": {
                color: `${COLORS.TEXT.PRIMARY} !important`,
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
              "& .MuiStepIcon-root": {
                color: activeStep >= steps.indexOf(label) ? COLORS.GOLD.BASE : "#ddd",
                "&.Mui-active": { color: COLORS.GOLD.BASE },
                "&.Mui-completed": { color: COLORS.GOLD.DARK },
                fontSize: { xs: "1.5rem", sm: "1.75rem" },
              },
            }}
          >
            {label}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

