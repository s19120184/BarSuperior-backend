import { Payment } from "src/payments/entities/payment.entity";


export interface PaymentSummaryResponse {
  payment: Payment;
  orderTotal: number;
  totalPaid: number;
  pendingBalance: number;
  isOrderSettled: boolean;
  change: number;
  orderId:string
}