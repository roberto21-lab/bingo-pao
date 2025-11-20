import * as React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Divider,
  Stack,
  Button,
  Box,
} from "@mui/material";

type HallProps = {
  /** Nombre visible de la sala */
  title?: string;
  /** Premio total a repartir */
  prizeAmount: number;
  /** Moneda (por defecto "Bs") */
  currency?: string;
  /** Cartones requeridos para iniciar la partida */
  ticketsToStart: number;
  /** Costo por cartón/ticket */
  ticketPrice: number;
  /** Acción al hacer click en Ver sala */
  onEnter?: () => void;
};

const formatNumber = (n: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);

const Hall: React.FC<HallProps> = ({
  title = "Sala Bingo Pao",
  prizeAmount,
  currency = "Bs",
  ticketsToStart,
  ticketPrice,
  onEnter,
}) => {
  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: 420,
        borderRadius: 2,
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <Box
            sx={{
              px: 1,
              py: 0.25,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Sala
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
        </Stack>

        <Stack spacing={1.5} mt={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography color="text.secondary">Premio a repartir</Typography>
            <Typography fontWeight={700}>
              {formatNumber(prizeAmount)} {currency}
            </Typography>
          </Stack>

          <Divider />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography color="text.secondary">Cartones para empezar</Typography>
            <Typography fontWeight={700}>{formatNumber(ticketsToStart)}</Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography color="text.secondary">Costo por cartón</Typography>
            <Typography fontWeight={700}>
              {formatNumber(ticketPrice)} {currency}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
        <Button
          variant="contained"
          onClick={onEnter}
        >
          Ver sala
        </Button>
      </CardActions>
    </Card>
  );
};

export default Hall;
