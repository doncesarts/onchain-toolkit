/**
 * Notification System
 *
 * This module provides a flexible notification system that supports multiple
 * notification methods (console, Telegram, webhooks). It's designed to be
 * extensible for adding new notification channels in the future.
 */

import axios from 'axios';
import {
  NotificationConfig,
  ConsoleNotificationConfig,
  TelegramNotificationConfig,
  WebhookNotificationConfig,
  NotificationError,
} from '@onchain-toolkit/common-types';

/**
 * Send a message using console output with optional color formatting
 * This is the simplest notification method, useful for development and local usage
 */
async function sendConsoleNotification(
  config: ConsoleNotificationConfig,
  message: string
): Promise<void> {
  if (!config.enabled) return;

  if (config.colored !== false) {
    // Add some basic color formatting for better readability
    const coloredMessage = message
      .replace(/🏅/g, '\x1b[32m🏅\x1b[0m') // Green for ready
      .replace(/⚠️/g, '\x1b[33m⚠️\x1b[0m') // Yellow for warning
      .replace(/✔️/g, '\x1b[32m✔️\x1b[0m') // Green for confirmed
      .replace(/⏳/g, '\x1b[36m⏳\x1b[0m'); // Cyan for pending

    console.log(coloredMessage);
  } else {
    console.log(message);
  }
}

/**
 * Send a message via Telegram using the Bot API
 * This is useful for remote monitoring and team notifications
 */
async function sendTelegramNotification(
  config: TelegramNotificationConfig,
  message: string
): Promise<void> {
  if (!config.enabled) return;

  if (!config.botToken) {
    throw new NotificationError('Telegram bot token is required', 'telegram');
  }

  if (!config.chatId) {
    throw new NotificationError('Telegram chat ID is required', 'telegram');
  }

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;

    const requestData = {
      chat_id: config.chatId,
      text: message,
      disable_notification: config.disableNotification !== false,
      parse_mode: config.parseMode || 'HTML',
      link_preview_options: {
        is_disabled: true, // Disable link previews to keep messages clean
      },
    };

    await axios.post(url, requestData);
  } catch (error) {
    throw new NotificationError(
      `Failed to send Telegram notification: ${error}`,
      'telegram',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Send a message to a webhook endpoint
 * This allows integration with custom systems, Slack, Discord, etc.
 */
async function sendWebhookNotification(
  config: WebhookNotificationConfig,
  message: string
): Promise<void> {
  if (!config.enabled) return;

  try {
    const requestData = {
      text: message,
      timestamp: new Date().toISOString(),
    };

    await axios.post(config.url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });
  } catch (error) {
    throw new NotificationError(
      `Failed to send webhook notification: ${error}`,
      'webhook',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Send notifications using all configured notification methods
 * This is the main entry point for the notification system
 */
export async function sendNotifications(
  configs: NotificationConfig[],
  message: string
): Promise<void> {
  const errors: Error[] = [];

  // Send notifications in parallel for better performance
  const notificationPromises = configs.map(async config => {
    try {
      switch (config.type) {
        case 'console':
          await sendConsoleNotification(config, message);
          break;
        case 'telegram':
          await sendTelegramNotification(config, message);
          break;
        case 'webhook':
          await sendWebhookNotification(config, message);
          break;
        default:
          console.warn(`Unknown notification type: ${(config as any).type}`);
      }
    } catch (error) {
      console.error(`Failed to send ${config.type} notification: ${error}`);
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  });

  await Promise.all(notificationPromises);

  // Report any errors that occurred during notification sending
  if (errors.length > 0) {
    console.error(`${errors.length} notification(s) failed:`);
    errors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error.message}`);
    });
  }
}

/**
 * Helper function to create common notification configurations
 */
export const createNotificationConfigs = {
  console: (colored = true): ConsoleNotificationConfig => ({
    type: 'console',
    enabled: true,
    colored,
  }),

  telegram: (botToken: string, chatId: string): TelegramNotificationConfig => ({
    type: 'telegram',
    enabled: true,
    botToken,
    chatId,
    disableNotification: true,
    parseMode: 'HTML',
  }),

  webhook: (url: string, headers?: Record<string, string>): WebhookNotificationConfig => ({
    type: 'webhook',
    enabled: true,
    url,
    headers,
  }),
};
