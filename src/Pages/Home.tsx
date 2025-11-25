import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import * as React from "react";
import BingoLogo from "../Componets/BingoLogo";
import BalanceCard from "../Componets/BalanceCard";
import ActiveRoomCard from "../Componets/ActiveRoomCard";
import SectionHeader from "../Componets/SectionHeader";
import { getUserRooms } from "../Services/cards.service";
import { getRoomById, getRooms, type Room } from "../Services/rooms.service";
import { getRoomRounds } from "../Services/rounds.service";
import { getUserId } from "../Services/auth.service";
import { useAuth } from "../hooks/useAuth";
import AuthToast from "../Componets/AuthToast";
import AvailableRoomsPreview from "../Componets/AvailableRoomsPreview";
import { MobilePaymentReportDialog } from "../Componets/MobilePaymentReportDialog";
import { WithdrawRequestDialog } from "../Componets/WithdrawRequestDialog";
import { getWalletByUser } from "../Services/wallets.service";
import { getBankAccountByUser, createBankAccountWithWithdraw, deleteBankAccount, type BankAccount } from "../Services/bankAccounts.service";
import { getUserById } from "../Services/users.service";

type ActiveRoom = {
  id: string;
  title: string;
  status: "active" | "waiting" | "finished";
  prizeAmount: number;
  currency: string;
  currentRound?: number; // Número de ronda actual si la sala no está finalizada
  currentPattern?: string; // Pattern de la ronda actual si la sala está activa
};

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
  const [userProfile, setUserProfile] = React.useState<{ document_type_id?: { _id: string; code: string }; document_number?: string; phone?: string } | null>(null);

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

  // Obtener información del usuario autenticado
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const userId = user?.id || getUserId() || null;

  // Mostrar toast cuando cambia el estado de autenticación
  React.useEffect(() => {
    setShowToast(true);
  }, [isAuthenticated, user]);

  // Cargar wallet del usuario cuando esté autenticado
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
        // El balance ya está reducido por retiros pendientes en el backend
        // El balance disponible es simplemente el balance (ya incluye la reducción de retiros pendientes)
        setAvailableBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);
      } catch (error) {
        console.error("Error al cargar wallet:", error);
        // Si no hay wallet, mantener valores en 0
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

  // Cargar cuenta bancaria y perfil del usuario
  React.useEffect(() => {
    const fetchBankAccountAndProfile = async () => {
      if (!userId || !isAuthenticated) {
        setBankAccount(null);
        setUserProfile(null);
        return;
      }

      try {
        // Cargar cuenta bancaria
        try {
          const account = await getBankAccountByUser(userId);
          setBankAccount(account);
        } catch (error: unknown) {
          if (error && typeof error === "object" && "response" in error) {
            const httpError = error as { response?: { status?: number } };
            if (httpError.response?.status !== 404) {
              console.error("Error al cargar cuenta bancaria:", error);
            }
          } else {
            console.error("Error al cargar cuenta bancaria:", error);
          }
          setBankAccount(null);
        }

        // Cargar perfil del usuario
        try {
          const userData = await getUserById(userId);
          if (userData?.profile) {
            setUserProfile(userData.profile);
          }
        } catch (error) {
          console.error("Error al cargar perfil:", error);
        }
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
      }
    };

    if (!authLoading) {
      fetchBankAccountAndProfile();
    }
  }, [userId, isAuthenticated, authLoading]);

  // Cargar salas disponibles cuando no hay usuario logueado
  React.useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (isAuthenticated) {
        setAvailableRooms([]);
        return;
      }

      try {
        const rooms = await getRooms();
        // Filtrar solo las salas que están esperando jugadores o en progreso
        const filteredRooms = rooms.filter(
          (room) => room.status === "waiting" || room.status === "in_progress"
        );
        setAvailableRooms(filteredRooms);
      } catch {
        setError("Error al cargar salas disponibles");
      }
    };

    if (!authLoading) {
      fetchAvailableRooms();
    }
  }, [isAuthenticated, authLoading]);

  // Cargar partidas activas del usuario
  React.useEffect(() => {
    const fetchActiveRooms = async () => {
      // Solo cargar si hay usuario autenticado
      if (!userId || !isAuthenticated) {
        setActiveRooms([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Obtener todas las rooms en las que el usuario tiene cartones
        const roomIds = await getUserRooms(userId);
        console.log("🔍 Room IDs obtenidos:", roomIds);

        if (roomIds.length === 0) {
          console.log("⚠️ No se encontraron salas para el usuario");
          setActiveRooms([]);
          setLoading(false);
          return;
        }

        // Para cada room, obtener su información y determinar el estado
        const roomsData: (ActiveRoom | null)[] = await Promise.all(
          roomIds.map(async (roomId) => {
            try {
              // Obtener información de la room
              const room: Room = await getRoomById(roomId);

              // Obtener rounds para determinar el estado
              const rounds = await getRoomRounds(roomId);

              // Determinar el estado basado en los rounds
              let status: "active" | "waiting" | "finished" = "waiting";
              let currentRound: number | undefined = undefined;
              let currentPattern: string | undefined = undefined;

              if (rounds.length > 0) {
                // Buscar si hay algún round en progreso o en countdown (starting)
                const activeRound = rounds.find((round) => {
                  const statusObj =
                    typeof round.status_id === "object" && round.status_id
                      ? round.status_id
                      : null;
                  return statusObj?.name === "in_progress" || statusObj?.name === "starting";
                });

                // Buscar si todos los rounds están finalizados
                const allFinished = rounds.every((round) => {
                  const statusObj =
                    typeof round.status_id === "object" && round.status_id
                      ? round.status_id
                      : null;
                  return statusObj?.name === "finished";
                });

                if (activeRound) {
                  status = "active";
                  currentRound = activeRound.round_number;
                  // Obtener el pattern de la ronda activa (starting o in_progress)
                  if (activeRound.pattern_id) {
                    if (typeof activeRound.pattern_id === "object" && "name" in activeRound.pattern_id) {
                      currentPattern = activeRound.pattern_id.name;
                    }
                  }
                } else if (allFinished) {
                  status = "finished";
                } else {
                  status = "waiting";
                  // Si hay rounds pero ninguno en progreso, mostrar el último round creado
                  const sortedRounds = [...rounds].sort(
                    (a, b) => b.round_number - a.round_number
                  );
                  if (sortedRounds.length > 0) {
                    currentRound = sortedRounds[0].round_number;
                  }
                }
              } else {
                // Si no hay rounds, la room está esperando
                status = "waiting";
              }

              return {
                id: room.id,
                title: room.title,
                status,
                prizeAmount: room.estimatedPrize || room.jackpot || 0,
                currency: room.currency,
                currentRound,
                currentPattern,
              };
            } catch {
              return null;
            }
          })
        );

        // Filtrar nulls y ordenar: active primero, luego waiting, luego finished
        const validRooms = roomsData
          .filter((room): room is ActiveRoom => room !== null)
          .sort((a, b) => {
            const order = { active: 0, waiting: 1, finished: 2 };
            return order[a.status] - order[b.status];
          });

        console.log("✅ Salas válidas encontradas:", validRooms);
        setActiveRooms(validRooms);
        setCurrentRoomIndex(0); // Resetear al índice inicial cuando se cargan las salas
      } catch (err) {
        console.error("❌ Error al cargar partidas activas:", err);
        const errorMessage =
          err && typeof err === "object" && "message" in err
            ? String(err.message)
            : "Error al cargar las partidas activas. Por favor, intenta nuevamente.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveRooms();
  }, [userId, isAuthenticated]);

  // Refrescar salas activas cuando el usuario navega de vuelta al Home
  React.useEffect(() => {
    if (userId && isAuthenticated && location.pathname === "/") {
      const fetchActiveRooms = async () => {
        try {
          const roomIds = await getUserRooms(userId);

          if (roomIds.length === 0) {
            setActiveRooms([]);
            return;
          }

          // Para cada room, obtener su información y determinar el estado
          const roomsData: (ActiveRoom | null)[] = await Promise.all(
            roomIds.map(async (roomId) => {
              try {
                // Obtener información de la room
                const room: Room = await getRoomById(roomId);

                // Obtener rounds para determinar el estado
                const rounds = await getRoomRounds(roomId);

                // CRÍTICO: Usar el status real de la sala, no inferirlo de los rounds
                // Esto asegura que todas las páginas muestren el mismo status
                let status: "active" | "waiting" | "finished" = "waiting";
                const roomStatus = room.status;
                
                if (roomStatus === "in_progress" || roomStatus === "preparing") {
                  status = "active";
                } else if (roomStatus === "locked") {
                  status = "finished";
                } else {
                  status = "waiting";
                }

                let currentRound: number | undefined = undefined;
                let currentPattern: string | undefined = undefined;

                if (rounds.length > 0) {
                  // Buscar si hay algún round en progreso o en countdown (starting)
                  const activeRound = rounds.find((round) => {
                    const statusObj =
                      typeof round.status_id === "object" && round.status_id
                        ? round.status_id
                        : null;
                    return statusObj?.name === "in_progress" || statusObj?.name === "starting";
                  });

                  if (activeRound) {
                    currentRound = activeRound.round_number;
                    // Obtener el pattern de la ronda activa (starting o in_progress)
                    if (activeRound.pattern_id) {
                      if (typeof activeRound.pattern_id === "object" && "name" in activeRound.pattern_id) {
                        currentPattern = activeRound.pattern_id.name;
                      }
                    }
                  } else {
                    // Si hay rounds pero ninguno en progreso, mostrar el último round creado
                    const sortedRounds = [...rounds].sort(
                      (a, b) => b.round_number - a.round_number
                    );
                    if (sortedRounds.length > 0) {
                      currentRound = sortedRounds[0].round_number;
                    }
                  }
                }

                return {
                  id: room.id,
                  title: room.title,
                  status,
                  prizeAmount: room.estimatedPrize || room.jackpot || 0,
                  currency: room.currency,
                  currentRound,
                  currentPattern,
                };
              } catch {
                return null;
              }
            })
          );

          // Filtrar nulls y ordenar: active primero, luego waiting, luego finished
          const validRooms = roomsData
            .filter((room): room is ActiveRoom => room !== null)
            .sort((a, b) => {
              const order = { active: 0, waiting: 1, finished: 2 };
              return order[a.status] - order[b.status];
            });

          setActiveRooms(validRooms);
          setCurrentRoomIndex(0); // Resetear al índice inicial cuando se refrescan las salas
        } catch (err) {
          console.error("Error al refrescar salas activas:", err);
        }
      };

      fetchActiveRooms();
    }
  }, [location.pathname, userId, isAuthenticated]);

  // Refrescar salas activas cuando el usuario vuelve a la página
  React.useEffect(() => {
    const handleFocus = () => {
      if (userId && isAuthenticated) {
        // Refrescar las salas activas cuando el usuario vuelve a la página
        const fetchActiveRooms = async () => {
          try {
            const roomIds = await getUserRooms(userId);

            if (roomIds.length === 0) {
              setActiveRooms([]);
              return;
            }

            // Para cada room, obtener su información y determinar el estado
            const roomsData: (ActiveRoom | null)[] = await Promise.all(
              roomIds.map(async (roomId) => {
                try {
                  // Obtener información de la room
                  const room: Room = await getRoomById(roomId);

                  // Obtener rounds para determinar el estado
                  const rounds = await getRoomRounds(roomId);

                  // Determinar el estado basado en los rounds
                  let status: "active" | "waiting" | "finished" = "waiting";
                  let currentRound: number | undefined = undefined;
                  let currentPattern: string | undefined = undefined;

                  if (rounds.length > 0) {
                    // Buscar si hay algún round en progreso o en countdown (starting)
                    const activeRound = rounds.find((round) => {
                      const statusObj =
                        typeof round.status_id === "object" && round.status_id
                          ? round.status_id
                          : null;
                      return statusObj?.name === "in_progress" || statusObj?.name === "starting";
                    });

                    // Buscar si todos los rounds están finalizados
                    const allFinished = rounds.every((round) => {
                      const statusObj =
                        typeof round.status_id === "object" && round.status_id
                          ? round.status_id
                          : null;
                      return statusObj?.name === "finished";
                    });

                    if (activeRound) {
                      status = "active";
                      currentRound = activeRound.round_number;
                      // Obtener el pattern de la ronda activa (starting o in_progress)
                      if (activeRound.pattern_id) {
                        if (typeof activeRound.pattern_id === "object" && "name" in activeRound.pattern_id) {
                          currentPattern = activeRound.pattern_id.name;
                        }
                      }
                    } else if (allFinished) {
                      status = "finished";
                    } else {
                      status = "waiting";
                      // Si hay rounds pero ninguno en progreso, mostrar el último round creado
                      const sortedRounds = [...rounds].sort(
                        (a, b) => b.round_number - a.round_number
                      );
                      if (sortedRounds.length > 0) {
                        currentRound = sortedRounds[0].round_number;
                      }
                    }
                  } else {
                    // Si no hay rounds, la room está esperando
                    status = "waiting";
                  }

                  return {
                    id: room.id,
                    title: room.title,
                    status,
                    prizeAmount: room.estimatedPrize || room.jackpot || 0,
                    currency: room.currency,
                    currentRound,
                    currentPattern,
                  };
                } catch {
                  return null;
                }
              })
            );

            // Filtrar nulls y ordenar: active primero, luego waiting, luego finished
            const validRooms = roomsData
              .filter((room): room is ActiveRoom => room !== null)
              .sort((a, b) => {
                const order = { active: 0, waiting: 1, finished: 2 };
                return order[a.status] - order[b.status];
              });

            setActiveRooms(validRooms);
            setCurrentRoomIndex(0); // Resetear al índice inicial cuando se refrescan las salas
          } catch (err) {
            console.error("Error al refrescar salas activas:", err);
          }
        };

        fetchActiveRooms();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
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
    
    // La validación y creación de la transacción se hace en el modal
    // Aquí solo recargamos el wallet para actualizar los balances
    try {
      if (userId) {
        const wallet = await getWalletByUser(userId);
        setAvailableBalance(wallet.balance || 0);
        setFrozenBalance(wallet.frozen_balance || 0);
      }
    } catch (error) {
      console.error("Error al recargar wallet después del reporte:", error);
    }

    // Cerrar el modal
    setOpenReport(false);
  };

  const [openWithdrawRequestDialog, setOpenWithdrawRequestDialog] =
    React.useState(false);
  const [withdrawError, setWithdrawError] = React.useState<string | null>(null);

  const handleSubmitWithdrawRequestDialog = async (formData: {
    bankName: string;
    document_type_id: string;
    docId: string;
    phone: string;
    amount: string;
    notes: string;
  }) => {
    if (!userId) {
      setWithdrawError("No se pudo identificar al usuario");
      return;
    }

    try {
      setWithdrawError(null);

      // Si no hay cuenta bancaria, crear una nueva junto con la transacción
      if (!bankAccount) {
        // Validar que el perfil tenga los datos necesarios
        if (!userProfile?.document_type_id || !userProfile?.document_number || !userProfile?.phone) {
          setWithdrawError("Debe completar su perfil con documento y teléfono antes de retirar fondos");
      return;
    }

        // Validar que los datos del formulario coincidan con el perfil
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

        // Validar que bankName esté completo
        if (!formData.bankName) {
          setWithdrawError("Debe seleccionar un banco");
          return;
        }

        // Crear cuenta bancaria y transacción de retiro (sin account_number)
        const result = await createBankAccountWithWithdraw({
          userId,
          bank_name: formData.bankName,
          account_number: "", // Ya no se requiere
          phone_number: formData.phone,
          document_number: formData.docId,
          document_type_id: formData.document_type_id,
          amount: parseFloat(formData.amount)
        });

        // Actualizar balances (el balance ya está reducido por retiros pendientes en el backend)
        setAvailableBalance(Math.max(0, result.new_balance || 0));
        setFrozenBalance(result.new_frozen_balance);
        
        // Actualizar cuenta bancaria
        setBankAccount(result.bank_account);

        // Recargar wallet para asegurar sincronización
        const wallet = await getWalletByUser(userId);
        setAvailableBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);

        setOpenWithdrawRequestDialog(false);
      } else {
        // Ya hay cuenta bancaria, solo crear la transacción de retiro
        const { createWithdrawOnly } = await import("../Services/bankAccounts.service");
        const result = await createWithdrawOnly(userId, parseFloat(formData.amount));

        // Actualizar balances (el balance ya está reducido por retiros pendientes en el backend)
        setAvailableBalance(Math.max(0, result.new_balance || 0));
        setFrozenBalance(result.new_frozen_balance);
        
        // Recargar wallet para asegurar sincronización
        const wallet = await getWalletByUser(userId);
        setAvailableBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);

        setOpenWithdrawRequestDialog(false);
      }
    } catch (error: unknown) {
      console.error("Error al procesar retiro:", error);
      let errorMessage = "Error al procesar la solicitud de retiro";
      if (error && typeof error === "object") {
        if ("response" in error) {
          const httpError = error as { response?: { data?: { message?: string } } };
          errorMessage = httpError.response?.data?.message || errorMessage;
        } else if ("message" in error) {
          errorMessage = String(error.message);
        }
      }
      setWithdrawError(errorMessage);
    }
  };

  const handleDeleteBankAccount = async () => {
    if (!bankAccount) return;

    try {
      await deleteBankAccount(bankAccount._id);
      setBankAccount(null);
      // Recargar wallet
      if (userId) {
        const wallet = await getWalletByUser(userId);
        setAvailableBalance(Math.max(0, wallet.balance || 0));
        setFrozenBalance(wallet.frozen_balance || 0);
      }
    } catch (error: unknown) {
      console.error("Error al eliminar cuenta bancaria:", error);
      let errorMessage = "Error al eliminar la cuenta bancaria";
      if (error && typeof error === "object" && "response" in error) {
        const httpError = error as { response?: { data?: { message?: string } } };
        errorMessage = httpError.response?.data?.message || errorMessage;
      }
      setWithdrawError(errorMessage);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "transparent",
        color: "#f5e6d3",
        paddingBottom: "80px",
        position: "relative",
      }}
    >
      {/* Auth Toast Notification - positioned absolutely at top */}
      {!authLoading && showToast && (
        <AuthToast
          isAuthenticated={isAuthenticated}
          userName={user?.full_name}
          onClose={() => setShowToast(false)}
        />
      )}

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ textAlign: "center", mb: 4, position: "relative" }}>
          {!authLoading && isAuthenticated && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Chip
                icon={
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#4caf50",
                      boxShadow: "0 0 8px rgba(76, 175, 80, 0.8)",
                    }}
                  />
                }
                label="En línea"
                size="small"
                sx={{
                  backgroundColor: "rgba(76, 175, 80, 0.15)",
                  color: "#4caf50",
                  border: "1px solid rgba(76, 175, 80, 0.3)",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  "& .MuiChip-icon": {
                    marginLeft: 1,
                  },
                }}
              />
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <BingoLogo size={150} />
          </Box>
        </Box>

        {isAuthenticated ? (
          <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
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
              subtitle="Pendiente de retiro"
              variant="glass"
            />
          </Stack>
        ) : (
          <AvailableRoomsPreview rooms={availableRooms} />
        )}

        {isAuthenticated && (
          <Box sx={{ mb: 4 }}>
            {/* Header con navegación */}
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

            {/* Título sin navegación cuando está cargando, hay error o no hay salas */}
            {(loading || error || activeRooms.length === 0) && (
              <SectionHeader title="Mis Partidas" showNavigation={false} />
            )}

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress sx={{ color: "#d4af37" }} />
              </Box>
            ) : error ? (
              <Typography
                variant="body2"
                sx={{
                  color: "#ff6b6b",
                  opacity: 0.9,
                  textAlign: "center",
                  py: 4,
                }}
              >
                {error}
              </Typography>
            ) : activeRooms.length === 0 ? (
              <Typography
                variant="body2"
                sx={{
                  color: "#ffffff",
                  opacity: 0.7,
                  textAlign: "center",
                  py: 4,
                }}
              >
                No se encontraron juegos activos
              </Typography>
            ) : (
              <Box sx={{ marginTop: 0 }}>
                {/* Sala actual */}
                {currentRoom && (
                  <ActiveRoomCard
                    key={currentRoom.id}
                    room={currentRoom}
                    onClick={handleRoomClick}
                  />
                )}

                {/* Indicador de posición */}
                {activeRooms.length > 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    {activeRooms.map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: index === currentRoomIndex ? "24px" : "8px",
                          height: "8px",
                          borderRadius:
                            index === currentRoomIndex ? "4px" : "50%",
                          backgroundColor:
                            index === currentRoomIndex
                              ? "#d4af37"
                              : "rgba(212, 175, 55, 0.3)",
                          transition: "all 0.3s ease",
                        }}
                      />
                    ))}
                  </Box>
                )}

                {/* Botón para ir al listado de salas */}
                <Button
                  fullWidth
                  onClick={() => navigate("/rooms")}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderRadius: "8px",
                    textTransform: "none",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#ffffff",
                    backgroundColor: "rgba(212, 175, 55, 0.1)",
                    border: "1px solid rgba(212, 175, 55, 0.3)",
                    "&:hover": {
                      backgroundColor: "rgba(212, 175, 55, 0.2)",
                      borderColor: "rgba(212, 175, 55, 0.5)",
                    },
                  }}
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
              sx={{
                backfaceVisibility: "hidden",
                position: "relative",
                cursor: "pointer",
                display: "inline-block",
                whiteSpace: "nowrap",
                color: "#fff",
                fontWeight: 900,
                fontSize: "14px",
                py: 1.5,
                borderRadius: "8px",
                textTransform: "none",
                textShadow:
                  "0px -1px 0px rgba(0,0,0,0.5), 0px 1px 2px rgba(255, 215, 0, 0.3)",
                border: "1px solid #d4af37",
                backgroundImage: `
                repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .12) 3.75%),
                repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .04) 2.25%),
                repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .18) 1.2%),
                linear-gradient(180deg, #d4af37 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #f4d03f 53%, #ffd700 75%, #d4af37 100%)
              `,
                boxShadow: `
                inset 0px 1px 0px rgba(255,255,255,0.9),
                inset 0px -1px 0px rgba(0,0,0,0.2),
                0px 1px 3px rgba(0,0,0,0.4),
                0px 4px 12px rgba(212, 175, 55, 0.4),
                0px 0px 20px rgba(255, 215, 0, 0.2)
              `,
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundImage: `
                  repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .15) 3.75%),
                  repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .05) 2.25%),
                  repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .2) 1.2%),
                  linear-gradient(180deg, #f4d03f 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #ffed4e 53%, #ffd700 75%, #f4d03f 100%)
                `,
                  boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,1),
                  inset 0px -1px 0px rgba(0,0,0,0.2),
                  0px 2px 6px rgba(0,0,0,0.5),
                  0px 6px 20px rgba(212, 175, 55, 0.5),
                  0px 0px 30px rgba(255, 215, 0, 0.3)
                `,
                  transform: "translateY(-1px)",
                },
                "&:active": {
                  transform: "translateY(2px)",
                  boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,0.7),
                  inset 0px -1px 0px rgba(0,0,0,0.3),
                  0px 1px 2px rgba(0,0,0,0.4),
                  0px 2px 8px rgba(212, 175, 55, 0.3),
                  0px 0px 15px rgba(255, 215, 0, 0.15)
                `,
                },
              }}
            >
              Recargar Saldo
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{
                backfaceVisibility: "hidden",
                position: "relative",
                cursor: "pointer",
                display: "inline-block",
                whiteSpace: "nowrap",
                color: "#fff",
                fontWeight: 900,
                fontSize: "14px",
                py: 1.5,
                borderRadius: "8px",
                textTransform: "none",
                textShadow: "0px -1px 0px rgba(0,0,0,0.4)",
                borderColor: "#7c7c7c",
                borderWidth: "1px",
                backgroundImage: `
                repeating-linear-gradient(left, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 6%, hsla(0,0%,100%, .1) 7.5%),
                repeating-linear-gradient(left, hsla(0,0%, 0%,0) 0%, hsla(0,0%, 0%,0) 4%, hsla(0,0%, 0%,.03) 4.5%),
                repeating-linear-gradient(left, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 1.2%, hsla(0,0%,100%,.15) 2.2%),
                linear-gradient(180deg, hsl(0,0%,78%) 0%, hsl(0,0%,90%) 47%, hsl(0,0%,78%) 53%, hsl(0,0%,70%) 100%)
              `,
                boxShadow: `
                inset 0px 1px 0px rgba(255,255,255,1),
                0px 1px 3px rgba(0,0,0,0.3),
                0px 4px 12px rgba(0, 0, 0, 0.2)
              `,
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,1),
                  0px 2px 6px rgba(0,0,0,0.4),
                  0px 6px 16px rgba(0, 0, 0, 0.3)
                `,
                  transform: "translateY(-1px)",
                },
                "&:active": {
                  transform: "translateY(2px)",
                  boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,0.8),
                  0px 1px 2px rgba(0,0,0,0.3),
                  0px 2px 8px rgba(0, 0, 0, 0.15)
                `,
                },
              }}
              onClick={() => setOpenWithdrawRequestDialog(true)}
            >
              Retirar Fondos
            </Button>
          </Stack>
        )}

        {/* <button onClick={() => setOpenWithdrawRequestDialog(true)}>Retirar saldo</button> */}

        <WithdrawRequestDialog
          open={openWithdrawRequestDialog}
          onClose={() => setOpenWithdrawRequestDialog(false)}
          onSubmit={handleSubmitWithdrawRequestDialog}
          error={withdrawError}
          currency="Bs"
          // accountInfo={MOCK_ACCOUNT}
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
          error={error}
          banks={BANKS}
          currency={"Bs"}
          accountInfo={{
            document_type_id: userProfile?.document_type_id?._id || "",
            docId: userProfile?.document_number || "",
            phone: userProfile?.phone || "",
          }}
          bankAccount={bankAccount}
        />
      </Container>
    </Box>
  );
}
