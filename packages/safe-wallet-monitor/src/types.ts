/**
 * Safe Wallet Monitor Types
 *
 * This module defines types specific to the Safe Wallet Monitor utility,
 * extending the common types with Safe-specific functionality.
 */

import { NotificationConfig, ChainName } from '@onchain-toolkit/common-types';
// Safe (Gnosis Safe) related types
export interface SafeAddress {
  /** The Safe contract address */
  address: string;
  /** The blockchain network where this Safe is deployed */
  chain: ChainName;
}

export interface SafeClientTransaction {
  type: 'TRANSACTION' | 'LABEL';
  transaction?: {
    txInfo: {
      type: string;
      to: {
        value: string;
        name: string;
        logoUri: string;
      };
      methodName: string;
      isCancellation: boolean;
    };
    id: string;
    timestamp: number;
    txStatus: string;
    executionInfo: {
      type: 'MULTISIG';
      nonce: number;
      confirmationsRequired: number;
      confirmationsSubmitted: number;
      missingSigners: Array<{
        value: string;
        name: string | null;
        logoUri: string | null;
      }>;
    };
    txHash: string | null;
  };
  conflictType: string;
}
export interface SafeClientApiResponse {
  count: number;
  next?: string;
  previous?: string;
  results: SafeClientTransaction[];
}

// Safe transaction related types
export interface SafeTransaction {
  /** Transaction nonce in the Safe */
  nonce: number;
  /** Number of confirmations received */
  signedCount: number;
  /** Number of confirmations required for execution */
  confirmationsRequired: number;
  /** Array of addresses that have signed this transaction */
  confirmations: Array<{ owner: string }>;
  /** Array of addresses that still need to sign */
  missingSigners?: string[];
  /** Optional transaction ID from Safe service */
  id?: string;
  /** Optional note/description for the transaction */
  note?: string;
}

export interface SafeTransactionDetails {
  safeAddress: string;
  txId: string;
  executedAt: number | null;
  txStatus: string;
  txInfo: {
    type: string;
    humanDescription: string | null;
    to: {
      value: string;
      name: string;
      logoUri: string;
    };
    dataSize: string;
    value: string;
    methodName: string;
    actionCount: number | null;
    isCancellation: boolean;
  };
  txData: {
    hexData: string;
    dataDecoded: {
      method: string;
      parameters: Array<{
        name: string;
        type: string;
        value: string;
        valueDecoded: unknown;
      }>;
      accuracy: string;
    };
    to: {
      value: string;
      name: string;
      logoUri: string;
    };
    value: string;
    operation: number;
    trustedDelegateCallTarget: unknown;
    addressInfoIndex: unknown;
    tokenInfoIndex: unknown;
  };
  txHash: string | null;
  detailedExecutionInfo: {
    type: string;
    submittedAt: number;
    nonce: number;
    safeTxGas: string;
    baseGas: string;
    gasPrice: string;
    gasToken: string;
    refundReceiver: {
      value: string;
      name: string | null;
      logoUri: string;
    };
    safeTxHash: string;
    executor: unknown;
    signers: Array<{
      value: string;
      name: string | null;
      logoUri: string | null;
    }>;
    confirmationsRequired: number;
    confirmations: Array<{
      signer: {
        value: string;
        name: string | null;
        logoUri: string | null;
      };
      signature: string;
      submittedAt: number;
    }>;
    rejectors: unknown[];
    gasTokenInfo: unknown;
    trusted: boolean;
    proposer: {
      value: string;
      name: string | null;
      logoUri: string | null;
    };
    proposedByDelegate: unknown;
  };
  safeAppInfo: {
    name: string;
    url: string;
    logoUri: string;
  };
  note: string;
}

// Configuration for the Safe Wallet Monitor
export interface SafeWalletMonitorConfig {
  /** Array of Safe addresses to monitor across different chains */
  safes: SafeAddress[];
  /** Array of signer information for display purposes */
  signers: SignerInfo[];
  /** Display formatting options */
  formatOptions: FormatOptions;
  /** Notification configurations (can have multiple notification methods) */
  notifications: NotificationConfig[];
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

// Queued transaction data structure for internal processing
export interface QueuedTransactionData {
  /** The blockchain network */
  chain: keyof typeof import('@onchain-toolkit/common-types').chainIds;
  /** Safe contract address */
  address: string;
  /** Array of queued transactions */
  transactions: QueuedSafeTransaction[];
  /** Safe information including owners and threshold */
  safeInfo: SafeInfo | null;
  /** Direct URL to the Safe interface */
  safeUrl: string;
}

// Extended Safe transaction with additional properties
export interface QueuedSafeTransaction {
  /** Transaction nonce in the Safe */
  nonce: number;
  /** Number of confirmations received */
  signedCount: number;
  /** Number of confirmations required for execution */
  confirmationsRequired: number;
  /** Array of confirmation objects with owner addresses */
  confirmations: Array<{ owner: string }>;
  /** Array of addresses that still need to sign */
  missingSigners?: string[];
  /** Safe transaction ID from the Safe service API */
  id: string;
  /** Optional note/description for the transaction */
  note?: string;
  /** Safe address associated with the transaction */
  safe: string;
}

// Safe information from the Safe service API
export interface SafeInfo {
  /** Array of Safe owner addresses */
  owners: string[];
  /** Number of signatures required for transaction execution */
  threshold: number;
}

// Result of the governance tracking operation
export interface SafeWalletMonitorResult {
  /** Total number of queued transactions found */
  totalTransactions: number;
  /** Formatted messages ready for display or notification */
  messages: string[];
  /** Summary of transactions by signer */
  signerSummary: Record<string, number>;
  /** Raw transaction data for further processing */
  rawData: QueuedTransactionData[];
}

// Display formatting options
export interface FormatOptions {
  /** Show which signers have already confirmed (default: false) */
  showConfirmedSigner?: boolean;
  /** Show which signers still need to sign (default: true) */
  showPendingSigner?: boolean;
  /** Show status icons (🏅, ⚠️) based on signature progress (default: false) */
  showStatusIcon?: boolean;
  /** Show chain icons for each network (default: true) */
  showChainIcon?: boolean;
  /** Show transaction notes if available (default: true) */
  showTxNote?: boolean;
}
// Signer information for display purposes
export interface SignerInfo {
  /** Ethereum address of the signer */
  address: string;
  /** Human-readable handle or name for the signer */
  handle: string;
}
