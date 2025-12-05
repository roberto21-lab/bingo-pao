import type { AmountType, TransactionDisplay, TransactionTypeId, TransactionStatusId, TransactionMetadata } from "../types/walletPage.types";
import type { Transaction } from "../Services/transaction.service";

export const getTransactionLabel = (typeName: string): string => {
  const typeMap: Record<string, string> = {
    'recharge': 'Recarga',
    'withdrawal': 'Retiro',
    'withdraw': 'Retiro',
    'game_entry': 'Entrada a juego',
    'prize': 'Premio',
    'refund': 'Reembolso',
    'unknown': 'Desconocido',
  };
  return typeMap[typeName.toLowerCase()] || 'Desconocido';
};

export const normalizeCurrency = (currencyCode?: string | null): string => {
  if (!currencyCode) return "Bs";
  const normalized = currencyCode.toLowerCase().trim();
  return normalized === "ves" ? "Bs" : currencyCode;
};

export const parseAmount = (amount: AmountType): number => {
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

export const formatCurrency = (amount: number, currency: string = 'Bs'): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0.00 ${currency}`;
  }
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount)) + ` ${currency}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTransactionTypeId = (transactionTypeId: string | TransactionTypeId | undefined): string | null => {
  if (!transactionTypeId) return null;
  if (typeof transactionTypeId === 'string') return transactionTypeId;
  return transactionTypeId._id || null;
};

export const getTransactionStatusId = (statusId: string | TransactionStatusId | undefined): string | null => {
  if (!statusId) return null;
  if (typeof statusId === 'string') return statusId;
  return statusId._id || null;
};

export const getTransactionTypeName = (
  tx: Transaction,
  typeId: string | null,
  typeMap: Record<string, string>
): string => {
  if (!typeId) return 'unknown';
  let typeName = typeMap[typeId] || 'unknown';
  if (typeName === 'unknown' && typeof tx.transaction_type_id === 'object' && tx.transaction_type_id?.name) {
    typeName = tx.transaction_type_id.name;
  }
  return typeName;
};

export const buildTransactionDescription = (typeName: string, metadata?: TransactionMetadata): string => {
  let description = getTransactionLabel(typeName);
  if (metadata) {
    if (metadata.bank_name) {
      description = `${getTransactionLabel(typeName)} a ${metadata.bank_name}`;
    } else if (metadata.room_name) {
      description = `${getTransactionLabel(typeName)} - ${metadata.room_name}`;
    } else if (metadata.round_number) {
      description = `${getTransactionLabel(typeName)} - Ronda ${metadata.round_number}`;
    }
  }
  return description;
};

export const mapTransactionToDisplay = (
  tx: Transaction,
  typeMap: Record<string, string>,
  statusMap: Record<string, string>
): TransactionDisplay | null => {
  const typeId = getTransactionTypeId(tx.transaction_type_id as string | TransactionTypeId | undefined);
  const statusId = getTransactionStatusId(tx.status_id as string | TransactionStatusId | undefined);

  if (!typeId || !statusId) {
    return null;
  }

  const typeName = getTransactionTypeName(tx, typeId, typeMap);
  const statusName = statusMap[statusId] || 'unknown';
  const description = buildTransactionDescription(typeName, tx.metadata);
  const rawAmount = parseAmount(tx.amount);
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
};
