import { Card, CardContent, Typography, Box } from "@mui/material";

type BalanceCardProps = {
  title: string;
  amount: number;
  currency: string;
  subtitle: string;
  variant?: "gold" | "glass";
};

export default function BalanceCard({
  title,
  amount,
  currency,
  subtitle,
  variant = "glass",
}: BalanceCardProps) {
  const isGold = variant === "gold";

  return (
    <Card
      className={isGold ? "gold-metallic" : "glass-effect"}
      sx={{
        flex: 1,
        borderRadius: "16px",
        border: isGold ? "2px solid rgba(212, 175, 55, 0.4)" : "none",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: isGold ? "2px" : "1px",
          background: isGold
            ? "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)"
            : "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent)",
          zIndex: 1,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 600,
            mb: 1,
            textShadow: isGold ? "0 1px 2px rgba(0, 0, 0, 0.2)" : "none",
          }}
        >
          {title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.5 }}>
          <Typography
            variant="h5"
            sx={{
              color: "#ffffff",
              fontSize: { xs: "20px", sm: "24px" },
              fontWeight: 700,
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
              lineHeight: 1,
            }}
          >
            {amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: { xs: "14px", sm: "16px" },
              fontWeight: 600,
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
              lineHeight: 1,
            }}
          >
            {currency}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: "#ffffff",
            fontSize: "12px",
            opacity: isGold ? 0.95 : 0.8,
            textShadow: isGold ? "0 1px 2px rgba(0, 0, 0, 0.2)" : "none",
          }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

