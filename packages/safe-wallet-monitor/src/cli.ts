#!/usr/bin/env node

/**
 * Safe Wallet Monitor CLI
 * 
 * Command-line interface for the Safe Wallet Monitor utility.
 * Supports configuration via command line arguments, environment variables,
 * and configuration files.
 */

import { program } from 'commander';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';

import { monitorSafeWalletQueue, createDefaultConfig } from './index';
import { createNotificationConfigs } from './notifications';
import { SafeAddress, SafeWalletMonitorConfig, SignerInfo } from './types';
import {
  ChainName,
  ConsoleNotificationConfig,
  NotificationConfig,
  TelegramNotificationConfig,
  WebhookNotificationConfig,
} from '@onchain-toolkit/common-types';

// Load environment variables from .env file
config();

/**
 * Parse a JSON string safely, with helpful error messages
 */
function parseJson<T>(jsonString: string, context: string): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error(`Failed to parse JSON for ${context}:`, error);
    process.exit(1);
  }
}

/**
 * Load configuration from a file
 */
function loadConfigFile(filePath: string): Partial<SafeWalletMonitorConfig> {
  if (!existsSync(filePath)) {
    console.error(`Configuration file not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return parseJson<Partial<SafeWalletMonitorConfig>>(content, 'config file');
  } catch (error) {
    console.error(`Failed to read configuration file: ${error}`);
    process.exit(1);
  }
}

/**
 * Parse Safe addresses from command line format
 * Format: "address:chain,address:chain"
 */
function parseSafes(safesString: string): SafeAddress[] {
  return safesString.split(',').map(entry => {
    const [address, chain] = entry.trim().split(':');
    if (!address || !chain) {
      console.error(`Invalid safe format: ${entry}. Expected format: address:chain`);
      process.exit(1);
    }
    return { address: address.trim(), chain: chain.trim() as ChainName };
  });
}

/**
 * Parse signer information from command line format
 * Format: "address:handle,address:handle"
 */
function parseSigners(signersString: string): SignerInfo[] {
  return signersString.split(',').map(entry => {
    const [address, handle] = entry.trim().split(':');
    if (!address || !handle) {
      console.error(`Invalid signer format: ${entry}. Expected format: address:handle`);
      process.exit(1);
    }
    return { address: address.trim(), handle: handle.trim() };
  });
}

/**
 * Create notification configurations based on CLI options and environment variables
 */
function createNotificationConfigsFromCli(options: any) {
  const notifications = [];

  // Console notification (always enabled by default)
  if (options.console !== false) {
    notifications.push(createNotificationConfigs.console(!options.noColor));
  }

  // Telegram notification
  if (options.telegram || process.env.TELEGRAM_BOT_TOKEN) {
    const botToken = options.telegramToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = options.telegramChat || process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Telegram notification requires both bot token and chat ID');
      console.error(
        'Provide via --telegram-token and --telegram-chat or TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars'
      );
      process.exit(1);
    }

    notifications.push(createNotificationConfigs.telegram(botToken, chatId));
  }

  // Webhook notification
  if (options.webhook || process.env.WEBHOOK_URL) {
    const webhookUrl = options.webhook || process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('Webhook URL is required for webhook notifications');
      process.exit(1);
    }

    const headers: Record<string, string> = {};
    if (options.webhookHeaders) {
      const headerPairs = options.webhookHeaders.split(',');
      for (const pair of headerPairs) {
        const [key, value] = pair.split(':').map((s: string) => s.trim());
        if (key && value) {
          headers[key] = value;
        }
      }
    }

    notifications.push(createNotificationConfigs.webhook(webhookUrl, headers));
  }

  return notifications;
}
function updateNotificationConfigs(
  notifications: NotificationConfig[],
  notificationsFromCli: (
    | ConsoleNotificationConfig
    | TelegramNotificationConfig
    | WebhookNotificationConfig
  )[]
): NotificationConfig[] {
  let notificationsUpdated = [] as NotificationConfig[];
  if (notifications && notifications.length > 0) {
    notificationsUpdated = notifications.map(existing => {
      const updated = notificationsFromCli.find(newConfig => newConfig.type === existing.type);
      return updated ? { ...existing, ...updated } : existing;
    });
  } else {
    notificationsUpdated = notificationsFromCli;
  }
  return notificationsUpdated;
}

/**
 * Main CLI program setup
 */
program
  .name('safe-wallet-monitor')
  .description(
    'Monitor and track governance proposals and multi-sig transactions across blockchain networks'
  )
  .version('1.0.0');

program
  .command('track')
  .description('Track queued transactions for configured Safes')
  .option('-c, --config <file>', 'Path to configuration file (JSON)')
  .option('-s, --safes <safes>', 'Comma-separated list of safes (format: address:chain)')
  .option('-g, --signers <signers>', 'Comma-separated list of signers (format: address:handle)')
  .option('--show-confirmed', 'Show which signers have already confirmed transactions')
  .option('--hide-pending', 'Hide which signers still need to sign (default: show)')
  .option('--show-status-icons', 'Show status icons (🏅, ⚠️) based on signature progress')
  .option('--hide-chain-icons', 'Hide chain icons for each network (default: show)')
  .option('--hide-tx-notes', 'Hide transaction notes (default: show)')
  .option('--console <enabled>', 'Enable/disable console output (default: true)')
  .option('--no-color', 'Disable colored console output')
  .option('--telegram', 'Enable Telegram notifications')
  .option('--telegram-token <token>', 'Telegram bot token')
  .option('--telegram-chat <chatId>', 'Telegram chat ID')
  .option('--webhook <url>', 'Webhook URL for notifications')
  .option('--webhook-headers <headers>', 'Webhook headers (format: key:value,key:value)')
  .option('-d, --debug', 'Enable debug logging')
  .action(async options => {
    try {
      let config: SafeWalletMonitorConfig;

      // Load configuration from file if provided
      if (options.config) {
        const fileConfig = loadConfigFile(options.config);
        config = { ...createDefaultConfig(), ...fileConfig };
      } else {
        config = createDefaultConfig();
      }

      // Override with command line options
      if (options.safes) {
        config.safes = parseSafes(options.safes);
      }

      if (options.signers) {
        config.signers = parseSigners(options.signers);
      }

      // Update format options
      config.formatOptions = {
        showConfirmedSigner: options.showConfirmed || config.formatOptions.showConfirmedSigner,
        showPendingSigner: !options.hidePending && config.formatOptions.showPendingSigner,
        showStatusIcon: options.showStatusIcons || config.formatOptions.showStatusIcon,
        showChainIcon: !options.hideChainIcons && config.formatOptions.showChainIcon,
        showTxNote: !options.hideTxNotes && config.formatOptions.showTxNote,
      };

      // Create notification configurations
      config.notifications = updateNotificationConfigs(
        config.notifications,
        createNotificationConfigsFromCli(options)
      );

      // Set debug mode
      if (options.debug) {
        config.debug = true;
      }

      // Validate configuration
      if (!config.safes || config.safes.length === 0) {
        console.error(
          'No safes configured. Provide safes via --safes option or configuration file.'
        );
        console.error('Example: --safes "0x123...abc:mainnet,0x456...def:arbitrum"');
        process.exit(1);
      }

      console.log(
        `🔍 Tracking ${config.safes.length} Safe(s) across ${new Set(config.safes.map(s => s.chain)).size} chain(s)...`
      );

      // Execute the tracking
      const result = await monitorSafeWalletQueue(config);

      // Display results
      if (result.totalTransactions === 0) {
        console.log('✅ No queued transactions found across all monitored Safes');
      } else {
        console.log(`\n📊 Summary: Found ${result.totalTransactions} queued transaction(s)`);

        if (Object.keys(result.signerSummary).length > 0) {
          console.log('\n📋 Action Required:');
          for (const [address, count] of Object.entries(result.signerSummary)) {
            const signer = config.signers.find(
              s => s.address.toLowerCase() === address.toLowerCase()
            );
            const name = signer ? signer.handle : address;
            console.log(`   • ${name}: ${count} signature(s) needed`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      if (options.debug) {
        console.error('Stack trace:', error);
      }
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Generate a sample configuration file')
  .option('-o, --output <file>', 'Output file path (default: safe-wallet-monitor.config.json)')
  .action(options => {
    const outputFile = options.output || 'safe-wallet-monitor.config.json';
    const defaultConfig = createDefaultConfig();

    // Add some example Telegram configuration (with placeholder values)
    defaultConfig.notifications.push({
      type: 'telegram',
      enabled: false,
      botToken: 'YOUR_BOT_TOKEN_HERE',
      chatId: 'YOUR_CHAT_ID_HERE',
      disableNotification: true,
      parseMode: 'HTML',
    });

    try {
      require('fs').writeFileSync(outputFile, JSON.stringify(defaultConfig, null, 2));
      console.log(`📄 Sample configuration written to: ${outputFile}`);
      console.log(
        '\n📝 Edit the file to customize your Safe addresses, signers, and notification settings'
      );
      console.log('💡 Run with: safe-wallet-monitor track --config', outputFile);
    } catch (error) {
      console.error('❌ Failed to write configuration file:', error);
      process.exit(1);
    }
  });

// Handle cases where no command is provided
if (process.argv.length === 2) {
  program.help();
}

// Parse command line arguments
program.parse();
