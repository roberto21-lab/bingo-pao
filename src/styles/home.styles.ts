import type { SxProps, Theme } from "@mui/material";

export const homeStyles = {
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

  logoContainer: {
    textAlign: "center",
    mb: 4,
    position: "relative",
  } as SxProps<Theme>,

  logoBox: {
    mb: 3,
  } as SxProps<Theme>,

  balanceStack: {
    mb: 4,
  } as SxProps<Theme>,

  sectionContainer: {
    mb: 4,
  } as SxProps<Theme>,

  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    py: 4,
  } as SxProps<Theme>,

  loadingProgress: {
    color: "#d4af37",
  } as SxProps<Theme>,

  errorText: {
    color: "#ff6b6b",
    opacity: 0.9,
    textAlign: "center",
    py: 4,
  } as SxProps<Theme>,

  emptyStateText: {
    color: "#ffffff",
    opacity: 0.7,
    textAlign: "center",
    py: 4,
  } as SxProps<Theme>,

  roomsContainer: {
    marginTop: 0,
  } as SxProps<Theme>,

  paginationContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 1,
    mt: 2,
  } as SxProps<Theme>,

  paginationDot: (isActive: boolean) => ({
    width: isActive ? "24px" : "8px",
    height: "8px",
    borderRadius: isActive ? "4px" : "50%",
    backgroundColor: isActive ? "#d4af37" : "rgba(212, 175, 55, 0.3)",
    transition: "all 0.3s ease",
  }) as SxProps<Theme>,

  viewAllRoomsButton: {
    mt: 2,
    py: 1.5,
    borderRadius: "8px",
    textTransform: "none",
    fontSize: "14px",
    fontWeight: 600,
    color: "#ffffff",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    border: "1px solid rgba(212, 175, 55, 0.3)",
    "&:hover": {
      backgroundColor: "rgba(212, 175, 55, 0.2)",
      borderColor: "rgba(212, 175, 55, 0.5)",
    },
  } as SxProps<Theme>,

  actionButtonsStack: {
    direction: "row",
    spacing: 2,
  } as SxProps<Theme>,

  rechargeButton: {
    backfaceVisibility: "hidden",
    position: "relative",
    cursor: "pointer",
    display: "inline-block",
    whiteSpace: "nowrap",
    color: "#fff",
    fontWeight: 900,
    fontSize: "14px",
    py: 1.5,
    borderRadius: "8px",
    textTransform: "none",
    textShadow: "0px -1px 0px rgba(0,0,0,0.5), 0px 1px 2px rgba(255, 215, 0, 0.3)",
    border: "1px solid #d4af37",
    backgroundImage: `
      repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .12) 3.75%),
      repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .04) 2.25%),
      repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .18) 1.2%),
      linear-gradient(180deg, #d4af37 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #f4d03f 53%, #ffd700 75%, #d4af37 100%)
    `,
    boxShadow: `
      inset 0px 1px 0px rgba(255,255,255,0.9),
      inset 0px -1px 0px rgba(0,0,0,0.2),
      0px 1px 3px rgba(0,0,0,0.4),
      0px 4px 12px rgba(212, 175, 55, 0.4),
      0px 0px 20px rgba(255, 215, 0, 0.2)
    `,
    transition: "all 0.2s ease",
    "&:hover": {
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
    "&:active": {
      transform: "translateY(2px)",
      boxShadow: `
        inset 0px 1px 0px rgba(255,255,255,0.7),
        inset 0px -1px 0px rgba(0,0,0,0.3),
        0px 1px 2px rgba(0,0,0,0.4),
        0px 2px 8px rgba(212, 175, 55, 0.3),
        0px 0px 15px rgba(255, 215, 0, 0.15)
      `,
    },
  } as SxProps<Theme>,

  withdrawButton: {
    backfaceVisibility: "hidden",
    position: "relative",
    cursor: "pointer",
    display: "inline-block",
    whiteSpace: "nowrap",
    color: "#fff",
    fontWeight: 900,
    fontSize: "14px",
    py: 1.5,
    borderRadius: "8px",
    textTransform: "none",
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
    transition: "all 0.2s ease",
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
  } as SxProps<Theme>,
};
