export enum PaymentChannel {
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
  MOCK = 'mock',
}

export enum PaymentOrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentPurpose {
  TIP = 'tip',
  CROWDFUNDING = 'crowdfunding',
}

export enum PaymentRefType {
  ANIMAL = 'animal',
  CROWDFUNDING = 'crowdfunding',
}

export enum LedgerEntryType {
  TIP = 'tip',
  CROWDFUNDING = 'crowdfunding',
  WITHDRAW = 'withdraw',
  REFUND = 'refund',
}

export enum CrowdfundingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export interface CrowdfundingUsageItem {
  label: string;
  amountCents: number;
}

export interface CreateTipInput {
  targetType: PaymentRefType.ANIMAL | PaymentRefType.CROWDFUNDING;
  targetId: string;
  amountCents: number;
  channel: PaymentChannel;
  idempotencyKey: string;
}

export interface PaymentOrderResult {
  orderId: string;
  status: PaymentOrderStatus;
  amountCents: number;
  channel: PaymentChannel;
  /** Dev/mock: call this path to simulate payment success */
  mockPayPath?: string;
  /** Production: provider-specific pay params */
  payParams?: Record<string, unknown>;
}

export interface CrowdfundingProjectItem {
  id: string;
  animalId: string;
  title: string;
  description: string | null;
  goalAmountCents: number;
  raisedAmountCents: number;
  progressPercent: number;
  usageDetail: CrowdfundingUsageItem[];
  status: CrowdfundingStatus;
  deadline: string | null;
  createdAt: string;
}

export interface CreateCrowdfundingInput {
  animalId: string;
  title: string;
  description?: string;
  goalAmountCents: number;
  usageDetail: CrowdfundingUsageItem[];
  deadline?: string;
}

export interface DonationTransparencyItem {
  id: string;
  amountCents: number;
  type: LedgerEntryType;
  donorLabel: string;
  refLabel: string;
  createdAt: string;
}
