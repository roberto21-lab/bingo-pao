// src/pages/WalletPage.tsx
import React, { useState, useMemo } from 'react';
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Button,
    Stack,
    Chip,
    Tabs,
    Tab,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import PaidIcon from '@mui/icons-material/Paid';

type TransactionType = 'recharge' | 'withdrawal' | 'game_entry' | 'prize';

type Transaction = {
    id: number;
    type: TransactionType;
    amount: number;
    description: string;
    status?: string;
    createdAt: string;
};

type BankAccount = {
    id: number;
    bankName: string;
    accountNumber: string;
    alias: string;
};

const mockUser = {
    name: 'Roberto',
    balance: 12500.0,
    frozenBalance: 1500.0,
};

const mockBankAccounts: BankAccount[] = [
    {
        id: 1,
        bankName: 'Banco de Venezuela',
        accountNumber: '0102-1234-56-1234567890',
        alias: 'Principal',
    },
    {
        id: 2,
        bankName: 'BNC',
        accountNumber: '0191-9876-54-0987654321',
        alias: 'Secundaria',
    },
];

const mockTransactions: Transaction[] = [
    {
        id: 1,
        type: 'recharge',
        amount: 5000,
        description: 'Recarga por pago móvil',
        status: 'accepted',
        createdAt: '2025-11-15 14:30',
    },
    {
        id: 2,
        type: 'game_entry',
        amount: -100,
        description: 'Compra de cartón Sala “VIP 8PM”',
        createdAt: '2025-11-15 20:00',
    },
    {
        id: 3,
        type: 'prize',
        amount: 800,
        description: 'Premio ronda 2 Sala “VIP 8PM”',
        createdAt: '2025-11-15 20:45',
    },
    {
        id: 4,
        type: 'withdrawal',
        amount: -3000,
        description: 'Retiro a cuenta BNC',
        status: 'processing',
        createdAt: '2025-11-16 10:10',
    },
];

const getTransactionLabel = (type: TransactionType) => {
    switch (type) {
        case 'recharge':
            return 'Recarga';
        case 'withdrawal':
            return 'Retiro';
        case 'game_entry':
            return 'Entrada a juego';
        case 'prize':
            return 'Premio';
        default:
            return type;
    }
};

const getTransactionColor = (type: TransactionType) => {
    switch (type) {
        case 'recharge':
            return 'success';
        case 'withdrawal':
            return 'warning';
        case 'game_entry':
            return 'default';
        case 'prize':
            return 'primary';
        default:
            return 'default';
    }
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2,
    }).format(amount);

const WalletPage: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

    const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | ''>(
        mockBankAccounts[0]?.id ?? ''
    );
    const [withdrawAmount, setWithdrawAmount] = useState<string>('');

    // Comisión fija de ejemplo (10%)
    const commissionPercent = 10;

    const commissionAmount = useMemo(() => {
        const amount = parseFloat(withdrawAmount || '0');
        if (Number.isNaN(amount)) return 0;
        return (amount * commissionPercent) / 100;
    }, [withdrawAmount]);

    const finalAmount = useMemo(() => {
        const amount = parseFloat(withdrawAmount || '0');
        if (Number.isNaN(amount)) return 0;
        return Math.max(amount - commissionAmount, 0);
    }, [withdrawAmount, commissionAmount]);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    const handleOpenWithdrawDialog = () => {
        setWithdrawDialogOpen(true);
    };

    const handleCloseWithdrawDialog = () => {
        setWithdrawDialogOpen(false);
        setWithdrawAmount('');
    };

    const handleSubmitWithdraw = () => {
        // Aquí luego llamas a tu API / backend
        console.log('Solicitar retiro:', {
            bankAccountId: selectedBankAccountId,
            amount: withdrawAmount,
            commissionPercent,
            commissionAmount,
            finalAmount,
        });

        // Aquí podrías mostrar snackbar, etc.
        handleCloseWithdrawDialog();
    };

    const filteredTransactions = useMemo(() => {
        if (tab === 0) {
            // Todos
            return mockTransactions;
        }
        if (tab === 1) {
            // Solo retiros
            return mockTransactions.filter((t) => t.type === 'withdrawal');
        }
        if (tab === 2) {
            // Solo recargas
            return mockTransactions.filter((t) => t.type === 'recharge');
        }
        return mockTransactions;
    }, [tab]);

 return (
  <Box
    sx={{
      minHeight: '80vh',
      display: 'flex',
      justifyContent: 'center',
    //   bgcolor: '#050304', // fondo sólido oscuro
      py: 4,
    }}
  >
    <Box sx={{ width: '100%', maxWidth: 430, px: 2 }}>
      {/* Header / Título */}
      <Box mb={3}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ color: '#FFFFFF' }}
        >
          Wallet Bingo PAO
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ color: '#D9D9D9' }}
        >
          Administra tu saldo, recargas, retiros y movimientos.
        </Typography>
      </Box>

      {/* TARJETA DORADA */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          p: 0,
          bgcolor: 'transparent',
          boxShadow: 'none',
        }}
      >
        <CardContent
          sx={{
            position: 'relative',
            borderRadius: 4,
            overflow: 'hidden',
            p: 3,
            background:
              'linear-gradient(135deg, #FFE082 0%, #FFC107 40%, #FFB300 65%, #D38A1C 100%)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.65)',
            color: '#fff',
          }}
        >
          {/* Borde dorado suave tipo tarjeta */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: 4,
              border: '1px solid #FFF3E0',
              boxShadow: '0 0 0 1px #8C5A0F inset',
              pointerEvents: 'none',
            }}
          />

          {/* Brillo diagonal */}
          <Box
            sx={{
              position: 'absolute',
              top: '-40%',
              left: '-10%',
              width: '80%',
              height: '140%',
              background:
                'radial-gradient(circle at top, rgba(255,255,255,0.75) 0%, transparent 55%)',
              pointerEvents: 'none',
            }}
          />

          {/* Contenido real de la tarjeta */}
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Header tarjeta */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: '#5D450B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccountBalanceWalletIcon
                    sx={{ fontSize: 20, color: '#FFFDE7' }}
                  />
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#FFF8E1' }}
                  >
                    Mi saldo
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ color: '#FFFFFF' }}
                  >
                    {mockUser.name}
                  </Typography>
                </Box>
              </Stack>

              {/* “Logo” tipo Mastercard (dos círculos) */}
              <Box sx={{ display: 'flex', gap: 1.2 }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    bgcolor: '#FFFDE7',
                  }}
                />
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    bgcolor: '#FFD54F',
                  }}
                />
              </Box>
            </Stack>

            {/* Saldo disponible */}
            <Box mb={3}>
              <Typography
                variant="body2"
                sx={{ color: '#FFF8E1' }}
              >
                Saldo disponible
              </Typography>
              <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                  textShadow: '0 3px 8px rgba(0,0,0,0.6)',
                  color: '#FFFFFF',
                }}
              >
                {formatCurrency(mockUser.balance)}
              </Typography>
            </Box>

            {/* Saldo congelado + retiros en proceso */}
            <Stack direction="row" spacing={2} mb={3}>
              <Box
                sx={{
                  flex: 1,
                  borderRadius: 999,
                  px: 2,
                  py: 1.2,
                  bgcolor: '#B17C22',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.4,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#FBE9E7' }}
                >
                  Saldo congelado
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: '#FFFFFF' }}
                >
                  {formatCurrency(mockUser.frozenBalance)}
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  borderRadius: 999,
                  px: 2,
                  py: 1.2,
                  bgcolor: '#A86F1F',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.4,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#FBE9E7' }}
                >
                  Retiros en proceso
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: '#FFFFFF' }}
                >
                  {formatCurrency(3000)} {/* mock */}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Botones debajo de la tarjeta */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        mt={2}
        mb={3}
      >
        <Button
          variant="contained"
          fullWidth
          startIcon={<ArrowDownwardIcon />}
          sx={{
            background: 'linear-gradient(135deg, #00E676 0%, #00C853 100%)',
            fontWeight: 700,
            py: 1.1,
            borderRadius: 999,
            textTransform: 'none',
          }}
          onClick={() => console.log('Abrir dialog de recarga')}
        >
          Recargar saldo
        </Button>

        <Button
          variant="outlined"
          fullWidth
          startIcon={<ArrowUpwardIcon />}
          sx={{
            fontWeight: 700,
            py: 1.1,
            borderRadius: 999,
            textTransform: 'none',
            borderColor: '#FFFFFF',
            color: '#FFFFFF',
            '&:hover': {
              borderColor: '#FFFFFF',
              backgroundColor: '#1C120A',
            },
          }}
          onClick={handleOpenWithdrawDialog}
        >
          Solicitar retiro
        </Button>
      </Stack>

      {/* CARD MOVIMIENTOS */}
      <Card
        sx={{
          borderRadius: 4,
          bgcolor: '#1A0F09', // sólido, sin alpha
          boxShadow: '0 18px 40px rgba(0,0,0,0.8)',
          color: '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        {/* Título Movimientos */}
        <Box px={3} pt={3} pb={1.5}>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: '#FFFFFF' }}
          >
            Movimientos
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#E0E0E0', mt: 0.5 }}
          >
            Historial de recargas, retiros, premios y entradas a salas
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ px: 1.5, pb: 1 }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              minHeight: 0,
              '& .MuiTabs-flexContainer': {
                bgcolor: '#2B170C',
                borderRadius: 16,
              },
              '& .MuiTab-root': {
                minHeight: 0,
                py: 1.2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 14,
                color: '#F5F5F5',
              },
              '& .MuiTab-root.Mui-selected': {
                color: '#FFD54F',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#FFD54F',
                height: 3,
                borderRadius: 999,
              },
            }}
          >
            <Tab label="Todos" />
            <Tab label="Retiros" />
            <Tab label="Recargas" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 0 }}>
          <Box sx={{ maxHeight: 280, overflow: 'auto' }}>
            <Table
              size="small"
              sx={{
                '& th, & td': {
                  borderColor: '#3A2414',
                  color: '#F5F5F5',
                },
                '& th': {
                  fontWeight: 600,
                  fontSize: 13,
                  backgroundColor: '#23130B',
                  color: '#E0E0E0',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell align="right">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: '#25160C',
                      },
                    }}
                  >
                    <TableCell sx={{ fontSize: 13 }}>{tx.createdAt}</TableCell>
                    <TableCell>
                      <Chip
                        label={getTransactionLabel(tx.type)}
                        size="small"
                        sx={{
                          fontSize: 11,
                          fontWeight: 600,
                          borderRadius: 999,
                          px: 1.5,
                          bgcolor:
                            tx.type === 'recharge'
                              ? '#3E2A0A'
                              : tx.type === 'prize'
                              ? '#234224'
                              : '#2A1B10',
                          color:
                            tx.type === 'recharge'
                              ? '#FFD54F'
                              : tx.type === 'prize'
                              ? '#A5D6A7'
                              : '#FFFFFF',
                          border:
                            tx.type === 'game_entry'
                              ? '1px solid #FFFFFF'
                              : 'none',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {tx.description}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          color: tx.amount >= 0 ? '#A5D6A7' : '#EF9A9A',
                          fontSize: 13,
                        }}
                      >
                        {tx.amount >= 0
                          ? `+${formatCurrency(tx.amount)}`
                          : formatCurrency(tx.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {tx.status ? (
                        <Chip
                          label={tx.status}
                          size="small"
                          sx={{
                            fontSize: 11,
                            textTransform: 'capitalize',
                            borderRadius: 999,
                            px: 1.6,
                            bgcolor:
                              tx.status === 'accepted'
                                ? '#234424'
                                : tx.status === 'processing'
                                ? '#4E3A0A'
                                : tx.status === 'rejected'
                                ? '#4A1C1C'
                                : '#2A1B10',
                            color:
                              tx.status === 'accepted'
                                ? '#A5D6A7'
                                : tx.status === 'processing'
                                ? '#FFEB3B'
                                : tx.status === 'rejected'
                                ? '#FFCDD2'
                                : '#FFFFFF',
                            border: '1px solid #4E342E',
                          }}
                        />
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{ color: '#BDBDBD', fontSize: 11 }}
                        >
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography
                        variant="body2"
                        sx={{ color: '#E0E0E0', py: 3 }}
                      >
                        Aún no hay movimientos para mostrar.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {/* DIALOG RETIRO */}
      <Dialog
        open={withdrawDialogOpen}
        onClose={handleCloseWithdrawDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Solicitar retiro</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel id="bank-account-label">
                Cuenta bancaria
              </InputLabel>
              <Select
                labelId="bank-account-label"
                value={selectedBankAccountId}
                label="Cuenta bancaria"
                onChange={(e) =>
                  setSelectedBankAccountId(e.target.value as number)
                }
              >
                {mockBankAccounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.bankName} - {acc.alias}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Monto a retirar"
              type="number"
              fullWidth
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
              helperText={`Saldo disponible: ${formatCurrency(
                mockUser.balance
              )}`}
            />

            <Box>
              <Typography variant="body2">
                Comisión: {commissionPercent}% (
                {formatCurrency(commissionAmount)})
              </Typography>
              <Typography variant="body2">
                Monto final a recibir:{' '}
                <strong>{formatCurrency(finalAmount)}</strong>
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWithdrawDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmitWithdraw}
            disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
          >
            Enviar solicitud
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  </Box>
);

};

export default WalletPage;
