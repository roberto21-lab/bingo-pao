// src/components/Header.tsx
import * as React from "react";
import {
  AppBar, Toolbar, Typography, Button, IconButton, Box, Stack, Chip, Menu, MenuItem, Avatar
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CasinoIcon from "@mui/icons-material/Casino";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";

export type HeaderLink = { label: string; to: string };

type HeaderProps = {
  title?: string;
  links?: HeaderLink[];
  onNavigate?: (to: string) => void;
  actionLabel?: string;
  onActionClick?: () => void;
  roomCount?: number;

  userName?: string;          // ⬅️ opcional
  balance?: number;           // ⬅️ saldo a mostrar
  currency?: "Bs" | "USD";    // ⬅️ moneda
  onWalletClick?: () => void; // ⬅️ click en el pill de saldo
};

const Header: React.FC<HeaderProps> = ({
  title = "Bingo Pao",
  links = [{ label: "Inicio", to: "/" }],
  onNavigate,
  actionLabel,
  onActionClick,
  roomCount,
  userName = "Usuario",
  balance = 0,
  currency = "Bs",
  onWalletClick,
}) => {
  const [menuEl, setMenuEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(menuEl);
  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => setMenuEl(e.currentTarget);
  const handleCloseMenu = () => setMenuEl(null);
  const handleNavigate = (to: string) => { handleCloseMenu(); onNavigate?.(to); };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        borderRadius: 2,
        mt: 1,
        mx: 1,
        background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
        boxShadow: "0 10px 24px rgba(0,0,0,.12)",
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <CasinoIcon sx={{ display: { xs: "none", sm: "inline-flex" } }} />
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: .3, flexGrow: 1 }}>
          {title}
        </Typography>

        {/* Salas (desktop) */}
        {typeof roomCount === "number" && (
          <Chip
            size="small"
            color="secondary"
            label={`Salas: ${roomCount}`}
            sx={{ mr: 1, display: { xs: "none", sm: "inline-flex" } }}
          />
        )}

        {/* Links (desktop) */}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", display: { xs: "none", md: "flex" } }}>
          {links.map((l) => (
            <Button key={l.to} color="inherit" onClick={() => handleNavigate(l.to)}>
              {l.label}
            </Button>
          ))}
        </Stack>

        {actionLabel && (
          <Button
            variant="contained"
            color="secondary"
            onClick={onActionClick}
            sx={{ ml: 1, display: { xs: "none", sm: "inline-flex" } }}
          >
            {actionLabel}
          </Button>
        )}

        {/* Pill de saldo (siempre visible) */}
        <Box
          onClick={onWalletClick}
          sx={{
            ml: 1,
            display: "inline-flex",
            alignItems: "center",
            gap: .75,
            px: 1.25,
            py: .5,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,.15)",
            backdropFilter: "blur(6px)",
            cursor: onWalletClick ? "pointer" : "default",
            "&:hover": onWalletClick ? { bgcolor: "rgba(255,255,255,.22)" } : undefined,
          }}
        >
          <AccountBalanceWalletOutlined fontSize="small" />
          <Typography variant="body2" fontWeight={700}>
            {currency} {Intl.NumberFormat().format(balance)}
          </Typography>
          <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: "rgba(255,255,255,.25)" }}>
            {userName?.[0]?.toUpperCase() ?? "U"}
          </Avatar>
        </Box>

        <Box sx={{ display: { xs: "inline-flex", md: "none" }, ml: .5 }}>
          <IconButton color="inherit" onClick={handleOpenMenu} aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={menuEl} open={open} onClose={handleCloseMenu}>
            {links.map((l) => (
              <MenuItem key={l.to} onClick={() => handleNavigate(l.to)}>{l.label}</MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
