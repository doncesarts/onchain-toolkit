/**
 * Safe API Integration
 *
 * This module handles all interactions with the Gnosis Safe Transaction Service API.
 * It provides functions to fetch Safe information, queued transactions, and transaction details
 * across multiple blockchain networks.
 */

import axios from 'axios';
import { chainIds, ChainName, SafeApiError } from '@onchain-toolkit/common-types';
import {
  QueuedSafeTransaction,
  SafeClientApiResponse,
  SafeClientTransaction,
  SafeInfo,
  SafeTransactionDetails,
} from './types';

// Safe Transaction Service API endpoints for different networks
const SAFE_API_URLS: Record<ChainName, string> = {
  mainnet: 'https://safe-transaction-mainnet.safe.global',
  arbitrum: 'https://safe-transaction-arbitrum.safe.global',
  optimism: 'https://safe-transaction-optimism.safe.global',
  polygon: 'https://safe-transaction-polygon.safe.global',
  gnosis: 'https://safe-transaction-gnosis-chain.safe.global',
  base: 'https://safe-transaction-base.safe.global',
  avalanche: 'https://safe-transaction-avalanche.safe.global',
  zkevm: 'https://safe-transaction-zkevm.safe.global',
};

/**
 * Create a logger function that only logs when debug mode is enabled
 * This helps keep the output clean in production while allowing detailed logging during development
 */
const createLogger =
  (debug: boolean) =>
  (...args: any[]) => {
    if (debug) {
      console.log('[Safe API]', ...args);
    }
  };

/**
 * Compare two Ethereum addresses for equality, ignoring case differences
 * Ethereum addresses are case-insensitive, so we normalize them for comparison
 */
export function compareAddresses(address1: string, address2: string): boolean {
  return address1.toLowerCase() === address2.toLowerCase();
}

/**
 * Shorten an Ethereum address for display purposes
 * Converts: 0x327Db4C2e4918920533a05f0f6aa9eDfB717bB41
 * To: 0x327D...bB41
 */
export function shortenAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
/**
 * Convert SafeClientTransaction to enhanced SafeTransaction format
 */
export function convertToEnhancedFormat(
  clientTx: SafeClientTransaction,
  safeAddress: string
): QueuedSafeTransaction | null {
  if (clientTx.type !== 'TRANSACTION' || !clientTx.transaction) {
    return null;
  }

  const tx = clientTx.transaction;
  const executionInfo = tx.executionInfo;

  // Extract missing signers
  const missingSigners = executionInfo.missingSigners.map(signer => signer.value);

  // Create fake confirmations based on submitted count
  const confirmations = Array.from({ length: executionInfo.confirmationsSubmitted }, (_, i) => ({
    owner: `signed_${i}`, // Placeholder - we'll get real signers from safe info if available
    submissionDate: new Date(tx.timestamp).toISOString(),
    signature: '',
    signatureType: 'ETH_SIGN',
  }));

  return {
    nonce: executionInfo.nonce,
    confirmations,
    confirmationsRequired: executionInfo.confirmationsRequired,
    id: tx.id,
    safe: safeAddress,
    missingSigners,
    signedCount: executionInfo.confirmationsSubmitted,
  };
}
/**
 * Fetch information about a Safe, including owners and threshold
 * This is needed to determine who can sign transactions and display signer information
 */
export async function fetchSafeInfo(
  safeAddress: string,
  chain: ChainName
): Promise<SafeInfo | null> {
  try {
    const apiUrl = SAFE_API_URLS[chain];
    if (!apiUrl) {
      throw new SafeApiError(`Unsupported chain: ${chain}`, safeAddress);
    }

    const response = await axios.get(`${apiUrl}/api/v1/safes/${safeAddress}/`);

    return {
      owners: response.data.owners || [],
      threshold: response.data.threshold || 1,
    };
  } catch (error) {
    console.error(`Failed to fetch Safe info for ${safeAddress} on ${chain}:`, error);
    return null;
  }
}

/**
 * Fetch all queued (pending) transactions for a Safe
 * These are transactions that have been proposed but not yet executed
 */
export async function fetchQueuedTransactions(
  safeAddress: string,
  chain: ChainName,
  debug = false
): Promise<QueuedSafeTransaction[]> {
  const log = createLogger(debug);

  try {
    const url = `https://safe-client.safe.global/v1/chains/${chainIds[chain]}/safes/${safeAddress}/transactions/queued`;
    log(`Fetching queued transactions for ${safeAddress} on ${chain} \n  ${url}`);

    // Fetch queued transactions from the Safe API
    const response = await axios.get<SafeClientApiResponse>(url, {
      timeout: 20_000,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'safe-wallet-monitor/1.0',
      },
    });

    // Filter only TRANSACTION type results and convert to enhanced format
    const transactions = response.data.results
      .filter(item => item.type === 'TRANSACTION')
      .map(item => convertToEnhancedFormat(item, safeAddress))
      .filter((tx): tx is QueuedSafeTransaction => tx !== null);
    log(`Found ${transactions.length} queued transactions`);
    return transactions;
  } catch (error) {
    console.error(`Failed to fetch queued transactions for ${safeAddress} on ${chain}:`, error);
    return [];
  }
}

/**
 * Fetch detailed information about a specific transaction, including notes
 * This is an additional API call that provides more context about transactions
 */
export async function fetchTransactionDetails(
  transactionId: string,
  chain: ChainName
): Promise<{ note?: string } | null> {
  try {
    const chainId = chainIds[chain];
    const url = `https://safe-client.safe.global/v1/chains/${chainId}/transactions/${transactionId}`;

    if (!chainId) {
      throw new SafeApiError(`Unsupported chain: ${chain}`, transactionId);
    }

    const response = await axios.get<SafeTransactionDetails>(url);

    return {
      note: response.data.note || undefined,
    };
  } catch (error) {
    // Transaction details are optional, so we don't throw errors here
    console.warn(`Could not fetch transaction details for ${transactionId}:`, error);
    return null;
  }
}

/**
 * Generate a direct URL to view the Safe in the Safe web interface
 * This provides users with a quick way to access the Safe for manual operations
 */
export function generateSafeUrl(safeAddress: string, chain: ChainName): string {
  // Base Safe app URL with proper chain prefix
  const chainPrefix = chain === 'mainnet' ? 'eth' : chain;
  return `https://app.safe.global/home?safe=${chainPrefix}:${safeAddress}`;
}
