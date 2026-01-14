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
import BalanceCard from '../Components/BalanceCard';
import { getWalletByUser } from '../Services/wallets.service';
import { getWalletTransactions, type Transaction } from '../Services/transaction.service';
import { getTransactionTypes } from '../Services/transactionTypes.service';
import { getStatusByNameAndCategory } from '../Services/status.service';
import { getUserId } from '../Services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { MobilePaymentReportDialog } from '../Components/MobilePaymentReportDialog';
import { WithdrawRequestDialog } from '../Components/WithdrawRequestDialog';
import { TransactionDetailDialog } from '../Components/TransactionDetailDialog';
import { getBankAccountByUser, type BankAccount } from '../Services/bankAccounts.service';
import { getUserById } from '../Services/users.service';
import { walletPageStyles } from '../styles/walletPage.styles';
import type { TransactionDisplay, UserProfile, WalletUpdateData } from '../types/walletPage.types';
import { 
  getTransactionLabel, 
  normalizeCurrency, 
  formatCurrency, 
  formatDate,
  mapTransactionToDisplay 
} from '../utils/walletPage.utils';

const BANKS = [
  "Banco de Venezuela",
  "Banco Provincial",
  "Banesco",
  "Mercantil",
  "BOD",
  "Banco del Tesoro",
  "Bancamiga",
];

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currency, setCurrency] = useState<string>('Bs');
  const [transactionTypeMap, setTransactionTypeMap] = useState<Record<string, string>>({});
  const [transactionStatusMap, setTransactionStatusMap] = useState<Record<string, string>>({});

  const loadTransactions = async (walletId: string) => {
    const walletTransactions = await getWalletTransactions(walletId);
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

    const mappedTransactions = walletTransactions
      .map(tx => mapTransactionToDisplay(tx, typeMap, statusMap))
      .filter((tx): tx is TransactionDisplay => tx !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setTransactions(mappedTransactions);
    setAllTransactions(walletTransactions);
  };

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

        const wallet = await getWalletByUser(userId);
        setBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);
        if (wallet.currency_id && typeof wallet.currency_id === 'object' && 'code' in wallet.currency_id) {
          setCurrency(normalizeCurrency(wallet.currency_id.code));
        }
        
        await loadTransactions(wallet._id);

        try {
          const account = await getBankAccountByUser(userId);
          setBankAccount(account);
        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'response' in error) {
            const httpError = error as { response?: { status?: number } };
            if (httpError.response?.status !== 404) {
              // Error silencioso para 404
            }
          }
          setBankAccount(null);
        }

        try {
          const userData = await getUserById(userId);
          if (userData?.profile) {
            setUserProfile(userData.profile);
          }
        } catch {
          // Error silencioso
        }

      } catch {
        // Error silencioso
      } finally {
        setLoading(false);
        setTransactionsLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [userId, isAuthenticated, authLoading]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    const setupListener = async () => {
      const { onWalletUpdated } = await import("../Services/socket.service");
      const { throttle } = await import("../utils/throttle");
      
      const throttledUpdate = throttle((data: WalletUpdateData) => {
        setBalance(parseFloat(data.balance || "0") || 0);
        setFrozenBalance(parseFloat(data.frozen_balance || "0") || 0);
      }, 1000);
      
      const unsubscribe = onWalletUpdated((data: WalletUpdateData) => {
        throttledUpdate(data);
      });

      return unsubscribe;
    };

    let unsubscribe: (() => void) | null = null;
    setupListener().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
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

  const handleTransactionClick = (transactionId: string) => {
    const fullTransaction = allTransactions.find(tx => tx._id === transactionId);
    if (fullTransaction) {
      setSelectedTransaction(fullTransaction);
      setOpenTransactionDetail(true);
    }
  };

  const handleSubmitReport = async () => {
    if (userId) {
      try {
        const wallet = await getWalletByUser(userId);
        setBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);
        await loadTransactions(wallet._id);
      } catch {
        // Error silencioso
      }
    }
    setOpenReport(false);
  };

  const handleSubmitWithdraw = async (_formData?: unknown) => {
    if (userId) {
      try {
        const wallet = await getWalletByUser(userId);
        setBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);
        await loadTransactions(wallet._id);

        try {
          const account = await getBankAccountByUser(userId);
          setBankAccount(account);
        } catch {
          setBankAccount(null);
        }
      } catch {
        // Error silencioso
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
    } catch {
      // Error silencioso
    }
  };

  const availableBalance = Math.max(0, balance - frozenBalance);

  if (authLoading || loading) {
    return (
      <Box sx={walletPageStyles.loadingContainer}>
        <CircularProgress sx={walletPageStyles.loadingProgress} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box sx={walletPageStyles.notAuthenticatedContainer}>
        <Typography variant="h5" sx={walletPageStyles.notAuthenticatedText}>
          Debes iniciar sesión para ver tu wallet
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/login')}
          sx={walletPageStyles.loginButton}
        >
          Iniciar sesión
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={walletPageStyles.pageContainer}>
      <Container maxWidth="sm" sx={walletPageStyles.container}>
        <Box sx={walletPageStyles.headerContainer}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={walletPageStyles.headerTitle}
          >
            Wallet Bingo PAO
          </Typography>
          <Typography
            variant="subtitle1"
            sx={walletPageStyles.headerSubtitle}
          >
            Administra tu saldo, recargas, retiros y movimientos.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} sx={walletPageStyles.balanceStack}>
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
            sx={walletPageStyles.rechargeButton}
          >
            Recargar saldo
          </Button>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<ArrowUpwardIcon />}
            onClick={() => setOpenWithdraw(true)}
            sx={walletPageStyles.withdrawButton}
          >
            Solicitar retiro
          </Button>
        </Stack>

        <Card
          className="glass-effect"
          sx={walletPageStyles.transactionsCard}
        >
          <Box sx={walletPageStyles.transactionsHeader}>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={walletPageStyles.transactionsTitle}
            >
              Movimientos
            </Typography>
            <Typography
              variant="body2"
              sx={walletPageStyles.transactionsSubtitle}
            >
              Historial de recargas, retiros, premios y entradas a salas
            </Typography>
          </Box>

          <Box sx={walletPageStyles.tabsContainer}>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={walletPageStyles.tabs}
            >
              <Tab label="Todos" />
              <Tab label="Retiros" />
              <Tab label="Recargas" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 0 }}>
            {transactionsLoading ? (
              <Box sx={walletPageStyles.transactionsLoadingContainer}>
                <CircularProgress sx={walletPageStyles.loadingProgress} />
              </Box>
            ) : (
              <Box sx={walletPageStyles.transactionsTableContainer}>
                <Table
                  size="small"
                  sx={walletPageStyles.table}
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
                        sx={walletPageStyles.tableRow}
                      >
                        <TableCell sx={walletPageStyles.tableCell}>
                          {formatDate(tx.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tx.typeLabel}
                            size="small"
                            sx={walletPageStyles.typeChip(tx.type)}
                          />
                        </TableCell>
                        <TableCell sx={walletPageStyles.tableCell}>
                          {tx.description}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={walletPageStyles.amountText(tx.amount >= 0)}
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
                              sx={walletPageStyles.statusChip(tx.status)}
                            />
                          ) : (
                            <Typography
                              variant="caption"
                              sx={walletPageStyles.emptyStateCaption}
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
                            sx={walletPageStyles.emptyStateText}
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
        userId={userId || ""}
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
