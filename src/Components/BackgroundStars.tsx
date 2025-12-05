import { Box } from "@mui/material";

export default function BackgroundStars() {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `radial-gradient(2px 2px at 20% 30%, rgba(227, 191, 112, 0.3), transparent),
                            radial-gradient(2px 2px at 60% 70%, rgba(227, 191, 112, 0.2), transparent),
                            radial-gradient(1px 1px at 50% 50%, rgba(227, 191, 112, 0.4), transparent),
                            radial-gradient(1px 1px at 80% 10%, rgba(227, 191, 112, 0.3), transparent),
                            radial-gradient(2px 2px at 40% 80%, rgba(227, 191, 112, 0.2), transparent)`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
