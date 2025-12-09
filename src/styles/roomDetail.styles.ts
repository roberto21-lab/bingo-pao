import type { SxProps, Theme } from "@mui/material";

export const roomDetailStyles = {
  pageContainer: {
    position: "relative" as const,
    minHeight: "100vh",
    backgroundColor: "#1a1008",
    color: "#f5e6d3",
    paddingBottom: "80px",
    overflow: "hidden",
    backgroundImage: `
      repeating-linear-gradient(
        0deg,
        #1a1008 0px,
        #1f1309 1px,
        #2a1a0f 2px,
        #1f1309 3px,
        #1a1008 4px,
        #1a1008 8px,
        #1f1309 9px,
        #2a1a0f 10px,
        #1f1309 11px,
        #1a1008 12px
      ),
      linear-gradient(
        90deg,
        #1a1008 0%,
        #1f1309 15%,
        #2a1a0f 30%,
        #1f1309 45%,
        #1a1008 60%,
        #1f1309 75%,
        #2a1a0f 90%,
        #1a1008 100%
      ),
      radial-gradient(ellipse 200px 50px at 25% 30%, rgba(42, 26, 15, 0.2) 0%, transparent 50%),
      radial-gradient(ellipse 150px 40px at 75% 60%, rgba(31, 19, 9, 0.25) 0%, transparent 50%)
    `,
    backgroundSize: `
      100% 16px,
      200% 100%,
      100% 100%,
      100% 100%
    `,
    "&::before": {
      content: '""',
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `
        radial-gradient(ellipse 600px 400px at 20% 30%, rgba(0, 0, 0, 0.15) 0%, transparent 60%),
        radial-gradient(ellipse 500px 350px at 80% 60%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
        radial-gradient(ellipse 400px 300px at 50% 20%, rgba(0, 0, 0, 0.1) 0%, transparent 60%),
        radial-gradient(ellipse 350px 250px at 15% 70%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
        radial-gradient(ellipse 450px 320px at 70% 15%, rgba(0, 0, 0, 0.1) 0%, transparent 60%)
      `,
      backdropFilter: "blur(8px) saturate(120%)",
      WebkitBackdropFilter: "blur(8px) saturate(120%)",
      pointerEvents: "none" as const,
      zIndex: 0,
    },
  } as SxProps<Theme>,

  loadingContainer: {
    minHeight: "100vh",
    backgroundColor: "#1a1008",
    color: "#f5e6d3",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: "80px",
    position: "relative",
    overflow: "hidden",
  } as SxProps<Theme>,

  errorContainer: {
    minHeight: "100vh",
    backgroundColor: "#1a1008",
    color: "#f5e6d3",
    paddingBottom: "80px",
    position: "relative",
    overflow: "hidden",
  } as SxProps<Theme>,

  container: {
    pt: "80px",
    pb: 4,
    position: "relative",
    zIndex: 1,
  } as SxProps<Theme>,

  errorAlert: {
    backgroundColor: "rgba(201, 168, 90, 0.2)",
    color: "#c9a85a",
    border: "1px solid rgba(201, 168, 90, 0.4)",
  } as SxProps<Theme>,

  enrollingOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "all" as const,
  } as SxProps<Theme>,

  enrollingModal: {
    backgroundColor: "rgba(26, 16, 8, 0.95)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "2px solid rgba(212, 175, 55, 0.5)",
    borderRadius: "16px",
    padding: 4,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
  } as SxProps<Theme>,

  enrollingProgress: {
    color: "#d4af37",
  } as SxProps<Theme>,

  enrollingTitle: {
    color: "#f5e6d3",
    fontWeight: 700,
    textAlign: "center",
    fontFamily: "'Montserrat', sans-serif",
  } as SxProps<Theme>,

  enrollingSubtitle: {
    color: "#d4af37",
    textAlign: "center",
    fontFamily: "'Montserrat', sans-serif",
  } as SxProps<Theme>,

  roomTitleBar: {
    position: "absolute" as const,
    left: 0,
    top: "63px",
    display: "inline-flex",
    alignItems: "center",
    px: 2,
    py: 1,
    borderTopRightRadius: "8px",
    borderBottomRightRadius: "8px",
    background:
      "linear-gradient(135deg, rgba(212, 175, 55, 0.9) 0%, rgba(244, 208, 63, 1) 50%, rgba(212, 175, 55, 0.9) 100%)",
    border: "1.5px solid rgba(212, 175, 55, 1)",
    borderLeft: "none",
    boxShadow: "0 2px 8px rgba(212, 175, 55, 0.5)",
    zIndex: 2,
  } as SxProps<Theme>,

  roomTitleText: {
    fontSize: { xs: "22px", sm: "26px" },
    fontWeight: 700,
    color: "#1a1008",
    fontFamily: "'Montserrat', sans-serif",
    letterSpacing: "0.5px",
  } as SxProps<Theme>,

  titleContainer: {
    position: "relative",
    display: "flex",
    // Responsive: columna en móvil, fila en pantallas más grandes
    flexDirection: { xs: "column", sm: "row" },
    alignItems: { xs: "flex-start", sm: "flex-start" },
    justifyContent: { xs: "flex-start", sm: "space-between" },
    gap: { xs: 1.5, sm: 0 },
  } as SxProps<Theme>,

  titleBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    lineHeight: 1.2,
  } as SxProps<Theme>,

  titleText: {
    fontSize: { xs: "20px", sm: "24px" },
    fontWeight: 900,
    background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontFamily: "'Montserrat', sans-serif",
    textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
    letterSpacing: "0.5px",
    lineHeight: 1.2,
  } as SxProps<Theme>,

  subtitleText: {
    fontSize: { xs: "18px", sm: "20px" },
    fontWeight: 900,
    background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontFamily: "'Montserrat', sans-serif",
    textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
    letterSpacing: "0.5px",
    lineHeight: 1.2,
  } as SxProps<Theme>,

  priceText: {
    color: "#f5e6d3",
    opacity: 0.85,
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    fontFamily: "'Montserrat', sans-serif",
  } as SxProps<Theme>,

  emptyState: {
    textAlign: "center",
    py: 4,
    px: 2,
  } as SxProps<Theme>,

  emptyStateText: {
    color: "#f5e6d3",
    opacity: 0.7,
  } as SxProps<Theme>,

  cardsContainer: {
    mb: 4,
    px: 2,
    py: 2,
  } as SxProps<Theme>,

  cardsGrid: {
    display: "grid",
    // auto-fit: crea tantas columnas como quepan
    // minmax(120px, 1fr): mínimo 120px por cartón, máximo 1fr
    // Esto garantiza: 2 columnas en ~280px, 3 en ~400px, 4 en ~520px, etc.
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    overflowY: "auto",
    overflowX: "hidden",
    maxHeight: "500px",
    gap: 2,
    py: 2,
  } as SxProps<Theme>,

  buttonContainer: {
    mt: 2,
    pt: 2,
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  } as SxProps<Theme>,

  termsLink: {
    marginTop: "1rem",
    display: "block",
    textAlign: "center",
    color: "#e3bf70",
    fontSize: "12px",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  } as SxProps<Theme>,
};
