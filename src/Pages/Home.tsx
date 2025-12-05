import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import * as React from "react";
import BingoLogo from "../Components/BingoLogo";
import BalanceCard from "../Components/BalanceCard";
import ActiveRoomCard from "../Components/ActiveRoomCard";
import SectionHeader from "../Components/SectionHeader";
import { getRooms, type Room, getUserActiveRooms } from "../Services/rooms.service";
import { getUserId } from "../Services/auth.service";
import { useAuth } from "../hooks/useAuth";
import AuthToast from "../Components/AuthToast";
import SuccessToast from "../Components/SuccessToast";
import ErrorToast from "../Components/ErrorToast";
import AvailableRoomsPreview from "../Components/AvailableRoomsPreview";
import { MobilePaymentReportDialog } from "../Components/MobilePaymentReportDialog";
import { WithdrawRequestDialog } from "../Components/WithdrawRequestDialog";
import { getWalletByUser } from "../Services/wallets.service";
import { getBankAccountByUser, createBankAccountWithWithdraw, deleteBankAccount, type BankAccount } from "../Services/bankAccounts.service";
import { getUserById } from "../Services/users.service";
import { onRoomPrizeUpdated, onRoomsReordered, joinRoom, leaveRoom } from "../Services/socket.service";
import { homeStyles } from "../styles/home.styles";
import type { ActiveRoom, UserProfile, WithdrawFormData, WalletUpdateData } from "../types/home.types";
import { mapOptimizedToActiveRoom } from "../types/home.types";
import { translateError, translateActiveRoomsError } from "../utils/errorTranslator";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeRooms, setActiveRooms] = React.useState<ActiveRoom[]>([]);
  const [availableRooms, setAvailableRooms] = React.useState<Room[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showToast, setShowToast] = React.useState(true);
  const [openReport, setOpenReport] = React.useState(false);
  const [availableBalance, setAvailableBalance] = React.useState<number>(0);
  const [frozenBalance, setFrozenBalance] = React.useState<number>(0);
  const [walletLoading, setWalletLoading] = React.useState(false);
  const [bankAccount, setBankAccount] = React.useState<BankAccount | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);

  const BANKS = [
    "Banco de Venezuela",
    "Banco Provincial",
    "Banesco",
    "Mercantil",
    "BOD",
    "Banco del Tesoro",
    "Bancamiga",
  ];
  const [currentRoomIndex, setCurrentRoomIndex] = React.useState(0);

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const userId = user?.id || getUserId() || null;

  React.useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn") === "true";
    
    if (justLoggedIn && isAuthenticated) {
    setShowToast(true);
      sessionStorage.removeItem("justLoggedIn");
    } else {
      setShowToast(false);
    }
  }, [isAuthenticated, user]);

  React.useEffect(() => {
    const fetchWallet = async () => {
      if (!userId || !isAuthenticated) {
        setAvailableBalance(0);
        setFrozenBalance(0);
        return;
      }

      try {
        setWalletLoading(true);
        const wallet = await getWalletByUser(userId);
        setAvailableBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);
      } catch {
        setAvailableBalance(0);
        setFrozenBalance(0);
      } finally {
        setWalletLoading(false);
      }
    };

    if (!authLoading) {
      fetchWallet();
    }
  }, [userId, isAuthenticated, authLoading]);

  React.useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    const setupListener = async () => {
      const { onWalletUpdated } = await import("../Services/socket.service");
      const { throttle } = await import("../utils/throttle");
      const throttledUpdate = throttle((data: WalletUpdateData) => {
        setAvailableBalance(parseFloat(data.balance || "0") || 0);
        setFrozenBalance(parseFloat(data.frozen_balance || "0") || 0);
      }, 1000);
      
      const unsubscribe = onWalletUpdated((data) => {
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

  React.useEffect(() => {
    const fetchBankAccountAndProfile = async () => {
      if (!userId || !isAuthenticated) {
        setBankAccount(null);
        setUserProfile(null);
        return;
      }

      try {
        try {
          const account = await getBankAccountByUser(userId);
          setBankAccount(account);
        } catch (error: unknown) {
          if (error && typeof error === "object" && "response" in error) {
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
      }
    };

    if (!authLoading) {
      fetchBankAccountAndProfile();
    }
  }, [userId, isAuthenticated, authLoading]);

  React.useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (isAuthenticated) {
        setAvailableRooms([]);
        return;
      }

      try {
        const rooms = await getRooms();
        const filteredRooms = rooms.filter(
          (room) => room.status === "waiting" || room.status === "in_progress"
        );
        setAvailableRooms(filteredRooms);
      } catch {
        setError("Error al cargar las salas disponibles. Por favor, intenta nuevamente.");
      }
    };

    if (!authLoading) {
      fetchAvailableRooms();
    }
  }, [isAuthenticated, authLoading]);

  const lastFetchRef = React.useRef<number>(Date.now() - 60000);
  const isFetchingRef = React.useRef<boolean>(false);

  const fetchActiveRoomsOptimized = React.useCallback(async (force: boolean = false, showLoading: boolean = false) => {
    if (!userId || !isAuthenticated) {
      setActiveRooms([]);
      if (showLoading) setLoading(false);
      return;
    }

    if (isFetchingRef.current && !force) {
      return;
    }

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    
    if (!force && timeSinceLastFetch < 30000) {
      if (showLoading) setLoading(false);
      return;
    }

    try {
      isFetchingRef.current = true;
      if (showLoading) {
        setLoading(true);
        setError(null);
      }

      const optimizedRooms = await getUserActiveRooms(userId);

      if (optimizedRooms.length === 0) {
        setActiveRooms([]);
        if (showLoading) setLoading(false);
        return;
      }

      const roomsData: ActiveRoom[] = optimizedRooms.map(mapOptimizedToActiveRoom);

      setActiveRooms(roomsData);
      setCurrentRoomIndex(0);
      lastFetchRef.current = Date.now();
    } catch (err) {
      if (showLoading) {
        const errorMessage = translateActiveRoomsError(err);
        setError(errorMessage);
      }
    } finally {
      isFetchingRef.current = false;
      if (showLoading) setLoading(false);
    }
  }, [userId, isAuthenticated]);

  const hasInitialLoadRef = React.useRef(false);
  React.useEffect(() => {
    if (!userId || !isAuthenticated || location.pathname !== "/") {
      return;
    }

    if (!hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true;
      fetchActiveRoomsOptimized(false, true);
    } else {
      fetchActiveRoomsOptimized();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isAuthenticated, location.pathname]);

  const fetchActiveRoomsRef = React.useRef(fetchActiveRoomsOptimized);
  React.useEffect(() => {
    fetchActiveRoomsRef.current = fetchActiveRoomsOptimized;
  }, [fetchActiveRoomsOptimized]);

  React.useEffect(() => {
    const handleFocus = () => {
      if (userId && isAuthenticated && location.pathname === "/") {
        fetchActiveRoomsRef.current();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [userId, isAuthenticated, location.pathname]);

  React.useEffect(() => {
    activeRooms.forEach((room) => {
      joinRoom(room.id);
    });

    availableRooms.forEach((room) => {
      joinRoom(room.id);
    });

    return () => {
      activeRooms.forEach((room) => {
        leaveRoom(room.id);
      });
      availableRooms.forEach((room) => {
        leaveRoom(room.id);
      });
    };
  }, [activeRooms, availableRooms]);

  React.useEffect(() => {
    const unsubscribePrizeUpdated = onRoomPrizeUpdated((data) => {
      setActiveRooms((prevRooms) => {
        return prevRooms.map((room) => {
          if (room.id === data.room_id) {
            return {
              ...room,
              prizeAmount: data.total_prize,
            };
          }
          return room;
        });
      });
      
      setAvailableRooms((prevRooms) => {
        return prevRooms.map((room) => {
          if (room.id === data.room_id) {
            return {
              ...room,
              estimatedPrize: data.total_prize,
              jackpot: data.total_prize,
            };
          }
          return room;
        });
      });
    });

    const unsubscribeRoomsReordered = onRoomsReordered(() => {
      if (userId && isAuthenticated) {
        fetchActiveRoomsRef.current(true);
      }
      
      if (!isAuthenticated) {
        const refreshAvailable = async () => {
          try {
            const rooms = await getRooms();
            const filteredRooms = rooms.filter((room) => room.status === "waiting" || room.status === "in_progress");
            setAvailableRooms(filteredRooms);
          } catch {
            // Error silencioso
          }
        };
        refreshAvailable();
      }
    });

    return () => {
      unsubscribePrizeUpdated();
      unsubscribeRoomsReordered();
    };
  }, [userId, isAuthenticated]);

  const handleRoomClick = (roomId: string) => {
    navigate(`/game/${roomId}`);
  };

  const handlePreviousRoom = () => {
    if (currentRoomIndex > 0) {
      setCurrentRoomIndex(currentRoomIndex - 1);
    }
  };

  const handleNextRoom = () => {
    if (currentRoomIndex < activeRooms.length - 1) {
      setCurrentRoomIndex(currentRoomIndex + 1);
    }
  };

  const hasPrevious = currentRoomIndex > 0;
  const hasNext = currentRoomIndex < activeRooms.length - 1;
  const currentRoom = activeRooms[currentRoomIndex];

  const submitReport = async () => {
    setError(null);
    
    try {
      if (userId) {
        const wallet = await getWalletByUser(userId);
        setAvailableBalance(wallet.balance || 0);
        setFrozenBalance(wallet.frozen_balance || 0);
        
        try {
          const account = await getBankAccountByUser(userId);
          setBankAccount(account);
        } catch (error: unknown) {
          if (error && typeof error === "object" && "response" in error) {
            const httpError = error as { response?: { status?: number } };
            if (httpError.response?.status !== 404) {
              // Error silencioso para 404
            }
          }
        }
      }
      
      setShowRechargeSuccessToast(true);
    } catch (error) {
      const errorMessage = translateError(error, "Error al procesar la recarga. Por favor, intenta nuevamente.");
      setRechargeErrorMessage(errorMessage);
      setShowRechargeErrorToast(true);
      throw error;
    }
  };

  const [openWithdrawRequestDialog, setOpenWithdrawRequestDialog] =
    React.useState(false);
  const [withdrawError, setWithdrawError] = React.useState<string | null>(null);
  const [showRechargeSuccessToast, setShowRechargeSuccessToast] = React.useState(false);
  const [showRechargeErrorToast, setShowRechargeErrorToast] = React.useState(false);
  const [rechargeErrorMessage, setRechargeErrorMessage] = React.useState<string>("");
  const [showWithdrawSuccessToast, setShowWithdrawSuccessToast] = React.useState(false);
  const [showWithdrawErrorToast, setShowWithdrawErrorToast] = React.useState(false);
  const [withdrawErrorMessage, setWithdrawErrorMessage] = React.useState<string>("");

  const handleSubmitWithdrawRequestDialog = async (formData: WithdrawFormData) => {
    if (!userId) {
      setWithdrawError("No se pudo identificar al usuario");
      return;
    }

    try {
      setWithdrawError(null);

      if (!bankAccount) {
        if (!userProfile?.document_type_id || !userProfile?.document_number || !userProfile?.phone) {
          setWithdrawError("Debe completar su perfil con documento y teléfono antes de retirar fondos");
          return;
        }

        const profileDocTypeId = userProfile.document_type_id._id;
        
        if (profileDocTypeId !== formData.document_type_id) {
          setWithdrawError("El tipo de documento no coincide con el registrado en su perfil");
          return;
        }

        if (userProfile.document_number !== formData.docId) {
          setWithdrawError("El número de documento no coincide con el registrado en su perfil");
          return;
        }

        if (userProfile.phone !== formData.phone) {
          setWithdrawError("El número de teléfono no coincide con el registrado en su perfil");
          return;
        }

        if (!formData.bankName) {
          setWithdrawError("Debe seleccionar un banco");
          return;
        }

        const result = await createBankAccountWithWithdraw({
          userId,
          bank_name: formData.bankName,
          account_number: "",
          phone_number: formData.phone,
          document_number: formData.docId,
          document_type_id: formData.document_type_id,
          amount: parseFloat(formData.amount)
        });

        setAvailableBalance(Math.max(0, result.new_balance || 0));
        setFrozenBalance(result.new_frozen_balance);
        setBankAccount(result.bank_account);

        const wallet = await getWalletByUser(userId);
        setAvailableBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);

        setShowWithdrawSuccessToast(true);
        setOpenWithdrawRequestDialog(false);
      } else {
        const { createWithdrawOnly } = await import("../Services/bankAccounts.service");
        const result = await createWithdrawOnly(userId, parseFloat(formData.amount));

        setAvailableBalance(Math.max(0, result.new_balance || 0));
        setFrozenBalance(result.new_frozen_balance);
        
        const wallet = await getWalletByUser(userId);
        setAvailableBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);

        setShowWithdrawSuccessToast(true);
        setOpenWithdrawRequestDialog(false);
      }
    } catch (error: unknown) {
      const errorMessage = translateError(error, "Error al procesar la solicitud de retiro. Por favor, intenta nuevamente.");
      setWithdrawError(errorMessage);
      setWithdrawErrorMessage(errorMessage);
      setShowWithdrawErrorToast(true);
    }
  };

  const handleDeleteBankAccount = async () => {
    if (!bankAccount) return;

    try {
      await deleteBankAccount(bankAccount._id);
      setBankAccount(null);
      if (userId) {
        const wallet = await getWalletByUser(userId);
        setAvailableBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);
      }
    } catch (error: unknown) {
      const errorMessage = translateError(error, "Error al eliminar la cuenta bancaria. Por favor, intenta nuevamente.");
      setWithdrawError(errorMessage);
    }
  };

  return (
    <Box sx={homeStyles.pageContainer}>
      {!authLoading && showToast && (
        <AuthToast
          isAuthenticated={isAuthenticated}
          userName={user?.full_name}
          onClose={() => setShowToast(false)}
        />
      )}

      <Container maxWidth="sm" sx={homeStyles.container}>
        <Box sx={homeStyles.logoContainer}>
          <Box sx={homeStyles.logoBox}>
            <BingoLogo size={150} />
          </Box>
        </Box>

        {isAuthenticated ? (
          <Stack direction="row" spacing={2} sx={homeStyles.balanceStack}>
            <BalanceCard
              title="Mi Saldo"
              amount={walletLoading ? 0 : availableBalance}
              currency="Bs"
              subtitle="Disponible"
              variant="gold"
            />
            <BalanceCard
              title="Saldo Congelado"
              amount={walletLoading ? 0 : frozenBalance}
              currency="Bs"
              subtitle="Pendiente por aprobar"
              variant="glass"
            />
          </Stack>
        ) : (
          <AvailableRoomsPreview rooms={availableRooms} />
        )}

        {isAuthenticated && (
          <Box sx={homeStyles.sectionContainer}>
            {!loading && !error && activeRooms.length > 0 && (
              <SectionHeader
                title="Mis Partidas"
                onPrevious={handlePreviousRoom}
                onNext={handleNextRoom}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                showNavigation={true}
              />
            )}

            {(loading || error || activeRooms.length === 0) && (
              <SectionHeader title="Mis Partidas" showNavigation={false} />
            )}

            {loading ? (
              <Box sx={homeStyles.loadingContainer}>
                <CircularProgress sx={homeStyles.loadingProgress} />
              </Box>
            ) : error ? (
              <Typography variant="body2" sx={homeStyles.errorText}>
                {error}
              </Typography>
            ) : activeRooms.length === 0 ? (
              <Typography variant="body2" sx={homeStyles.emptyStateText}>
                No se encontraron juegos activos
              </Typography>
            ) : (
              <Box sx={homeStyles.roomsContainer}>
                {currentRoom && (
                  <ActiveRoomCard
                    key={currentRoom.id}
                    room={currentRoom}
                    onClick={handleRoomClick}
                  />
                )}

                {activeRooms.length > 1 && (
                  <Box sx={homeStyles.paginationContainer}>
                    {activeRooms.map((_, index) => (
                      <Box
                        key={index}
                        sx={homeStyles.paginationDot(index === currentRoomIndex)}
                      />
                    ))}
                  </Box>
                )}

                <Button
                  fullWidth
                  onClick={() => navigate("/rooms")}
                  sx={homeStyles.viewAllRoomsButton}
                >
                  Ver todas las salas disponibles
                </Button>
              </Box>
            )}
          </Box>
        )}

        {isAuthenticated && (
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              onClick={() => setOpenReport(true)}
              sx={homeStyles.rechargeButton}
            >
              Recargar Saldo
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={homeStyles.withdrawButton}
              onClick={() => setOpenWithdrawRequestDialog(true)}
            >
              Retirar Fondos
            </Button>
          </Stack>
        )}


        <WithdrawRequestDialog
          open={openWithdrawRequestDialog}
          onClose={() => setOpenWithdrawRequestDialog(false)}
          onSubmit={handleSubmitWithdrawRequestDialog}
          error={withdrawError}
          currency="Bs"
          minAmount={500}
          accountInfo={{
            bankName: "",
            document_type_id: userProfile?.document_type_id?._id || "",
            docId: userProfile?.document_number || "",
            phone: userProfile?.phone || "",
          }}
          availableBalance={availableBalance}
          hasBankAccount={!!bankAccount}
          bankAccount={bankAccount}
          onDeleteBankAccount={handleDeleteBankAccount}
        />

        <MobilePaymentReportDialog
          open={openReport}
          onClose={() => setOpenReport(false)}
          onSubmit={submitReport}
          onError={(errorMessage) => {
            setRechargeErrorMessage(errorMessage);
            setShowRechargeErrorToast(true);
          }}
          error={error}
          banks={BANKS}
          currency="Bs"
          accountInfo={{
            document_type_id: userProfile?.document_type_id?._id || "",
            docId: userProfile?.document_number || "",
            phone: userProfile?.phone || "",
          }}
          bankAccount={bankAccount ? { bank_name: bankAccount.bank_name } : null}
        />

        {showRechargeSuccessToast && (
          <SuccessToast
            message="¡Recarga registrada exitosamente! 🎉"
            subMessage="Tu solicitud está en revisión"
            onClose={() => setShowRechargeSuccessToast(false)}
          />
        )}

        {showRechargeErrorToast && (
          <ErrorToast
            message={rechargeErrorMessage}
            onClose={() => {
              setShowRechargeErrorToast(false);
              setRechargeErrorMessage("");
            }}
          />
        )}

        {showWithdrawSuccessToast && (
          <SuccessToast
            message="¡Solicitud de retiro creada exitosamente! 🎉"
            subMessage="Tu solicitud está en revisión"
            onClose={() => setShowWithdrawSuccessToast(false)}
          />
        )}

        {showWithdrawErrorToast && (
          <ErrorToast
            message={withdrawErrorMessage}
            onClose={() => {
              setShowWithdrawErrorToast(false);
              setWithdrawErrorMessage("");
            }}
          />
        )}
      </Container>
    </Box>
  );
}
