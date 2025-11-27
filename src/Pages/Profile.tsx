// src/Pages/Profile.tsx
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import * as React from "react";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LogoutIcon from "@mui/icons-material/Logout";
import IconButton from "@mui/material/IconButton";
import { useNavigate } from "react-router";
import BackgroundStars from "../Componets/BackgroundStars";
import { MobilePaymentReportDialog } from "../Componets/MobilePaymentReportDialog";
import { logout } from "../Services/auth.service";
import { WithdrawRequestDialog } from "../Componets/WithdrawRequestDialog";
import SuccessToast from "../Componets/SuccessToast";
import ErrorToast from "../Componets/ErrorToast";
import { getUserById, type User } from "../Services/users.service";
import { useAuth } from "../hooks/useAuth";
import ProtectedRoute from "../Componets/ProtectedRoute";
import { type BankAccount } from "../Services/bankAccounts.service";

type MobilePayData = {
  bankName: string;
  phone: string;
  docType: string;
  docId: string;
  accountHolder: string;
};

const BANKS = [
  "Banco de Venezuela",
  "Banco Provincial",
  "Banesco",
  "Mercantil",
  "BOD",
  "Banco del Tesoro",
  "Bancamiga",
];

function ProfileContent() {
  // TODOS LOS HOOKS DEBEN IR AL INICIO, ANTES DE CUALQUIER RETURN CONDICIONAL
  const [openReport, setOpenReport] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const navigate = useNavigate();
  const { userId, user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [wallet, setWallet] = React.useState<{
    balance: number;
    currency_id?: { code?: string; name?: string };
  } | null>(null);

  // Debug: Log del estado de autenticación
  React.useEffect(() => {
    console.log("🔐 Estado de autenticación:", {
      isAuthenticated,
      userId,
      authUser,
      localStorageUserId: localStorage.getItem("userId"),
      authUserStorage: localStorage.getItem("auth_user"),
    });
  }, [isAuthenticated, userId, authUser]);

  // Cargar datos del usuario
  React.useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        console.warn("⚠️ No se encontró userId. Verificando localStorage...");
        // Intentar obtener el userId directamente de localStorage como fallback
        const storedUserId = localStorage.getItem("userId");
        const authUser = localStorage.getItem("auth_user");

        if (storedUserId) {
          console.log("📦 userId encontrado en localStorage:", storedUserId);
        } else if (authUser) {
          try {
            const user = JSON.parse(authUser);
            console.log("📦 Usuario encontrado en auth_user:", user);
            if (user?.id) {
              console.log("✅ Usando userId del objeto user:", user.id);
              // Intentar cargar con este ID
              try {
                setLoading(true);
                const userData = await getUserById(user.id);
                setUser(userData);
                setLoading(false);
                return;
              } catch (err: unknown) {
                console.error(
                  "Error al cargar con userId del objeto user:",
                  err
                );
              }
            }
          } catch (e) {
            console.error("Error al parsear auth_user:", e);
          }
        }

        setError(
          "No se pudo obtener el ID del usuario. Por favor, inicia sesión nuevamente."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Validar que el userId tenga un formato válido (ObjectId de MongoDB)
        if (!userId || userId.trim() === "") {
          setError("ID de usuario inválido");
          setLoading(false);
          return;
        }

        console.log("🔍 Intentando obtener usuario con ID:", userId);
        console.log("📋 Tipo de userId:", typeof userId);
        console.log("📋 Longitud de userId:", userId.length);

        const userData = await getUserById(userId);
        if (!userData) {
          throw new Error("No se pudo obtener la información del usuario");
        }

        setUser(userData);
        console.log("✅ Usuario cargado exitosamente:", userData);

        // Cargar wallet del usuario
        try {
          const { getWalletByUser } = await import("../Services/wallets.service");
          const walletData = await getWalletByUser(userId);
          const currencyId = typeof walletData.currency_id === "string"
            ? undefined
            : walletData.currency_id;
          setWallet({
            balance: walletData.balance || 0,
            currency_id: currencyId
          });
        } catch (walletError: unknown) {
          // Si no hay wallet, no es un error crítico
          if (
            (walletError as { response?: { status?: number } })?.response
              ?.status !== 404
          ) {
            console.error("Error al cargar wallet:", walletError);
          }
        }
      } catch (err: unknown) {
        console.error("❌ Error al cargar datos del usuario:", err);
        const errorResponse = err as {
          response?: { status?: number; data?: { message?: string } };
          message?: string;
        };
        console.error("📋 Detalles del error:", {
          status: errorResponse?.response?.status,
          message: errorResponse?.message,
          responseData: errorResponse?.response?.data,
        });

        // Si es un 404, verificar si el usuario está autenticado
        if (errorResponse?.response?.status === 404) {
          const isAuth = localStorage.getItem("auth_user") !== null;
          if (isAuth) {
            setError(
              "Tu usuario no se encuentra en la base de datos. Por favor, contacta al soporte o inicia sesión nuevamente."
            );
          } else {
            setError(
              "Usuario no encontrado. Por favor, inicia sesión nuevamente."
            );
          }
        } else {
          const errorMessage =
            errorResponse?.response?.data?.message ||
            errorResponse?.message ||
            "Error al cargar datos del usuario";
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  // Preparar datos para mostrar (después de todos los hooks)
  const profile = user?.profile;
  const documentType =
    profile?.document_type_id?.name || profile?.document_type_id || "N/A";
  const documentNumber = profile?.document_number || "N/A";
  const phone = profile?.phone || "No registrado";
  const address = profile?.address || "No registrada";

  // Datos para pago móvil (usar datos del perfil)
  const mobilePayData: MobilePayData = {
    bankName: "Banco de Venezuela", // Esto debería venir de la configuración del usuario
    phone: phone !== "No registrado" ? phone : "",
    docType: documentType,
    docId: documentNumber,
    accountHolder: user?.name || "",
  };

  const balance = wallet?.balance || 0;
  // Función helper para normalizar VES a Bs
  const normalizeCurrency = (currencyCode?: string | null): string => {
    if (!currencyCode) return "Bs";
    const normalized = currencyCode.toLowerCase().trim();
    return normalized === "ves" ? "Bs" : currencyCode;
  };
  
  const currency =
    typeof wallet?.currency_id === "string"
      ? normalizeCurrency(wallet.currency_id)
      : normalizeCurrency(wallet?.currency_id?.code || wallet?.currency_id?.name) || "Bs";

  // Funciones helper - deben ir antes de los returns condicionales
  const handleCopy = (value: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        alert("Copiado al portapapeles ✅");
      })
      .catch((err) => {
        console.error("Error al copiar:", err);
        alert("No se pudo copiar 😢");
      });
  };

  const submitReport = async () => {
    setError("");
    
    // La validación y creación de la transacción se hace en el modal
    // Aquí solo recargamos el wallet para actualizar los balances
    try {
      if (userId) {
        const { getWalletByUser } = await import("../Services/wallets.service");
        const updatedWallet = await getWalletByUser(userId);
        const currencyId = typeof updatedWallet.currency_id === "string"
          ? undefined
          : updatedWallet.currency_id;
        setWallet({
          balance: updatedWallet.balance || 0,
          currency_id: currencyId
        });
      }
      
      // Mostrar toaster de éxito
      setShowRechargeSuccessToast(true);
    } catch (error) {
      console.error("Error al recargar wallet después del reporte:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al procesar la recarga";
      setRechargeErrorMessage(errorMessage);
      setShowRechargeErrorToast(true);
    }

    // Cerrar el modal
    setOpenReport(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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
  const [bankAccount, setBankAccount] = React.useState<{
    _id: string;
    bank_name: string;
    account_number?: string;
    phone_number: string;
    document_number: string;
    document_type_id: {
      _id: string;
      name: string;
      code: string;
    };
  } | null>(null);
  const [availableBalance, setAvailableBalance] = React.useState<number>(0);

  // Cargar cuenta bancaria y balance disponible
  React.useEffect(() => {
    const loadBankAccountAndBalance = async () => {
      if (!userId) return;

      try {
        // Cargar cuenta bancaria
        try {
          const { getBankAccountByUser } = await import("../Services/bankAccounts.service");
          const account = await getBankAccountByUser(userId);
          setBankAccount(account);
        } catch (error: unknown) {
          if (error && typeof error === "object" && "response" in error) {
            const httpError = error as { response?: { status?: number } };
            if (httpError.response?.status !== 404) {
              console.error("Error al cargar cuenta bancaria:", error);
            }
          }
          setBankAccount(null);
        }

        // Cargar wallet para obtener balance disponible
        try {
          const { getWalletByUser } = await import("../Services/wallets.service");
          const wallet = await getWalletByUser(userId);
          const frozen = wallet.frozen_balance || 0;
          const total = wallet.balance || 0;
          setAvailableBalance(Math.max(0, total - frozen));
        } catch (error) {
          console.error("Error al cargar wallet:", error);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    loadBankAccountAndBalance();
  }, [userId]);

  const handleSubmitWithdrawRequestDialog = async (
    formData: {
      bankName: string;
      document_type_id: string;
      docId: string;
      phone: string;
      amount: string;
      notes: string;
    }
  ) => {
    setWithdrawError(null);
    if (!userId) {
      setWithdrawError("No se pudo identificar al usuario");
      return;
    }

    try {
      const { createBankAccountWithWithdraw, createWithdrawOnly } = await import("../Services/bankAccounts.service");

      if (!bankAccount) {
        // No hay cuenta bancaria, crear cuenta y retiro
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

        setBankAccount(result.bank_account);
        setAvailableBalance(Math.max(0, result.new_balance || 0));

        // Recargar wallet
        const { getWalletByUser } = await import("../Services/wallets.service");
        const updatedWallet = await getWalletByUser(userId);
        const currencyId = typeof updatedWallet.currency_id === "string"
          ? undefined
          : updatedWallet.currency_id;
        setWallet({
          balance: updatedWallet.balance || 0,
          currency_id: currencyId
        });

        // Mostrar toaster de éxito
        setShowWithdrawSuccessToast(true);
        setOpenWithdrawRequestDialog(false);
      } else {
        // Ya hay cuenta bancaria, solo crear la transacción de retiro
        const result = await createWithdrawOnly(userId, parseFloat(formData.amount));

        setAvailableBalance(Math.max(0, result.new_balance || 0));

        // Recargar wallet
        const { getWalletByUser } = await import("../Services/wallets.service");
        const updatedWallet = await getWalletByUser(userId);
        const currencyId = typeof updatedWallet.currency_id === "string"
          ? undefined
          : updatedWallet.currency_id;
        setWallet({
          balance: updatedWallet.balance || 0,
          currency_id: currencyId
        });

        // Mostrar toaster de éxito
        setShowWithdrawSuccessToast(true);
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
      setWithdrawErrorMessage(errorMessage);
      setShowWithdrawErrorToast(true);
    }
  };

  const handleDeleteBankAccount = async () => {
    if (!bankAccount || !userId) return;
    try {
      const { deleteBankAccount } = await import("../Services/bankAccounts.service");
      await deleteBankAccount(bankAccount._id);
      setBankAccount(null);
      // Recargar wallet
      const { getWalletByUser } = await import("../Services/wallets.service");
      const updatedWallet = await getWalletByUser(userId);
      const currencyId = typeof updatedWallet.currency_id === "string"
        ? undefined
        : updatedWallet.currency_id;
      setWallet({
        balance: updatedWallet.balance || 0,
        currency_id: currencyId
      });
    } catch (error) {
      console.error("Error al eliminar cuenta bancaria:", error);
    }
  };

  // Ahora sí, los returns condicionales DESPUÉS de todos los hooks y funciones
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#1a1008",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography sx={{ color: "#f5e6d3" }}>Cargando...</Typography>
      </Box>
    );
  }

  if (!user && !loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#1a1008",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
          px: 2,
        }}
      >
        <Typography sx={{ color: "#f5e6d3", textAlign: "center" }}>
          {error || "Error al cargar datos del usuario"}
        </Typography>
        {error && (
          <Button
            variant="contained"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            sx={{
              background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
              color: "#1a1008",
              fontWeight: 700,
              "&:hover": {
                background:
                  "linear-gradient(135deg, #f4d03f, #ffd700, #f4d03f)",
              },
            }}
          >
            Ir al Login
          </Button>
        )}
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#1a1008", // Fondo de madera oscura
          color: "#f5e6d3", // Texto crema
          paddingBottom: "80px",
          position: "relative",
          overflow: "hidden",
          // Textura de madera de fondo (más sutil)
          backgroundImage: `
          repeating-linear-gradient(
            0deg,
            #1a1008 0px,
            #1f1309 1px,
            #2a1a0f 2px,
            #1f1309 3px,
            #1a1008 4px,
            #1a1008 8px,
            #1f1309 9px,
            #2a1a0f 10px,
            #1f1309 11px,
            #1a1008 12px
          ),
          linear-gradient(
            90deg,
            #1a1008 0%,
            #1f1309 15%,
            #2a1a0f 30%,
            #1f1309 45%,
            #1a1008 60%,
            #1f1309 75%,
            #2a1a0f 90%,
            #1a1008 100%
          ),
          radial-gradient(ellipse 200px 50px at 25% 30%, rgba(42, 26, 15, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse 150px 40px at 75% 60%, rgba(31, 19, 9, 0.25) 0%, transparent 50%)
        `,
          backgroundSize: `
          100% 16px,
          200% 100%,
          100% 100%,
          100% 100%
        `,
          // Capa de difuminado/vaho sobre el fondo
          "&::before": {
            content: '""',
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
            radial-gradient(ellipse 600px 400px at 20% 30%, rgba(0, 0, 0, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 500px 350px at 80% 60%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 400px 300px at 50% 20%, rgba(0, 0, 0, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 350px 250px at 15% 70%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 450px 320px at 70% 15%, rgba(0, 0, 0, 0.1) 0%, transparent 60%)
          `,
            backdropFilter: "blur(8px) saturate(120%)",
            WebkitBackdropFilter: "blur(8px) saturate(120%)",
            pointerEvents: "none",
            zIndex: 0,
          },
        }}
      >
        <BackgroundStars />
        <Container
          maxWidth="md"
          sx={{ py: 4, position: "relative", zIndex: 1 }}
        >
          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            sx={{
              mb: 4,
              px: { xs: 1, md: 0 },
            }}
          >
            {/* Avatar y Nombre */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2.5,
                flex: 1,
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  fontWeight: 900,
                  fontSize: "28px",
                  bgcolor: "rgba(31, 19, 9, 0.8)",
                  backdropFilter: "blur(20px)",
                  color: "#d4af37",
                  border: "3px solid rgba(212, 175, 55, 0.6)",
                  boxShadow:
                    "0 4px 16px rgba(212, 175, 55, 0.3), 0 0 20px rgba(212, 175, 55, 0.2)",
                }}
              >
                {user?.name?.[0] || "U"}
              </Avatar>

              <Box>
                {user?.name?.split(" ").map((part, index) => (
                  <Typography
                    key={index}
                    sx={{
                      fontSize: { xs: "18px", sm: "22px" },
                      fontWeight: 800,
                      lineHeight: 1.2,
                      background:
                        "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      fontFamily: "'Montserrat', sans-serif",
                      textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {part}
                  </Typography>
                ))}
              </Box>
            </Box>

            {/* Card de Saldo */}
            <Card
              onClick={() => {
                navigate("/wallet");
              }}
              sx={{
                px: 3,
                py: 2,
                borderRadius: "16px",
                bgcolor: "rgba(31, 19, 9, 0.92)",
                backdropFilter: "blur(40px) saturate(150%)",
                WebkitBackdropFilter: "blur(40px) saturate(150%)",
                border: "2px solid rgba(212, 175, 55, 0.3)",
                boxShadow:
                  "0 16px 36px rgba(0,0,0,0.85), 0 0 20px rgba(212, 175, 55, 0.1)",
                minWidth: { xs: "140px", sm: "160px" },
                textAlign: "right",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "rgba(212, 175, 55, 0.5)",
                  boxShadow:
                    "0 20px 40px rgba(0,0,0,0.9), 0 0 30px rgba(212, 175, 55, 0.2)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(245, 230, 211, 0.7)",
                  fontWeight: 500,
                  fontSize: "11px",
                  display: "block",
                  mb: 0.5,
                }}
              >
                Saldo disponible
              </Typography>
              <Typography
                variant="h6"
                fontWeight={900}
                sx={{
                  background:
                    "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                  fontSize: { xs: "18px", sm: "20px" },
                  lineHeight: 1.2,
                }}
              >
                {currency}
              </Typography>
              <Typography
                variant="h5"
                fontWeight={900}
                sx={{
                  background:
                    "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                  fontSize: { xs: "22px", sm: "26px" },
                  lineHeight: 1.1,
                  mt: 0.5,
                }}
              >
                {Intl.NumberFormat().format(balance)}
              </Typography>
            </Card>
          </Stack>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              alignItems: "stretch",
            }}
          >
            <Box sx={{ flex: { xs: "0 0 auto", md: "0 0 60%" } }}>
              <Stack spacing={2} sx={{ height: "100%" }}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    bgcolor: "rgba(31, 19, 9, 0.92)",
                    backdropFilter: "blur(40px) saturate(150%)",
                    WebkitBackdropFilter: "blur(40px) saturate(150%)",
                    border: "2px solid rgba(212, 175, 55, 0.3)",
                    boxShadow:
                      "0 18px 40px rgba(0,0,0,0.75), 0 0 20px rgba(212, 175, 55, 0.1)",
                  }}
                >
                  <CardHeader
                    title="Perfil"
                    sx={{
                      pb: 0,
                      "& .MuiCardHeader-title": {
                        fontWeight: 800,
                        background:
                          "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontFamily: "'Montserrat', sans-serif",
                        textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                      },
                    }}
                  />
                  <CardContent sx={{ pt: 1.5 }}>
                    <Stack spacing={1}>
                      <Line label="Nombre" value={user?.name || "N/A"} />
                      <Line label="Correo" value={user?.email || "N/A"} />
                      <Line label="Teléfono" value={phone} />
                      <Line
                        label="Documento"
                        value={
                          documentNumber !== "N/A"
                            ? `${documentType}-${documentNumber}`
                            : "No registrado"
                        }
                      />
                      {address !== "No registrada" && (
                        <Line label="Dirección" value={address} />
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    bgcolor: "rgba(31, 19, 9, 0.92)",
                    backdropFilter: "blur(40px) saturate(150%)",
                    WebkitBackdropFilter: "blur(40px) saturate(150%)",
                    border: "2px solid rgba(212, 175, 55, 0.3)",
                    boxShadow:
                      "0 18px 40px rgba(0,0,0,0.75), 0 0 20px rgba(212, 175, 55, 0.1)",
                    flexGrow: 1,
                  }}
                >
                  <CardHeader
                    title="Datos para Pago Móvil"
                    subheader="Usa estos datos para transferir"
                    sx={{
                      pb: 0,
                      "& .MuiCardHeader-title": {
                        fontWeight: 800,
                        background:
                          "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontFamily: "'Montserrat', sans-serif",
                        textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                      },
                      "& .MuiCardHeader-subheader": {
                        color: "rgba(245, 230, 211, 0.7)",
                      },
                    }}
                  />
                  <CardContent sx={{ pt: 1.5 }}>
                    <Stack spacing={1}>
                      <Line label="Banco" value={mobilePayData.bankName} />

                      {mobilePayData.phone && (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Line
                              label="Teléfono"
                              value={mobilePayData.phone}
                            />
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleCopy(mobilePayData.phone)}
                            sx={{ ml: 1, color: "rgba(212, 175, 55, 0.7)" }}
                          >
                            <ContentCopyIcon fontSize="inherit" />
                          </IconButton>
                        </Box>
                      )}

                      {mobilePayData.docId !== "N/A" && (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Line
                              label="Cédula/RIF"
                              value={`${mobilePayData.docType}-${mobilePayData.docId}`}
                            />
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleCopy(
                                `${mobilePayData.docType}-${mobilePayData.docId}`
                              )
                            }
                            sx={{ ml: 1, color: "rgba(212, 175, 55, 0.7)" }}
                          >
                            <ContentCopyIcon fontSize="inherit" />
                          </IconButton>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
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
                  onClick={() => setOpenWithdrawRequestDialog(true)}
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
                >
                  Retirar Fondos
                </Button>
              </Stack>

              <Button
                variant="outlined"
                onClick={handleLogout}
                fullWidth
                startIcon={<LogoutIcon />}
                sx={{
                  backfaceVisibility: "hidden",
                  position: "relative",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flexbox",
                  height: 48,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "14px",
                  py: 1.5,
                  borderRadius: "8px",
                  textTransform: "none",
                  textShadow: "0px -1px 0px rgba(0,0,0,0.4)",
                  border: "1px solid #d32f2f",
                  backgroundImage: `
                repeating-linear-gradient(left, rgba(244, 67, 54, 0) 0%, rgba(244, 67, 54, 0) 3%, rgba(244, 67, 54, .12) 3.75%),
                repeating-linear-gradient(left, rgba(198, 40, 40, 0) 0%, rgba(198, 40, 40, 0) 2%, rgba(198, 40, 40, .04) 2.25%),
                repeating-linear-gradient(left, rgba(255, 82, 82, 0) 0%, rgba(255, 82, 82, 0) .6%, rgba(255, 82, 82, .18) 1.2%),
                linear-gradient(180deg, #f44336 0%, #ef5350 25%, #e57373 38%, #ef5350 47%, #e57373 53%, #ef5350 75%, #f44336 100%)
              `,
                  boxShadow: `
                inset 0px 1px 0px rgba(255,255,255,0.9),
                inset 0px -1px 0px rgba(0,0,0,0.2),
                0px 1px 3px rgba(0,0,0,0.4),
                0px 4px 12px rgba(244, 67, 54, 0.4),
                0px 0px 20px rgba(244, 67, 54, 0.2)
              `,
                  transition: "all 0.2s ease",
                  "& .MuiButton-startIcon": {
                    color: "#fff",
                  },
                  "&:hover": {
                    backgroundImage: `
                  repeating-linear-gradient(left, rgba(244, 67, 54, 0) 0%, rgba(244, 67, 54, 0) 3%, rgba(244, 67, 54, .15) 3.75%),
                  repeating-linear-gradient(left, rgba(198, 40, 40, 0) 0%, rgba(198, 40, 40, 0) 2%, rgba(198, 40, 40, .05) 2.25%),
                  repeating-linear-gradient(left, rgba(255, 82, 82, 0) 0%, rgba(255, 82, 82, 0) .6%, rgba(255, 82, 82, .2) 1.2%),
                  linear-gradient(180deg, #ef5350 0%, #e57373 25%, #ff8a80 38%, #e57373 47%, #ff8a80 53%, #e57373 75%, #ef5350 100%)
                `,
                    boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,1),
                  inset 0px -1px 0px rgba(0,0,0,0.2),
                  0px 2px 6px rgba(0,0,0,0.5),
                  0px 6px 20px rgba(244, 67, 54, 0.5),
                  0px 0px 30px rgba(244, 67, 54, 0.3)
                `,
                    transform: "translateY(-1px)",
                    borderColor: "#d32f2f",
                  },
                  "&:active": {
                    transform: "translateY(2px)",
                    boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,0.7),
                  inset 0px -1px 0px rgba(0,0,0,0.3),
                  0px 1px 2px rgba(0,0,0,0.4),
                  0px 2px 8px rgba(244, 67, 54, 0.3),
                  0px 0px 15px rgba(244, 67, 54, 0.15)
                `,
                  },
                }}
              >
                Cerrar Sesión
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <WithdrawRequestDialog
        open={openWithdrawRequestDialog}
        onClose={() => setOpenWithdrawRequestDialog(false)}
        onSubmit={handleSubmitWithdrawRequestDialog}
        error={withdrawError}
        currency={currency}
        minAmount={500}
        accountInfo={{
          bankName: "",
          document_type_id: profile?.document_type_id?._id || "",
          docId: profile?.document_number || "",
          phone: profile?.phone || "",
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
        error={error || null}
        banks={BANKS}
        currency={currency}
        accountInfo={{
          document_type_id: profile?.document_type_id?._id || "",
          docId: profile?.document_number || "",
          phone: profile?.phone || "",
        }}
        bankAccount={bankAccount ? { bank_name: bankAccount.bank_name } : null}
      />

      {/* Toast de éxito para recarga */}
      {showRechargeSuccessToast && (
        <SuccessToast
          message="¡Recarga registrada exitosamente! 🎉"
          subMessage="Tu solicitud está en revisión"
          onClose={() => setShowRechargeSuccessToast(false)}
        />
      )}

      {/* Toast de error para recarga */}
      {showRechargeErrorToast && (
        <ErrorToast
          message={rechargeErrorMessage}
          onClose={() => {
            setShowRechargeErrorToast(false);
            setRechargeErrorMessage("");
          }}
        />
      )}

      {/* Toast de éxito para retiro */}
      {showWithdrawSuccessToast && (
        <SuccessToast
          message="¡Solicitud de retiro creada exitosamente! 🎉"
          subMessage="Tu solicitud está en revisión"
          onClose={() => setShowWithdrawSuccessToast(false)}
        />
      )}

      {/* Toast de error para retiro */}
      {showWithdrawErrorToast && (
        <ErrorToast
          message={withdrawErrorMessage}
          onClose={() => {
            setShowWithdrawErrorToast(false);
            setWithdrawErrorMessage("");
          }}
        />
      )}
    </>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography
        variant="body2"
        sx={{
          minWidth: 130,
          color: "rgba(245, 230, 211, 0.7)",
        }}
      >
        {label}:
      </Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{
          color: "#f5e6d3",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
