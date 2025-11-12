// src/components/Header.tsx
import * as React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Stack,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material";
// Si NO instalaste icons, borra estas dos líneas y cambia IconButton por un Button "Menú"
import MenuIcon from "@mui/icons-material/Menu";
import CasinoIcon from "@mui/icons-material/Casino";

export type HeaderLink = {
  label: string;
  to: string;
};

type HeaderProps = {
  /** Título en el AppBar */
  title?: string;
  /** Arreglo de links para navegar */
  links?: HeaderLink[];
  /** Callback para navegar (ej: usando react-router-dom navigate) */
  onNavigate?: (to: string) => void;
  /** Texto del botón derecho (opcional) */
  actionLabel?: string;
  /** Acción del botón derecho (opcional) */
  onActionClick?: () => void;
  /** Cantidad de salas (opcional) */
  roomCount?: number;
};

const Header: React.FC<HeaderProps> = ({
  title = "Bingo Pao",
  links = [{ label: "Inicio", to: "/" }],
  onNavigate,
  actionLabel,
  onActionClick,
  roomCount,
}) => {
  const [menuEl, setMenuEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(menuEl);

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    setMenuEl(e.currentTarget);
  };
  const handleCloseMenu = () => setMenuEl(null);

  const handleNavigate = (to: string) => {
    handleCloseMenu();
    onNavigate?.(to);
  };

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar sx={{ gap: 1 }}>
        {/* Izquierda: logo / icono / título */}
        <CasinoIcon sx={{ display: { xs: "none", sm: "inline-flex" } }} />
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 700 }}
        >
          {title}
        </Typography>

        {/* Chip opcional con cantidad de salas */}
        {typeof roomCount === "number" && (
          <Chip
            size="small"
            color="secondary"
            label={`Salas: ${roomCount}`}
            sx={{ mr: 1, display: { xs: "none", sm: "inline-flex" } }}
          />
        )}

        {/* Links en escritorio */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", display: { xs: "none", md: "flex" } }}
        >
          {links.map((l) => (
            <Button
              key={l.to}
              color="inherit"
              onClick={() => handleNavigate(l.to)}
            >
              {l.label}
            </Button>
          ))}
        </Stack>

        {/* Botón de acción a la derecha (opcional) */}
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

        {/* Menú móvil */}
        <Box sx={{ display: { xs: "inline-flex", md: "none" } }}>
          <IconButton color="inherit" onClick={handleOpenMenu} aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={menuEl} open={open} onClose={handleCloseMenu}>
            {typeof roomCount === "number" && (
              <MenuItem disabled>Salas: {roomCount}</MenuItem>
            )}
            {links.map((l) => (
              <MenuItem key={l.to} onClick={() => handleNavigate(l.to)}>
                {l.label}
              </MenuItem>
            ))}
            {actionLabel && (
              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  onActionClick?.();
                }}
              >
                {actionLabel}
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
