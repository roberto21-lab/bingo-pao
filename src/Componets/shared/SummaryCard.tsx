// src/Componets/shared/SummaryCard.tsx
import React from "react";
import { Paper, Stack, Box, Typography, Divider } from "@mui/material";
import { COLORS } from "../../constants/colors";

type SummaryItem = {
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
  monospace?: boolean;
};

type SummaryCardProps = {
  title: string;
  items: SummaryItem[];
};

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, items }) => {
  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 600, mb: 2 }}>
        {title}
      </Typography>

      <Paper elevation={0} sx={{ p: 3, bgcolor: COLORS.BACKGROUND.LIGHT, borderRadius: 2 }}>
        <Stack spacing={2}>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
                  {item.label}
                </Typography>
                <Typography
                  variant={item.highlight ? "h6" : "body1"}
                  sx={{
                    color: item.highlight ? COLORS.GOLD.BASE : COLORS.TEXT.PRIMARY,
                    fontWeight: item.highlight ? 700 : 500,
                    fontFamily: item.monospace ? "monospace" : "inherit",
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
              {index < items.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
};

