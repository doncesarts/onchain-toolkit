/**
 * Safe Wallet Monitor - Main Module
 *
 * This is the core module that orchestrates the governance tracking functionality.
 * It fetches Safe transaction data, formats it for display, and sends notifications
 * through various channels.
 *
 * The module is designed to be used both programmatically and via CLI.
 */

import { ChainName } from '@onchain-toolkit/common-types';
import {
  SafeWalletMonitorConfig,
  SafeWalletMonitorResult,
  QueuedTransactionData,
  QueuedSafeTransaction,
  FormatOptions,
  SafeAddress,
  SignerInfo,
} from './types';
import {
  fetchSafeInfo,
  fetchQueuedTransactions,
  fetchTransactionDetails,
  generateSafeUrl,
  compareAddresses,
  shortenAddress,
} from './safe-api';
import { sendNotifications } from './notifications';

/**
 * Get a human-readable name for an address using the signers list
 * Falls back to a shortened address if no handle is found
 */
function getSignerHandle(address: string, signers: SignerInfo[], prefix?: string): string {
  const signer = signers.find(s => compareAddresses(s.address, address));
  return signer ? `${prefix || ''}${signer.handle}` : shortenAddress(address);
}

/**
 * Get status icon based on signature progress
 * 🏅 = Ready to execute (all signatures collected)
 * 📝 = Partially signed (some signatures missing)
 * ⚠️ = Needs attention (few signatures)
 */
function getStatusIcon(confirmed: number, required: number): string {
  if (confirmed >= required) return '🏅';
  if (confirmed >= Math.ceil(required * 0.7)) return '📝';
  return '⚠️';
}

/**
 * Get emoji icon for different blockchain networks
 * This helps users quickly identify which network they're looking at
 */
function getChainIcon(chain: ChainName): string {
  const chainIcons: Record<ChainName, string> = {
    mainnet: '⚫',
    arbitrum: '🔵',
    optimism: '🔴',
    polygon: '🟣',
    gnosis: '🟢',
    base: '⚪',
    avalanche: '🔺',
    zkevm: '🟪',
  };
  return chainIcons[chain] || '❓';
}

/**
 * Format a single transaction into a human-readable message
 * This function handles all the display options and creates formatted output
 */
function formatTransactionMessage(
  transaction: QueuedSafeTransaction,
  chain: ChainName,
  safeOwners: string[] = [],
  signers: SignerInfo[] = [],
  options: FormatOptions = {}
): string {
  const { signedCount: confirmed, confirmationsRequired: required, nonce, note } = transaction;

  const statusIcon = options.showStatusIcon ? getStatusIcon(confirmed, required) : '';
  const chainIcon = options.showChainIcon ? getChainIcon(chain) : '';
  const chainName = chain.toUpperCase();

  let message = `${chainIcon} ${chainName} - Tx ${nonce} ${statusIcon} ${confirmed}/${required}\n`;

  if (options.showTxNote && note) {
    message += `    📝 Note: ${note}\n`;
  }

  if ((options.showConfirmedSigner || options.showPendingSigner) && safeOwners.length > 0) {
    let signed: string[] = [];
    let notSigned: string[] = [];

    if (transaction.missingSigners && transaction.missingSigners.length > 0) {
      const missingSignersLower = transaction.missingSigners.map(addr => addr.toLowerCase());
      signed = safeOwners.filter(owner => !missingSignersLower.includes(owner.toLowerCase()));
      notSigned = transaction.missingSigners;
    } else {
      const signedAddresses = transaction.confirmations.map(c => c.owner.toLowerCase());
      signed = safeOwners.filter(owner => signedAddresses.includes(owner.toLowerCase()));
      notSigned = safeOwners.filter(owner => !signedAddresses.includes(owner.toLowerCase()));
    }

    const addSignerLine = (signerList: string[], label: string, icon: string) => {
      if (signerList.length > 0) {
        const signerNames = signerList.map(addr => getSignerHandle(addr, signers)).join(', ');
        message += `    ${icon} ${label}: ${signerNames}\n`;
      }
    };

    if (options.showConfirmedSigner) {
      addSignerLine(signed, 'Signed', '✔️ ');
    }
    if (options.showPendingSigner) {
      addSignerLine(notSigned, 'Not Signed', '⏳');
    }
  }

  return message;
}

/**
 * Fetch queued transaction data for all configured Safes
 * This function efficiently groups API calls by chain and handles errors gracefully
 */
export async function fetchAllQueuedTransactions(
  safes: SafeAddress[],
  options: FormatOptions,
  debug = false
): Promise<QueuedTransactionData[]> {
  if (debug) {
    console.log(`[Debug] Fetching data for ${safes.length} safes`);
  }

  // Group safes by chain to minimize API calls
  const safesByChain = safes.reduce(
    (acc, safe) => {
      if (!acc[safe.chain]) acc[safe.chain] = [];
      acc[safe.chain].push(safe.address);
      return acc;
    },
    {} as Record<ChainName, string[]>
  );

  const results: QueuedTransactionData[] = [];

  // Process each chain sequentially to avoid rate limiting
  for (const [chain, addresses] of Object.entries(safesByChain)) {
    const chainKey = chain as ChainName;

    for (const address of addresses) {
      try {
        // Fetch transactions and Safe info in parallel for efficiency
        const [transactions, safeInfo] = await Promise.all([
          fetchQueuedTransactions(address, chainKey, debug),
          options.showConfirmedSigner || options.showPendingSigner
            ? fetchSafeInfo(address, chainKey)
            : Promise.resolve(null),
        ]);

        // Skip if no transactions found
        if (transactions.length === 0) {
          if (debug) {
            console.log(`[Debug] No queued transactions for ${address} on ${chain}`);
          }
          continue;
        }

        // Fetch transaction notes if enabled
        if (options.showTxNote) {
          for (const tx of transactions) {
            try {
              const txDetails = await fetchTransactionDetails(tx.id, chainKey);
              if (txDetails?.note) {
                tx.note = txDetails.note;
              }
            } catch (error) {
              if (debug) {
                console.log(`[Debug] Failed to fetch note for transaction ${tx.id}:`, error);
              }
            }
          }
        }

        const safeUrl = generateSafeUrl(address, chainKey);

        results.push({
          chain: chainKey,
          address,
          transactions,
          safeInfo,
          safeUrl,
        });

        if (debug) {
          console.log(
            `[Debug] Found ${transactions.length} transactions for ${address} on ${chain}`
          );
        }
      } catch (error) {
        console.error(`Failed to fetch data for Safe ${address} on ${chain}:`, error);
      }
    }
  }

  return results;
}

/**
 * Format all transaction data into human-readable messages
 * This creates the final output that will be displayed or sent via notifications
 */
export function formatTransactionData(
  data: QueuedTransactionData[],
  signers: SignerInfo[],
  options: FormatOptions
): { messages: string[]; signerSummary: Record<string, number> } {
  const messages: string[] = [];
  const signerSummary: Record<string, number> = {};

  // Format each Safe's transactions
  for (const { chain, transactions, safeInfo, safeUrl } of data) {
    // Format individual transactions
    const transactionMessages = transactions.map(tx =>
      formatTransactionMessage(tx, chain, safeInfo?.owners, signers, options)
    );

    messages.push(...transactionMessages);
    messages.push(`🔗 Safe URL: ${safeUrl}\n`);

    // Count missing signatures per signer
    for (const tx of transactions) {
      if (tx.missingSigners) {
        for (const signerAddress of tx.missingSigners) {
          const normalizedAddress = signerAddress.toLowerCase();
          signerSummary[normalizedAddress] = (signerSummary[normalizedAddress] || 0) + 1;
        }
      }
    }
  }

  // Add summary of pending signatures by signer
  if (Object.keys(signerSummary).length > 0) {
    for (const [address, count] of Object.entries(signerSummary)) {
      const signerName = getSignerHandle(address, signers, '@');
      messages.push(`   • ${signerName}: ${count} signature${count > 1 ? 's' : ''} needed`);
    }
  }

  messages.push('\n\n');

  return { messages, signerSummary };
}

/**
 * Main governance tracking function
 * This is the primary entry point that orchestrates the entire process
 */
export async function monitorSafeWalletQueue(
  config: SafeWalletMonitorConfig
): Promise<SafeWalletMonitorResult> {
  const { safes, signers, formatOptions, notifications, debug = false } = config;

  if (debug) {
    console.log('[Debug] Starting governance tracking...');
    console.log(
      `[Debug] Monitoring ${safes.length} safes across ${new Set(safes.map(s => s.chain)).size} chains`
    );
  }

  // Validate configuration
  if (!Array.isArray(safes) || safes.length === 0) {
    throw new Error('No safes provided in configuration');
  }

  // Fetch all transaction data
  const transactionData = await fetchAllQueuedTransactions(safes, formatOptions, debug);

  // Calculate total transactions
  const totalTransactions = transactionData.reduce(
    (sum, data) => sum + data.transactions.length,
    0
  );

  if (debug) {
    console.log(`[Debug] Found ${totalTransactions} total queued transactions`);
  }

  // Format the data for display
  const { messages, signerSummary } = formatTransactionData(
    transactionData,
    signers,
    formatOptions
  );

  // Create the final message
  const finalMessage = messages.join('\n');

  // Send notifications if transactions were found
  if (totalTransactions > 0 && notifications.length > 0) {
    if (debug) {
      console.log(`[Debug] Sending notifications via ${notifications.length} channel(s)`);
    }

    try {
      await sendNotifications(notifications, finalMessage);
    } catch (error) {
      console.error('Failed to send some notifications:', error);
    }
  } else if (debug) {
    console.log('[Debug] No transactions found or no notifications configured');
  }

  return {
    totalTransactions,
    messages,
    signerSummary,
    rawData: transactionData,
  };
}

/**
 * Create a default configuration with well-known DAO safes and signers
 * This provides a good example for common use cases
 */
export function createDefaultConfig(): SafeWalletMonitorConfig {
  // Well-known DAO signers (using public addresses from major DAOs)
  const defaultSigners: SignerInfo[] = [
    // Origin Dollar signers (examples)
    { address: '0x530d3F8C38C262a619C2686A7f1481815a5e6f92', handle: 'OriginDollarSigner1' },
    { address: '0xa96bD9c5D0b169f73c1c8570600aE0BAc9b2A7f4', handle: 'OriginDollarSigner2' },

    // Balancer DAO signers (examples)
    { address: '0x119de05a00bd4e75c4ad6041b82d7afa984ab1b9:', handle: 'BalancerSigner1' },
    { address: '0x11761c7b08287d9489cd84c04df6852f5c07107b:', handle: 'BalancerSigner2' },
  ];
  // Well-known DAO treasury safes
  const defaultSafes: SafeAddress[] = [
    // Origin Dollar Multisig
    { address: '0xbe2AB3d3d8F6a32b96414ebbd865dBD276d3d899', chain: 'mainnet' },
    // Origin Buyback Operator Multichain
    { address: '0x4FF1b9D9ba8558F5EAfCec096318eA0d8b541971', chain: 'mainnet' },
    { address: '0x4FF1b9D9ba8558F5EAfCec096318eA0d8b541971', chain: 'base' },
    // Balancer DAO
    { address: '0xc38c5f97B34E175FFd35407fc91a937300E33860', chain: 'mainnet' },
  ];

  return {
    safes: defaultSafes,
    signers: defaultSigners,
    formatOptions: {
      showConfirmedSigner: false,
      showPendingSigner: true,
      showStatusIcon: true,
      showChainIcon: true,
      showTxNote: true,
    },
    notifications: [
      {
        type: 'console',
        enabled: true,
        colored: true,
      },
    ],
    debug: false,
  };
}

// Export types and utilities for programmatic usage
export * from './types';
export * from './safe-api';
export * from './notifications';
