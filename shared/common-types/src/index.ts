/**
 * Common Types for OnChain Toolkit
 *
 * This module contains shared TypeScript types and interfaces used across
 * all packages in the onchain-toolkit monorepo. These types ensure consistency
 * and type safety across different utilities.
 */

// Supported blockchain networks
export type ChainName =
  | 'mainnet'
  | 'arbitrum'
  | 'optimism'
  | 'polygon'
  | 'gnosis'
  | 'base'
  | 'avalanche'
  | 'zkevm';

// Network chain IDs mapping for RPC calls
export const chainIds: Record<ChainName, number> = {
  mainnet: 1,
  arbitrum: 42161,
  optimism: 10,
  polygon: 137,
  gnosis: 100,
  base: 8453,
  avalanche: 43114,
  zkevm: 1101,
};

// Notification types and configurations
export type NotificationType = 'console' | 'telegram' | 'webhook';

export interface BaseNotificationConfig {
  type: NotificationType;
  enabled: boolean;
}

export interface ConsoleNotificationConfig extends BaseNotificationConfig {
  type: 'console';
  /** Whether to use colored output (default: true) */
  colored?: boolean;
}

export interface TelegramNotificationConfig extends BaseNotificationConfig {
  type: 'telegram';
  /** Telegram bot token */
  botToken: string;
  /** Telegram chat ID to send messages to */
  chatId: string;
  /** Whether to disable notification sound (default: true) */
  disableNotification?: boolean;
  /** Parse mode for message formatting (default: 'HTML') */
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

export interface WebhookNotificationConfig extends BaseNotificationConfig {
  type: 'webhook';
  /** Webhook URL to send POST requests to */
  url: string;
  /** Optional headers to include in the request */
  headers?: Record<string, string>;
}

export type NotificationConfig =
  | ConsoleNotificationConfig
  | TelegramNotificationConfig
  | WebhookNotificationConfig;

// Error types for better error handling
export class NetworkError extends Error {
  constructor(
    message: string,
    public chain: ChainName,
    public cause?: Error
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class SafeApiError extends Error {
  constructor(
    message: string,
    public safeAddress: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'SafeApiError';
  }
}

export class NotificationError extends Error {
  constructor(
    message: string,
    public notificationType: NotificationType,
    public cause?: Error
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}
