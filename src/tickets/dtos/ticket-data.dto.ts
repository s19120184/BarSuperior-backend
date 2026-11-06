export interface TicketItemDto {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface TicketPaymentDto {
  method: string;
  amount: number;
  tip: number;
  receivedAmount?: number;
  change?: number;
}

export interface TicketDataDto {
  business: {
    name: string;
    taxId: string;
    address: string;
    phone: string;
  };
  order: {
    id: string;
    shortId: string;
    tableNumber: number;
    zone: string;
    waiter: string;
    openedAt: Date;
    closedAt?: Date;
  };
  items: TicketItemDto[];
  totals: {
    subtotal: number;
    total: number;
    suggestedTips?: {
      tip10: number;
      tip15: number;
      tip20: number;
    };
  };
  payments?: TicketPaymentDto[];
}