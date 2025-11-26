// src/Componets/TransactionDetailDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import { DialogHeader } from "./shared/DialogHeader";
import { SummaryCard } from "./shared/SummaryCard";
import { COLORS } from "../constants/colors";
import type { Transaction } from "../Services/transactionService";
import { getDocumentTypeById } from "../Services/documentTypes.service";

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

  // Agregar información del banco si existe en metadata
  const bankInfo = transaction.metadata?.bank_name 
    ? {
        label: 'Banco',
        value: transaction.metadata.bank_name as string,
      }
    : null;

  const summaryItems = [
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
    ...(bankInfo ? [bankInfo] : []),
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
    // Procesar metadata de forma inteligente
    ...(transaction.metadata
      ? Object.entries(transaction.metadata)
          .filter(([key]) => !['bank_name', 'room_name', 'round_number'].includes(key))
          .map(([key, value]) => {
            let displayValue: string | React.ReactNode = String(value);
            let label = key
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            // Formatear según el tipo de campo
            if (key === 'document_type_id') {
              // Mostrar nombre del tipo de documento en vez del ID
              displayValue = documentTypeName || String(value) || 'N/A';
              label = 'Tipo de Documento';
            } else if (key === 'bank_account_id') {
              // Omitir bank_account_id, ya mostramos bank_name en la descripción
              return null;
            } else if (key === 'commission_percent') {
              // Agregar % al porcentaje
              displayValue = `${value}%`;
              label = 'Comisión';
            } else if (key === 'commission_amount') {
              // Formatear como moneda
              const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
              displayValue = formatCurrency(numValue, currency);
              label = 'Monto de Comisión';
            } else if (key === 'transfer_amount') {
              // Formatear como moneda
              const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
              displayValue = formatCurrency(numValue, currency);
              label = 'Monto a Transferir';
            } else if (key === 'requested_amount') {
              // Formatear como moneda
              const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
              displayValue = formatCurrency(numValue, currency);
              label = 'Monto Solicitado';
            } else if (key === 'phone_number') {
              label = 'Teléfono';
            } else if (key === 'document_number') {
              label = 'Número de Documento';
            } else if (key === 'reference_code') {
              label = 'Código de Referencia';
            } else if (key === 'payment_date') {
              label = 'Fecha de Pago';
              // Intentar formatear como fecha si es posible
              try {
                const date = new Date(String(value));
                if (!isNaN(date.getTime())) {
                  displayValue = date.toLocaleDateString('es-VE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                }
              } catch {
                // Mantener el valor original si no se puede parsear
              }
            }

            return {
              label,
              value: displayValue,
            };
          })
          .filter((item): item is { label: string; value: string | React.ReactNode } => item !== null)
      : []),
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

