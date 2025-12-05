import type { SxProps, Theme } from "@mui/material";
import { COLORS } from "../constants/colors";

export const walletPageStyles = {
  pageContainer: {
    minHeight: "100vh",
    background: "transparent",
    color: "#f5e6d3",
    paddingBottom: "80px",
    position: "relative",
  } as SxProps<Theme>,

  container: {
    pt: "80px",
    pb: 4,
  } as SxProps<Theme>,

  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  } as SxProps<Theme>,

  loadingProgress: {
    color: "#d4af37",
  } as SxProps<Theme>,

  notAuthenticatedContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    gap: 2,
  } as SxProps<Theme>,

  notAuthenticatedText: {
    color: "#f5e6d3",
  } as SxProps<Theme>,

  loginButton: {
    bgcolor: "#d4af37",
    color: "#1a1008",
    "&:hover": { bgcolor: "#b8941f" },
  } as SxProps<Theme>,

  headerContainer: {
    mb: 4,
  } as SxProps<Theme>,

  headerTitle: {
    color: "#f5e6d3",
    mb: 1,
  } as SxProps<Theme>,

  headerSubtitle: {
    color: "rgba(245, 230, 211, 0.7)",
  } as SxProps<Theme>,

  balanceStack: {
    mb: 4,
  } as SxProps<Theme>,

  actionButtonsStack: {
    direction: { xs: "column", sm: "row" },
    spacing: 1.5,
    mb: 4,
  } as SxProps<Theme>,

  rechargeButton: {
    background: "linear-gradient(135deg, #00E676 0%, #00C853 100%)",
    fontWeight: 700,
    py: 1.5,
    borderRadius: 2,
    textTransform: "none",
    "&:hover": {
      background: "linear-gradient(135deg, #00C853 0%, #00B248 100%)",
    },
  } as SxProps<Theme>,

  withdrawButton: {
    fontWeight: 700,
    py: 1.5,
    borderRadius: 2,
    textTransform: "none",
    borderColor: "#d4af37",
    color: "#d4af37",
    "&:hover": {
      borderColor: "#b8941f",
      bgcolor: "rgba(212, 175, 55, 0.1)",
    },
  } as SxProps<Theme>,

  transactionsCard: {
    borderRadius: 4,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  } as SxProps<Theme>,

  transactionsHeader: {
    px: 3,
    pt: 3,
    pb: 1.5,
  } as SxProps<Theme>,

  transactionsTitle: {
    color: "#f5e6d3",
    mb: 0.5,
  } as SxProps<Theme>,

  transactionsSubtitle: {
    color: "rgba(245, 230, 211, 0.7)",
  } as SxProps<Theme>,

  tabsContainer: {
    px: 1.5,
    pb: 1,
  } as SxProps<Theme>,

  tabs: {
    minHeight: 0,
    "& .MuiTabs-flexContainer": {
      bgcolor: "rgba(31, 19, 9, 0.8)",
      borderRadius: 2,
      border: `1px solid ${COLORS.BORDER.GOLD}`,
      gap: 0.5,
      p: 0.5,
    },
    "& .MuiTab-root": {
      minHeight: 0,
      py: 1.2,
      px: 2,
      textTransform: "none",
      fontWeight: 600,
      fontSize: 14,
      color: "rgba(245, 230, 211, 0.7)",
      borderRadius: 1.5,
      transition: "all 0.2s ease",
      "&:hover": {
        bgcolor: "rgba(212, 175, 55, 0.15)",
        color: "#f5e6d3",
      },
    },
    "& .MuiTab-root.Mui-selected": {
      color: "#f5e6d3",
      bgcolor: "rgba(212, 175, 55, 0.25)",
      border: `1px solid ${COLORS.BORDER.GOLD}`,
    },
    "& .MuiTabs-indicator": {
      display: "none",
    },
  } as SxProps<Theme>,

  transactionsLoadingContainer: {
    display: "flex",
    justifyContent: "center",
    py: 4,
  } as SxProps<Theme>,

  transactionsTableContainer: {
    maxHeight: 400,
    overflow: "auto",
  } as SxProps<Theme>,

  table: {
    "& th, & td": {
      borderColor: "rgba(212, 175, 55, 0.2)",
      color: "#f5e6d3",
    },
    "& th": {
      fontWeight: 600,
      fontSize: 13,
      backgroundColor: "rgba(31, 19, 9, 0.4)",
      color: "rgba(245, 230, 211, 0.9)",
    },
    "& tbody tr:hover": {
      backgroundColor: "rgba(212, 175, 55, 0.1)",
    },
  } as SxProps<Theme>,

  tableRow: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "rgba(212, 175, 55, 0.15)",
    },
  } as SxProps<Theme>,

  tableCell: {
    fontSize: 13,
  } as SxProps<Theme>,

  typeChip: (type: string) => ({
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 999,
    px: 1.5,
    bgcolor:
      type === "recharge"
        ? "rgba(212, 175, 55, 0.2)"
        : type === "prize"
        ? "rgba(76, 175, 80, 0.2)"
        : "rgba(31, 19, 9, 0.4)",
    color:
      type === "recharge"
        ? "#d4af37"
        : type === "prize"
        ? "#4caf50"
        : "#f5e6d3",
    border:
      type === "game_entry"
        ? "1px solid rgba(212, 175, 55, 0.3)"
        : "none",
  }) as SxProps<Theme>,

  amountText: (isPositive: boolean) => ({
    color: isPositive ? "#4caf50" : "#ef5350",
    fontSize: 13,
  }) as SxProps<Theme>,

  statusChip: (status: string) => ({
    fontSize: 11,
    textTransform: "capitalize",
    borderRadius: 999,
    px: 1.6,
    bgcolor:
      status === "completed"
        ? "rgba(76, 175, 80, 0.2)"
        : status === "pending"
        ? "rgba(255, 193, 7, 0.2)"
        : "rgba(31, 19, 9, 0.4)",
    color:
      status === "completed"
        ? "#4caf50"
        : status === "pending"
        ? "#ffc107"
        : "#f5e6d3",
    border: "1px solid rgba(212, 175, 55, 0.3)",
  }) as SxProps<Theme>,

  emptyStateText: {
    color: "rgba(245, 230, 211, 0.7)",
    py: 3,
  } as SxProps<Theme>,

  emptyStateCaption: {
    color: "rgba(245, 230, 211, 0.5)",
    fontSize: 11,
  } as SxProps<Theme>,
};
