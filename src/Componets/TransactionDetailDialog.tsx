// src/Componets/TransactionDetailDialog.tsx
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { COLORS } from "../constants/colors";
import { getDocumentTypeById } from "../Services/documentTypes.service";
import type { Transaction } from "../Services/transactionService";
import { DialogHeader } from "./shared/DialogHeader";

type TransactionDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  currency: string;
  getTransactionLabel: (typeName: string) => string;
  transactionTypeMap?: Record<string, string>;
  transactionStatusMap?: Record<string, string>;
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
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const TransactionDetailDialog: React.FC<TransactionDetailDialogProps> = ({
  open,
  onClose,
  transaction,
  currency,
  getTransactionLabel,
  transactionTypeMap = {},
  transactionStatusMap = {},
}) => {
  const [documentTypeName, setDocumentTypeName] = useState<string | null>(null);

  useEffect(() => {
    const loadDocumentType = async () => {
      if (transaction?.metadata?.document_type_id) {
        try {
          const docType = await getDocumentTypeById(transaction.metadata.document_type_id);
          if (docType) {
            setDocumentTypeName(docType.name);
          }
        } catch (error) {
          console.error('Error al cargar tipo de documento:', error);
        }
      }
    };
    loadDocumentType();
  }, [transaction?.metadata?.document_type_id]);

  if (!transaction) return null;

  // Obtener el nombre del tipo de transacción
  let typeName = 'unknown';
  if (typeof transaction.transaction_type_id === 'string') {
    typeName = transactionTypeMap[transaction.transaction_type_id] || 'unknown';
  } else {
    typeName = transaction.transaction_type_id.name || transactionTypeMap[transaction.transaction_type_id._id] || 'unknown';
  }
  
  // Obtener el nombre del estado
  let statusName = 'unknown';
  if (typeof transaction.status_id === 'string') {
    statusName = transactionStatusMap[transaction.status_id] || 'unknown';
  } else {
    statusName = transaction.status_id.name || transactionStatusMap[transaction.status_id._id] || 'unknown';
  }

  // Convertir amount a número
  const parseAmount = (amount: number | string | { $numberDecimal: string } | undefined | null): number => {
    if (typeof amount === 'number') {
      return amount;
    }
    if (typeof amount === 'string') {
      return parseFloat(amount) || 0;
    }
    if (amount && typeof amount === 'object' && '$numberDecimal' in amount) {
      return parseFloat(amount.$numberDecimal) || 0;
    }
    return 0;
  };
  
  const rawAmount = parseAmount(transaction.amount);
  const isPositive = typeName === 'recharge' || typeName === 'prize' || typeName === 'refund';
  const amount = isPositive ? Math.abs(rawAmount) : -Math.abs(rawAmount);

  let description = getTransactionLabel(typeName);
  if (transaction.metadata) {
    if (transaction.metadata.bank_name) {
      description = `${getTransactionLabel(typeName)} a ${transaction.metadata.bank_name}`;
    } else if (transaction.metadata.room_name) {
      description = `${getTransactionLabel(typeName)} - ${transaction.metadata.room_name}`;
    } else if (transaction.metadata.round_number) {
      description = `${getTransactionLabel(typeName)} - Ronda ${transaction.metadata.round_number}`;
    }
  }

  const statusLabel = 
    statusName === 'pending' ? 'Pendiente' : 
    statusName === 'completed' ? 'Completado' : 
    'Desconocido';

  // Campos que son IDs y no deben mostrarse al usuario
  const hiddenFields = [
    'bank_account_id',
    'room_id',
    'round_id',
    'card_id',
    'winner_id',
    'reward_id',
    'game_session_id',
    'wallet_id',
    'currency_id',
    'transaction_type_id',
    'status_id',
    'document_type_id', // Se muestra como "Tipo de Documento" con el nombre
    'transaction_created_at', // Es redundante con "Fecha de Creación"
  ];

  // Campos que ya se muestran en otros lugares y no necesitan duplicarse
  const alreadyShownFields = [
    'bank_name', // Se muestra como "Banco" arriba
    'room_name', // Se muestra en la descripción
    'round_number', // Se muestra en la descripción
  ];

  // Si card_codes está disponible, ocultar card_ids (son redundantes)
  const shouldHideCardIds = transaction.metadata?.card_codes && Array.isArray(transaction.metadata.card_codes) && transaction.metadata.card_codes.length > 0;

  // Mapeo de campos a labels en español
  const fieldLabelMap: Record<string, string> = {
    // Información de sala
    'room_price_per_card': 'Precio por Cartón',
    'room_min_players': 'Jugadores Mínimos',
    'room_max_rounds': 'Rondas Máximas',
    'room_currency_code': 'Moneda',
    'room_currency_symbol': 'Símbolo de Moneda',
    'room_status': 'Estado de la Sala',
    'room_is_public': 'Sala Pública',
    'room_scheduled_at': 'Fecha Programada',
    'room_total_prize': 'Premio Total',
    'room_admin_fee': 'Comisión Administrativa',
    // Información de ronda
    'pattern_name': 'Patrón de Bingo',
    // Información de cartón
    'card_code': 'Código del Cartón',
    'card_count': 'Cantidad de Cartones',
    'card_codes': 'Cartones', // Códigos de los cartones (legibles)
    'card_ids': 'Cartones (IDs)', // IDs técnicos (solo si card_codes no está disponible)
    // Información de premio
    'prize_amount_total': 'Premio Total de la Ronda',
    'prize_amount_individual': 'Premio Individual',
    'total_winners_in_round': 'Ganadores en la Ronda',
    'prize_percent': 'Porcentaje del Premio',
    'bingo_numbers': 'Números del Bingo', // Se formateará como lista
    // Información de transacción
    'price_per_card': 'Precio por Cartón',
    'total_cost': 'Costo Total',
    // Información bancaria
    'phone_number': 'Teléfono',
    'document_number': 'Número de Documento',
    'reference_code': 'Código de Referencia',
    'payment_date': 'Fecha de Pago',
    'requested_amount': 'Monto Solicitado',
    'commission_percent': 'Porcentaje de Comisión',
    'commission_amount': 'Monto de Comisión',
    'transfer_amount': 'Monto a Transferir',
  };

  // Función para formatear valores según el tipo de campo
  const formatMetadataValue = (key: string, value: any): string | React.ReactNode => {
    if (value == null) return 'N/A';

    // Campos que son listas
    if (key === 'card_codes' && Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'N/A';
    }
    if (key === 'card_ids' && Array.isArray(value)) {
      // Si card_codes no está disponible, intentar usar card_ids pero mostrar un mensaje
      // En transacciones nuevas, card_codes debería estar disponible
      return value.length > 0 ? `[IDs: ${value.join(', ')}]` : 'N/A';
    }
    if (key === 'bingo_numbers' && Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'N/A';
    }

    // Campos de moneda
    if (['room_price_per_card', 'room_total_prize', 'room_admin_fee', 'prize_amount_total', 
         'prize_amount_individual', 'price_per_card', 'total_cost', 'commission_amount', 
         'transfer_amount', 'requested_amount'].includes(key)) {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      return formatCurrency(numValue, currency);
    }

    // Campos de porcentaje
    if (['commission_percent', 'prize_percent'].includes(key)) {
      return `${value}%`;
    }

    // Campos booleanos
    if (key === 'room_is_public') {
      return value ? 'Sí' : 'No';
    }

    // Campos de fecha
    if (['room_scheduled_at', 'payment_date'].includes(key)) {
      try {
        const date = new Date(String(value));
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-VE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      } catch {
        // Mantener el valor original si no se puede parsear
      }
    }

    // Campo de patrón de bingo - traducir nombres
    if (key === 'pattern_name') {
      const patternMap: Record<string, string> = {
        'horizontal': 'Horizontal',
        'vertical': 'Vertical',
        'diagonal': 'Diagonal',
        'cross_small': 'Cruz Pequeña',
        'cross_big': 'Cruz Grande',
        'full': 'Cartón Completo',
      };
      return patternMap[String(value).toLowerCase()] || String(value);
    }

    // Campo de estado de sala - traducir
    if (key === 'room_status') {
      const statusMap: Record<string, string> = {
        'waiting_players': 'Esperando Jugadores',
        'pending': 'Pendiente',
        'in_progress': 'En Progreso',
        'finished': 'Finalizada',
      };
      return statusMap[String(value).toLowerCase()] || String(value);
    }

    return String(value);
  };

  // Agregar información del banco si existe en metadata
  const bankInfo = transaction.metadata?.bank_name 
    ? {
        label: 'Banco',
        value: transaction.metadata.bank_name as string,
      }
    : null;

  // Agregar información de sala si existe
  const roomInfo = transaction.metadata?.room_name
    ? {
        label: 'Sala',
        value: transaction.metadata.room_name as string,
      }
    : null;

  // Agregar información de ronda si existe
  const roundInfo = transaction.metadata?.round_number
    ? {
        label: 'Ronda',
        value: `Ronda ${transaction.metadata.round_number}`,
      }
    : null;

  // Agregar información de cartón si existe
  const cardInfo = transaction.metadata?.card_code
    ? {
        label: 'Cartón Ganador',
        value: transaction.metadata.card_code as string,
      }
    : null;

  // Agregar información de patrón si existe
  const patternInfo = transaction.metadata?.pattern_name
    ? {
        label: 'Patrón de Bingo',
        value: formatMetadataValue('pattern_name', transaction.metadata.pattern_name) as string,
      }
    : null;

  // Agregar información de números de bingo si existe
  const bingoNumbersInfo = transaction.metadata?.bingo_numbers && Array.isArray(transaction.metadata.bingo_numbers) && transaction.metadata.bingo_numbers.length > 0
    ? {
        label: 'Números del Bingo',
        value: transaction.metadata.bingo_numbers.join(', ') as string,
      }
    : null;

  // Agregar información de tipo de documento si existe
  const documentTypeInfo = transaction.metadata?.document_type_id && documentTypeName
    ? {
        label: 'Tipo de Documento',
        value: documentTypeName,
      }
    : null;

  // Procesar metadata de forma inteligente
  const metadataItems = transaction.metadata
    ? Object.entries(transaction.metadata)
        .filter(([key]) => {
          // Ocultar card_ids si card_codes está disponible
          if (key === 'card_ids' && shouldHideCardIds) {
            return false;
          }
          return !hiddenFields.includes(key) && !alreadyShownFields.includes(key);
        })
        .map(([key, value]) => {
          const label = fieldLabelMap[key] || key
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          const displayValue = formatMetadataValue(key, value);

          return {
            label,
            value: displayValue,
          };
        })
    : [];

  const summaryItems: Array<{ label: string; value: React.ReactNode; highlight?: boolean; monospace?: boolean }> = [
    {
      label: 'Tipo de Transacción',
      value: (
        <Chip
          label={getTransactionLabel(typeName)}
          size="small"
          sx={{
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 999,
            px: 1.5,
            bgcolor:
              typeName === 'recharge'
                ? 'rgba(212, 175, 55, 0.15)'
                : typeName === 'prize'
                ? 'rgba(76, 175, 80, 0.15)'
                : 'rgba(212, 175, 55, 0.1)',
            color:
              typeName === 'recharge'
                ? COLORS.GOLD.DARK
                : typeName === 'prize'
                ? '#2e7d32'
                : COLORS.TEXT.PRIMARY,
            border: `1px solid ${COLORS.BORDER.GOLD}`,
          }}
        />
      ),
    },
    {
      label: 'Descripción',
      value: description,
    },
    ...(roomInfo ? [roomInfo] : []),
    ...(roundInfo ? [roundInfo] : []),
    ...(cardInfo ? [cardInfo] : []),
    ...(patternInfo ? [patternInfo] : []),
    ...(bingoNumbersInfo ? [bingoNumbersInfo] : []),
    ...(bankInfo ? [bankInfo] : []),
    ...(documentTypeInfo ? [documentTypeInfo] : []),
    {
      label: 'Monto',
      value: (
        <Typography
          variant="h6"
          sx={{
            color: amount >= 0 ? '#4caf50' : '#ef5350',
            fontWeight: 700,
          }}
        >
          {amount >= 0
            ? `+${formatCurrency(Math.abs(amount), currency)}`
            : `-${formatCurrency(Math.abs(amount), currency)}`}
        </Typography>
      ),
      highlight: true,
    },
    {
      label: 'Estado',
      value: (
        <Chip
          label={statusLabel}
          size="small"
          sx={{
            fontSize: 12,
            textTransform: 'capitalize',
            borderRadius: 999,
            px: 1.6,
            bgcolor:
              statusName === 'completed'
                ? 'rgba(76, 175, 80, 0.15)'
                : statusName === 'pending'
                ? 'rgba(255, 193, 7, 0.15)'
                : 'rgba(212, 175, 55, 0.1)',
            color:
              statusName === 'completed'
                ? '#2e7d32'
                : statusName === 'pending'
                ? '#f57c00'
                : COLORS.TEXT.PRIMARY,
            border: `1px solid ${COLORS.BORDER.GOLD}`,
          }}
        />
      ),
    },
    {
      label: 'Fecha de Creación',
      value: formatDate(transaction.created_at),
    },
    ...(transaction.updated_at && transaction.updated_at !== transaction.created_at
      ? [
          {
            label: 'Fecha de Actualización',
            value: formatDate(transaction.updated_at),
          },
        ]
      : []),
    // Agregar items procesados de metadata tipados (sin duplicar los ya mostrados)
    ...metadataItems.filter(item => 
      !['Sala', 'Ronda', 'Cartón Ganador', 'Patrón de Bingo', 'Números del Bingo', 'Banco', 'Tipo de Documento'].includes(item.label)
    ),
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: COLORS.BACKGROUND.WHITE,
          border: `2px solid ${COLORS.BORDER.GOLD}`,
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          width: { xs: "95%", sm: "90%", md: "600px" },
          maxWidth: { xs: "95%", sm: "90%", md: "600px" },
          m: { xs: 2, sm: 3 },
        },
      }}
    >
      <DialogHeader title="Detalles de la Transacción" onClose={onClose} />
      <DialogContent sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 }, bgcolor: COLORS.BACKGROUND.WHITE }}>
        <Stack spacing={2}>
          {summaryItems.map((item, index) => (
            <React.Fragment key={index}>
              <Box>
                <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600, fontSize: 12 }}>
                  {item.label}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {typeof item.value === 'string' ? (
                    <Typography
                      variant={item.highlight ? "h6" : "body1"}
                      sx={{
                        color: item.highlight ? COLORS.GOLD.BASE : COLORS.TEXT.PRIMARY,
                        fontWeight: item.highlight ? 700 : 500,
                        fontFamily: item.monospace ? "monospace" : "inherit",
                      }}
                    >
                      {item.value}
                    </Typography>
                  ) : (
                    item.value
                  )}
                </Box>
              </Box>
              {index < summaryItems.length - 1 && <Divider sx={{ borderColor: COLORS.BORDER.LIGHT }} />}
            </React.Fragment>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

