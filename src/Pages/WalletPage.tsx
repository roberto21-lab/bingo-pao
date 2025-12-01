// src/pages/WalletPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Container,
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
    Card,
    CardContent,
    CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import BalanceCard from '../Componets/BalanceCard';
import { getWalletByUser } from '../Services/wallets.service';
import { getWalletTransactions, type Transaction } from '../Services/transactionService';
import { getTransactionTypes } from '../Services/transactionTypes.service';
import { getStatusByNameAndCategory } from '../Services/status.service';
import { getUserId } from '../Services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { MobilePaymentReportDialog } from '../Componets/MobilePaymentReportDialog';
import { WithdrawRequestDialog } from '../Componets/WithdrawRequestDialog';
import { TransactionDetailDialog } from '../Componets/TransactionDetailDialog';
import { getBankAccountByUser, type BankAccount } from '../Services/bankAccounts.service';
import { getUserById } from '../Services/users.service';
import { COLORS } from '../constants/colors';

const BANKS = [
  "Banco de Venezuela",
  "Banco Provincial",
  "Banesco",
  "Mercantil",
  "BOD",
  "Banco del Tesoro",
  "Bancamiga",
];

type TransactionDisplay = {
  id: string;
  type: string;
  typeLabel: string;
  amount: number;
  description: string;
  status?: string;
  statusLabel?: string;
  createdAt: string;
};

const getTransactionLabel = (typeName: string): string => {
  const typeMap: Record<string, string> = {
    'recharge': 'Recarga',
    'withdrawal': 'Retiro',
    'withdraw': 'Retiro', // Alias por si acaso
    'game_entry': 'Entrada a juego',
    'prize': 'Premio',
    'refund': 'Reembolso',
    'unknown': 'Desconocido',
  };
  return typeMap[typeName.toLowerCase()] || 'Desconocido';
};

// Función helper para normalizar VES a Bs
const normalizeCurrency = (currencyCode?: string | null): string => {
  if (!currencyCode) return "Bs";
  const normalized = currencyCode.toLowerCase().trim();
  return normalized === "ves" ? "Bs" : currencyCode;
};

// Función para convertir amount a número (puede venir como Decimal128 o número)
const parseAmount = (amount: number | string | { $numberDecimal: string } | undefined | null): number => {
  if (typeof amount === 'number') {
    return amount;
  }
  if (typeof amount === 'string') {
    return parseFloat(amount) || 0;
  }
  if (amount && typeof amount === 'object' && '$numberDecimal' in amount) {
    // MongoDB Decimal128 formato
    return parseFloat(amount.$numberDecimal) || 0;
  }
  return 0;
};

const formatCurrency = (amount: number, currency: string = 'Bs'): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0.00 ${currency}`;
  }
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount)) + ` ${currency}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const userId = user?.id || getUserId() || null;

  const [tab, setTab] = useState(0);
  const [openReport, setOpenReport] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const [openTransactionDetail, setOpenTransactionDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [frozenBalance, setFrozenBalance] = useState(0);
  const [transactions, setTransactions] = useState<TransactionDisplay[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [userProfile, setUserProfile] = useState<{ document_type_id?: { _id: string; code: string }; document_number?: string; phone?: string } | null>(null);
  const [currency, setCurrency] = useState<string>('Bs');

  // Cargar wallet y transacciones
  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !isAuthenticated) {
        setLoading(false);
        setTransactionsLoading(false);
        return;
      }

      try {
        setLoading(true);
        setTransactionsLoading(true);

        // Cargar wallet
        const wallet = await getWalletByUser(userId);
        setBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);
        if (wallet.currency_id && typeof wallet.currency_id === 'object' && 'code' in wallet.currency_id) {
          // Normalizar VES a Bs
          setCurrency(normalizeCurrency(wallet.currency_id.code));
        }
        
        // Cargar transacciones
        const walletTransactions = await getWalletTransactions(wallet._id);
        
        // Obtener tipos de transacción y status para mapear
        const [transactionTypes, pendingStatus, completedStatus] = await Promise.all([
          getTransactionTypes(),
          getStatusByNameAndCategory('pending', 'transaction'),
          getStatusByNameAndCategory('completed', 'transaction'),
        ]);

        const statusMap: Record<string, string> = {};
        if (pendingStatus) statusMap[pendingStatus._id] = 'pending';
        if (completedStatus) statusMap[completedStatus._id] = 'completed';
        setTransactionStatusMap(statusMap);

        const typeMap: Record<string, string> = {};
        transactionTypes.forEach(t => {
          typeMap[t._id] = t.name;
        });
        setTransactionTypeMap(typeMap);

        const mappedTransactions: TransactionDisplay[] = walletTransactions.reduce<TransactionDisplay[]>((acc, tx: Transaction) => {
          // Validar que transaction_type_id y status_id existan
          if (!tx.transaction_type_id || !tx.status_id) {
            console.warn('Transacción con datos incompletos:', tx);
            return acc;
          }

          const typeId = typeof tx.transaction_type_id === 'string'
            ? tx.transaction_type_id
            : (tx.transaction_type_id as any)?._id;
          const statusId = typeof tx.status_id === 'string'
            ? tx.status_id
            : (tx.status_id as any)?._id;

          // Si no se pudo obtener el ID, saltar esta transacción
          if (!typeId || !statusId) {
            console.warn('Transacción sin IDs válidos:', tx);
            return acc;
          }

          // Obtener el nombre del tipo desde el map o desde el objeto si está poblado
          let typeName = typeMap[typeId] || 'unknown';
          if (typeName === 'unknown' && typeof tx.transaction_type_id === 'object' && (tx.transaction_type_id as any)?.name) {
            typeName = (tx.transaction_type_id as any).name;
          }
          const statusName = statusMap[statusId] || 'unknown';

          // Generar descripción basada en el tipo y metadata
          let description = getTransactionLabel(typeName);
          if (tx.metadata) {
            if (tx.metadata.bank_name) {
              description = `${getTransactionLabel(typeName)} a ${tx.metadata.bank_name}`;
            } else if (tx.metadata.room_name) {
              description = `${getTransactionLabel(typeName)} - ${tx.metadata.room_name}`;
            } else if (tx.metadata.round_number) {
              description = `${getTransactionLabel(typeName)} - Ronda ${tx.metadata.round_number}`;
            }
          }

          // Convertir amount a número
          const rawAmount = parseAmount(tx.amount);
          
          // Determinar si el monto es positivo o negativo basado en el tipo
          // Retiros y entradas a juego son negativos, recargas, premios y reembolsos son positivos
          const isPositive = typeName === 'recharge' || typeName === 'prize' || typeName === 'refund';
          const amount = isPositive ? Math.abs(rawAmount) : -Math.abs(rawAmount);

          acc.push({
            id: tx._id,
            type: typeName,
            typeLabel: getTransactionLabel(typeName),
            amount,
            description,
            status: statusName !== 'unknown' ? statusName : undefined,
            statusLabel: statusName === 'pending' ? 'Pendiente' : statusName === 'completed' ? 'Completado' : statusName === 'unknown' ? 'Desconocido' : undefined,
            createdAt: tx.created_at,
          });

          return acc;
        }, []);

        // Ordenar por fecha más reciente primero
        mappedTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setTransactions(mappedTransactions);
        setAllTransactions(walletTransactions);

        // Cargar cuenta bancaria y perfil
        try {
          const account = await getBankAccountByUser(userId);
          setBankAccount(account);
        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'response' in error) {
            const httpError = error as { response?: { status?: number } };
            if (httpError.response?.status !== 404) {
              console.error('Error al cargar cuenta bancaria:', error);
            }
          }
          setBankAccount(null);
        }

        try {
          const userData = await getUserById(userId);
          if (userData?.profile) {
            setUserProfile(userData.profile);
          }
        } catch (error) {
          console.error('Error al cargar perfil:', error);
        }

      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
        setTransactionsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [userId, isAuthenticated, authLoading]);

  // Escuchar actualizaciones de wallet en tiempo real (useEffect separado)
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    console.log("[WalletPage] 🔌 Configurando listener wallet-updated...");

    const setupListener = async () => {
      const { onWalletUpdated } = await import("../Services/socket.service");
      
      const unsubscribe = onWalletUpdated((data: any) => {
        console.log("[WalletPage] 💰 Wallet actualizado en tiempo real:", data);
        setBalance(parseFloat(data.balance) || 0);
        setFrozenBalance(parseFloat(data.frozen_balance) || 0);
      });

      return unsubscribe;
    };

    let unsubscribe: (() => void) | null = null;
    setupListener().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        console.log("[WalletPage] 🧹 Limpiando listener wallet-updated");
        unsubscribe();
      }
    };
  }, [isAuthenticated, userId]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const filteredTransactions = useMemo(() => {
    if (tab === 0) {
      return transactions;
    }
    if (tab === 1) {
      // Filtrar retiros: puede ser 'withdrawal', 'withdraw' o 'game_entry' (entradas a juegos)
      // También verificamos el typeLabel por si acaso
      return transactions.filter((t) => {
        const typeLower = t.type.toLowerCase();
        const labelLower = t.typeLabel.toLowerCase();
        return typeLower === 'withdrawal' || 
               typeLower === 'withdraw' || 
               typeLower === 'game_entry' ||
               labelLower === 'retiro' ||
               labelLower === 'entrada a juego';
      });
    }
    if (tab === 2) {
      // Filtrar recargas y premios (ambos suman al balance)
      return transactions.filter((t) => {
        const typeLower = t.type.toLowerCase();
        const labelLower = t.typeLabel.toLowerCase();
        return typeLower === 'recharge' || 
               typeLower === 'prize' ||
               labelLower === 'recarga' ||
               labelLower === 'premio';
      });
    }
    return transactions;
  }, [tab, transactions]);

  const [transactionTypeMap, setTransactionTypeMap] = useState<Record<string, string>>({});
  const [transactionStatusMap, setTransactionStatusMap] = useState<Record<string, string>>({});

  const handleTransactionClick = (transactionId: string) => {
    const fullTransaction = allTransactions.find(tx => tx._id === transactionId);
    if (fullTransaction) {
      setSelectedTransaction(fullTransaction);
      setOpenTransactionDetail(true);
    }
  };

  const handleSubmitReport = async () => {
    // Recargar wallet después del reporte
    if (userId) {
      try {
        const wallet = await getWalletByUser(userId);
        setBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);
        
        // Recargar transacciones
        const walletTransactions = await getWalletTransactions(wallet._id);
        const [transactionTypes, pendingStatus, completedStatus] = await Promise.all([
          getTransactionTypes(),
          getStatusByNameAndCategory('pending', 'transaction'),
          getStatusByNameAndCategory('completed', 'transaction'),
        ]);

        const statusMap: Record<string, string> = {};
        if (pendingStatus) statusMap[pendingStatus._id] = 'pending';
        if (completedStatus) statusMap[completedStatus._id] = 'completed';
        setTransactionStatusMap(statusMap);

        const typeMap: Record<string, string> = {};
        transactionTypes.forEach(t => {
          typeMap[t._id] = t.name;
        });
        setTransactionTypeMap(typeMap);

        const mappedTransactions: TransactionDisplay[] = walletTransactions.map((tx: Transaction) => {
          const typeId = typeof tx.transaction_type_id === 'string' ? tx.transaction_type_id : tx.transaction_type_id._id;
          const statusId = typeof tx.status_id === 'string' ? tx.status_id : tx.status_id._id;
          // Obtener el nombre del tipo desde el map o desde el objeto si está poblado
          let typeName = typeMap[typeId] || 'unknown';
          if (typeName === 'unknown' && typeof tx.transaction_type_id === 'object' && tx.transaction_type_id.name) {
            typeName = tx.transaction_type_id.name;
          }
          const statusName = statusMap[statusId] || 'unknown';

          let description = getTransactionLabel(typeName);
          if (tx.metadata) {
            if (tx.metadata.bank_name) {
              description = `${getTransactionLabel(typeName)} a ${tx.metadata.bank_name}`;
            } else if (tx.metadata.room_name) {
              description = `${getTransactionLabel(typeName)} - ${tx.metadata.room_name}`;
            } else if (tx.metadata.round_number) {
              description = `${getTransactionLabel(typeName)} - Ronda ${tx.metadata.round_number}`;
            }
          }

          // Convertir amount a número
          const rawAmount = parseAmount(tx.amount);
          
          // Determinar si el monto es positivo o negativo basado en el tipo
          // Retiros y entradas a juego son negativos, recargas, premios y reembolsos son positivos
          const isPositive = typeName === 'recharge' || typeName === 'prize' || typeName === 'refund';
          const amount = isPositive ? Math.abs(rawAmount) : -Math.abs(rawAmount);

          return {
            id: tx._id,
            type: typeName,
            typeLabel: getTransactionLabel(typeName),
            amount,
            description,
            status: statusName !== 'unknown' ? statusName : undefined,
            statusLabel: statusName === 'pending' ? 'Pendiente' : statusName === 'completed' ? 'Completado' : statusName === 'unknown' ? 'Desconocido' : undefined,
            createdAt: tx.created_at,
          };
        });

        mappedTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTransactions(mappedTransactions);
        setAllTransactions(walletTransactions);
      } catch (error) {
        console.error('Error al recargar datos:', error);
      }
    }
    setOpenReport(false);
  };

  const handleSubmitWithdraw = async () => {
    // Recargar wallet después del retiro
    if (userId) {
      try {
        const wallet = await getWalletByUser(userId);
        setBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);
        
        // Recargar transacciones
        const walletTransactions = await getWalletTransactions(wallet._id);
        const [transactionTypes, pendingStatus, completedStatus] = await Promise.all([
          getTransactionTypes(),
          getStatusByNameAndCategory('pending', 'transaction'),
          getStatusByNameAndCategory('completed', 'transaction'),
        ]);

        const statusMap: Record<string, string> = {};
        if (pendingStatus) statusMap[pendingStatus._id] = 'pending';
        if (completedStatus) statusMap[completedStatus._id] = 'completed';
        setTransactionStatusMap(statusMap);

        const typeMap: Record<string, string> = {};
        transactionTypes.forEach(t => {
          typeMap[t._id] = t.name;
        });
        setTransactionTypeMap(typeMap);

        const mappedTransactions: TransactionDisplay[] = walletTransactions.map((tx: Transaction) => {
          const typeId = typeof tx.transaction_type_id === 'string' ? tx.transaction_type_id : tx.transaction_type_id._id;
          const statusId = typeof tx.status_id === 'string' ? tx.status_id : tx.status_id._id;
          // Obtener el nombre del tipo desde el map o desde el objeto si está poblado
          let typeName = typeMap[typeId] || 'unknown';
          if (typeName === 'unknown' && typeof tx.transaction_type_id === 'object' && tx.transaction_type_id.name) {
            typeName = tx.transaction_type_id.name;
          }
          const statusName = statusMap[statusId] || 'unknown';

          let description = getTransactionLabel(typeName);
          if (tx.metadata) {
            if (tx.metadata.bank_name) {
              description = `${getTransactionLabel(typeName)} a ${tx.metadata.bank_name}`;
            } else if (tx.metadata.room_name) {
              description = `${getTransactionLabel(typeName)} - ${tx.metadata.room_name}`;
            } else if (tx.metadata.round_number) {
              description = `${getTransactionLabel(typeName)} - Ronda ${tx.metadata.round_number}`;
            }
          }

          // Convertir amount a número
          const rawAmount = parseAmount(tx.amount);
          
          // Determinar si el monto es positivo o negativo basado en el tipo
          // Retiros y entradas a juego son negativos, recargas, premios y reembolsos son positivos
          const isPositive = typeName === 'recharge' || typeName === 'prize' || typeName === 'refund';
          const amount = isPositive ? Math.abs(rawAmount) : -Math.abs(rawAmount);

          return {
            id: tx._id,
            type: typeName,
            typeLabel: getTransactionLabel(typeName),
            amount,
            description,
            status: statusName !== 'unknown' ? statusName : undefined,
            statusLabel: statusName === 'pending' ? 'Pendiente' : statusName === 'completed' ? 'Completado' : statusName === 'unknown' ? 'Desconocido' : undefined,
            createdAt: tx.created_at,
          };
        });

        mappedTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTransactions(mappedTransactions);
        setAllTransactions(walletTransactions);

        // Recargar cuenta bancaria
        try {
          const account = await getBankAccountByUser(userId);
          setBankAccount(account);
        } catch (error) {
          console.error('Error al recargar cuenta bancaria:', error);
          setBankAccount(null);
        }
      } catch (error) {
        console.error('Error al recargar datos:', error);
      }
    }
    setOpenWithdraw(false);
  };

  const handleDeleteBankAccount = async () => {
    if (!bankAccount || !userId) return;
    try {
      const { deleteBankAccount } = await import('../Services/bankAccounts.service');
      await deleteBankAccount(bankAccount._id);
      setBankAccount(null);
      const wallet = await getWalletByUser(userId);
      setBalance(Math.max(0, wallet.balance || 0));
      setFrozenBalance(wallet.frozen_balance || 0);
    } catch (error) {
      console.error('Error al eliminar cuenta bancaria:', error);
    }
  };

  const availableBalance = Math.max(0, balance - frozenBalance);

  if (authLoading || loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#d4af37' }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ color: '#f5e6d3' }}>
          Debes iniciar sesión para ver tu wallet
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/login')}
          sx={{
            bgcolor: '#d4af37',
            color: '#1a1008',
            '&:hover': { bgcolor: '#b8941f' },
          }}
        >
          Iniciar sesión
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'transparent',
        color: '#f5e6d3',
        paddingBottom: '80px',
        position: 'relative',
      }}
    >
      <Container maxWidth="sm" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ color: '#f5e6d3', mb: 1 }}
          >
            Wallet Bingo PAO
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: 'rgba(245, 230, 211, 0.7)' }}
          >
            Administra tu saldo, recargas, retiros y movimientos.
          </Typography>
        </Box>

        {/* Balance Cards */}
        <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
          <BalanceCard
            title="Mi Saldo"
            amount={balance}
            currency={currency}
            subtitle="Disponible"
            variant="gold"
          />
          <BalanceCard
            title="Saldo Congelado"
            amount={frozenBalance}
            currency={currency}
            subtitle="Pendiente de retiro"
            variant="glass"
          />
        </Stack>

        {/* Action Buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          mb={4}
        >
          <Button
            variant="contained"
            fullWidth
            startIcon={<ArrowDownwardIcon />}
            onClick={() => setOpenReport(true)}
            sx={{
              background: 'linear-gradient(135deg, #00E676 0%, #00C853 100%)',
              fontWeight: 700,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #00C853 0%, #00B248 100%)',
              },
            }}
          >
            Recargar saldo
          </Button>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<ArrowUpwardIcon />}
            onClick={() => setOpenWithdraw(true)}
            sx={{
              fontWeight: 700,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              borderColor: '#d4af37',
              color: '#d4af37',
              '&:hover': {
                borderColor: '#b8941f',
                bgcolor: 'rgba(212, 175, 55, 0.1)',
              },
            }}
          >
            Solicitar retiro
          </Button>
        </Stack>

        {/* Transactions Card */}
        <Card
          className="glass-effect"
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Box px={3} pt={3} pb={1.5}>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ color: '#f5e6d3', mb: 0.5 }}
            >
              Movimientos
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(245, 230, 211, 0.7)' }}
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
                  bgcolor: 'rgba(31, 19, 9, 0.8)',
                  borderRadius: 2,
                  border: `1px solid ${COLORS.BORDER.GOLD}`,
                  gap: 0.5,
                  p: 0.5,
                },
                '& .MuiTab-root': {
                  minHeight: 0,
                  py: 1.2,
                  px: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                  color: 'rgba(245, 230, 211, 0.7)',
                  borderRadius: 1.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(212, 175, 55, 0.15)',
                    color: '#f5e6d3',
                  },
                },
                '& .MuiTab-root.Mui-selected': {
                  color: '#f5e6d3',
                  bgcolor: 'rgba(212, 175, 55, 0.25)',
                  border: `1px solid ${COLORS.BORDER.GOLD}`,
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              <Tab label="Todos" />
              <Tab label="Retiros" />
              <Tab label="Recargas" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 0 }}>
            {transactionsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#d4af37' }} />
              </Box>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table
                  size="small"
                  sx={{
                    '& th, & td': {
                      borderColor: 'rgba(212, 175, 55, 0.2)',
                      color: '#f5e6d3',
                    },
                    '& th': {
                      fontWeight: 600,
                      fontSize: 13,
                      backgroundColor: 'rgba(31, 19, 9, 0.4)',
                      color: 'rgba(245, 230, 211, 0.9)',
                    },
                    '& tbody tr:hover': {
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
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
                        onClick={() => handleTransactionClick(tx.id)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(212, 175, 55, 0.15)',
                          },
                        }}
                      >
                        <TableCell sx={{ fontSize: 13 }}>
                          {formatDate(tx.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tx.typeLabel}
                            size="small"
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              borderRadius: 999,
                              px: 1.5,
                              bgcolor:
                                tx.type === 'recharge'
                                  ? 'rgba(212, 175, 55, 0.2)'
                                  : tx.type === 'prize'
                                  ? 'rgba(76, 175, 80, 0.2)'
                                  : 'rgba(31, 19, 9, 0.4)',
                              color:
                                tx.type === 'recharge'
                                  ? '#d4af37'
                                  : tx.type === 'prize'
                                  ? '#4caf50'
                                  : '#f5e6d3',
                              border:
                                tx.type === 'game_entry'
                                  ? '1px solid rgba(212, 175, 55, 0.3)'
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
                              color: tx.amount >= 0 ? '#4caf50' : '#ef5350',
                              fontSize: 13,
                            }}
                          >
                            {tx.amount >= 0
                              ? `+${formatCurrency(Math.abs(tx.amount), currency)}`
                              : `-${formatCurrency(Math.abs(tx.amount), currency)}`}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {tx.status ? (
                            <Chip
                              label={tx.statusLabel}
                              size="small"
                              sx={{
                                fontSize: 11,
                                textTransform: 'capitalize',
                                borderRadius: 999,
                                px: 1.6,
                                bgcolor:
                                  tx.status === 'completed'
                                    ? 'rgba(76, 175, 80, 0.2)'
                                    : tx.status === 'pending'
                                    ? 'rgba(255, 193, 7, 0.2)'
                                    : 'rgba(31, 19, 9, 0.4)',
                                color:
                                  tx.status === 'completed'
                                    ? '#4caf50'
                                    : tx.status === 'pending'
                                    ? '#ffc107'
                                    : '#f5e6d3',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                              }}
                            />
                          ) : (
                            <Typography
                              variant="caption"
                              sx={{ color: 'rgba(245, 230, 211, 0.5)', fontSize: 11 }}
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
                            sx={{ color: 'rgba(245, 230, 211, 0.7)', py: 3 }}
                          >
                            Aún no hay movimientos para mostrar.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Dialogs */}
      <MobilePaymentReportDialog
        open={openReport}
        onClose={() => setOpenReport(false)}
        onSubmit={handleSubmitReport}
        error={null}
        banks={BANKS}
        currency={currency}
        accountInfo={userProfile ? {
          document_type_id: userProfile.document_type_id?._id || "",
          docId: userProfile.document_number || "",
          phone: userProfile.phone || "",
        } : undefined}
        bankAccount={bankAccount ? { bank_name: bankAccount.bank_name } : null}
      />

      <WithdrawRequestDialog
        open={openWithdraw}
        onClose={() => setOpenWithdraw(false)}
        onSubmit={handleSubmitWithdraw}
        currency={currency}
        hasBankAccount={!!bankAccount}
        bankAccount={bankAccount}
        accountInfo={userProfile ? {
          bankName: bankAccount?.bank_name || '',
          document_type_id: userProfile.document_type_id?._id,
          docId: userProfile.document_number || '',
          phone: userProfile.phone || '',
        } : undefined}
        availableBalance={availableBalance}
        onDeleteBankAccount={handleDeleteBankAccount}
      />

      <TransactionDetailDialog
        open={openTransactionDetail}
        onClose={() => {
          setOpenTransactionDetail(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        currency={currency}
        getTransactionLabel={getTransactionLabel}
        transactionTypeMap={transactionTypeMap}
        transactionStatusMap={transactionStatusMap}
      />
    </Box>
  );
};

export default WalletPage;
