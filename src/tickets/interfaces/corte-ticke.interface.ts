export interface ShiftTicketResponse {
  business: {
    name: string;
    branch: string;
    ticketType: 'CORTE_X' | 'CORTE_Z'; // X = Arqueo parcial / Z = Cierre definitivo
  };
  shift: {
    id: string;
    name: string;
    openedAt: Date;
    closedAt?: Date;
    openedBy: string;
    closedBy?: string;
  };
  salesSummary: {
    cashSales: number;
    cardSales: number;
    transferSales: number;
    totalSales: number;
    totalTips: number;
    totalTransactions: number;
  };
  cashMovements: {
    initialAmount: number;
    injections: number;
    expenses: number;
  };
  cashReconciliation: {
    expectedInDrawer: number;
    actualReported?: number;
    difference?: number;
    status: string; // 'EN_CURSO' | 'CUADRADA' | 'SOBRANTE' | 'FALTANTE'
  };
  breakdown: {
    expenses: Array<{
      description: string;
      amount: number;
      supplier?: string;
    }>;
  };
}