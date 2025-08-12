# Safe Wallet Monitor

A powerful utility for monitoring multi-signature transactions across multiple blockchain networks. This tool helps DAOs, protocols, and individuals stay on top of pending transactions that require signatures.

> **🔒 Security Note**: This package handles sensitive data like API keys and wallet addresses. Please review our [Security Guidelines](../../SECURITY.md) before configuration.

## 🚀 Project Overview

The Safe Wallet Monitor monitors Gnosis Safe (now Safe) multi-signature wallets across multiple blockchain networks and provides real-time information about:

- **Queued Transactions**: Pending transactions waiting for signatures
- **Signature Status**: Who has signed and who still needs to sign
- **Multi-Chain Support**: Track safes across Ethereum, Arbitrum, Optimism, Polygon, and more
- **Flexible Notifications**: Console output, Telegram messages, or custom webhooks
- **Rich Formatting**: Chain icons, status indicators, and signer information


### What is a Safe Wallet?

A Safe (formerly Gnosis Safe) is a multi-signature smart contract wallet that requires multiple signatures to execute transactions. This provides enhanced security by distributing control among multiple parties, making it ideal for:

- **DAOs and Protocol Treasuries**: Protecting large amounts of funds
- **Team Wallets**: Shared control over organizational assets
- **Personal Security**: Multi-device protection for high-value accounts
- **Governance**: Transparent decision-making processes

For more detailed information about Safe wallets, visit the [official Safe documentation](https://docs.safe.global/home/what-is-safe).

### Why This Tool vs. Den Reminders?

While [Den](https://docs.onchainden.com/) provides excellent notifications for individual Safe wallets, managing multiple Safes across different chains can become overwhelming:

#### **Den Approach:**
- ✅ Great for monitoring single Safe wallets
- ✅ Rich notification features
- ❌ Generates separate notifications for each Safe
- ❌ Can become noisy with multiple chains
- ❌ No consolidated view across your entire Safe ecosystem

#### **Safe Wallet Monitor Advantage:**
- ✅ **Consolidated Notifications**: One unified notification covering all your Safes
- ✅ **Multi-Chain Overview**: See the complete picture across 8+ networks
- ✅ **Noise Reduction**: Reduces notification fatigue with aggregated summaries
- ✅ **Actionable Insights**: Clear breakdown of what each signer needs to do
- ✅ **Scalable**: Efficiently handles dozens of Safes without overwhelming users

**Perfect for**: Organizations managing treasury Safes across multiple chains, protocol teams with cross-chain operations, or individuals with complex multi-chain setups.

### Key Technical Advantages

#### **Zero Dependencies & Maximum Portability**
- **No API Keys Required**: Uses only public Safe APIs - no registration or tokens needed
- **Minimal Footprint**: Lightweight codebase perfect for serverless deployments
- **Cost-Effective**: Runs efficiently on AWS Lambda, Vercel Functions, or similar platforms
- **Self-Contained**: All functionality built-in, no external service dependencies

#### **Public API Considerations**
- **Rate Limiting**: Public APIs may throttle requests under heavy usage
- **Best Practice**: Implement reasonable polling intervals (recommended: 12 hours)
- **Reliability**: Safe's public APIs are robust but should be used responsibly

#### **Open Source & Free**
- **🆓 Completely Free**: No licensing fees, subscriptions, or usage limits
- **📝 MIT License**: Copy, modify, and distribute freely
- **🔧 Customizable**: Adapt the code to fit your specific needs
- **🤝 Community Driven**: Contributions and improvements welcome


## 📦 Installation

### Using npm

```bash
npm install -g @onchain-toolkit/safe-wallet-monitor
```

### Using yarn

```bash
yarn global add @onchain-toolkit/safe-wallet-monitor
```

### From source

```bash
git clone git@github.com:doncesarts/onchain-toolkit.git
cd onchain-toolkit/packages/safe-wallet-monitor
npm install
npm run build
npm link
```

## 🛠 Setup Instructions

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **Network Access**: Internet connection to access Safe API endpoints
- **Optional**: Telegram bot token for notifications (see setup below)

### Environment Variables

⚠️ **Security Warning**: Never commit `.env` files or configuration files with real data to version control.

Create a `.env` file in your project directory (use `.env.example` as a template):

```bash
# Copy the example file and customize with your values
cp .env.example .env
```

```env
# Optional: Telegram notifications
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Optional: Webhook notifications
WEBHOOK_URL=https://your-webhook-endpoint.com/notify
```

> **🔒 Security Best Practices**: 
> - Keep your `.env` file local and never commit it
> - Use environment variables instead of hardcoding sensitive data
> - Regularly rotate API keys and tokens
> - Review our [Security Guidelines](../../SECURITY.md) for complete protection measures

### Telegram Bot Setup (Optional)

To enable Telegram notifications:

1. **Create a Bot**: Message [@BotFather](https://t.me/botfather) on Telegram
2. **Get Token**: Follow instructions to create a bot and get your token
3. **Get Chat ID**: 
   - Add your bot to a chat or group
   - Send a message to the bot
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your chat ID in the response

## 📋 How It Works

### Core Components

The Safe Wallet Monitor consists of several key components working together:

#### 1. **Safe API Integration** (`safe-api.ts`)
- **Purpose**: Interfaces with Gnosis Safe Transaction Service APIs
- **Function**: Fetches Safe information, pending transactions, and transaction details
- **Networks**: Supports 8+ blockchain networks with dedicated API endpoints
- **Error Handling**: Graceful handling of network issues and API rate limits

#### 2. **Transaction Processing** (`index.ts`)
- **Data Fetching**: Efficiently groups API calls by blockchain network
- **Status Calculation**: Determines signature progress and missing signers
- **Formatting**: Converts raw API data into human-readable messages
- **Chain Icons**: Visual indicators for different blockchain networks

#### 3. **Notification System** (`notifications.ts`)
- **Multi-Channel**: Supports console, Telegram, and webhook notifications
- **Parallel Delivery**: Sends notifications simultaneously for speed
- **Error Recovery**: Continues working even if some notification channels fail
- **Extensible**: Easy to add new notification methods

#### 4. **Command Line Interface** (`cli.ts`)
- **Configuration**: Supports file-based config, environment variables, and CLI arguments
- **Validation**: Ensures all required parameters are provided
- **Help System**: Built-in help and examples for all commands

### Transaction Flow

1. **Configuration Loading**: Reads Safe addresses and signer information
2. **Data Fetching**: Queries Safe APIs for pending transactions
3. **Processing**: Calculates signature status and formats output
4. **Notification**: Sends alerts through configured channels
5. **Summary**: Provides action items for each signer

## 💡 Example Usage

### Basic Command Line Usage

```bash
# Track default DAOs (Uniswap, Compound, Aave)
safe-wallet-monitor track

# Track specific safes
safe-wallet-monitor track \
  --safes "0xbe2AB3d3d8F6a32b96414ebbd865dBD276d3d899:mainnet,0x6626593C237f530D15aE9980A95ef938Ac15c35c:arbitrum" \
  --signers "0x530d3F8C38C262a619C2686A7f1481815a5e6f92:Alice,0xa96bD9c5D0b169f73c1c8570600aE0BAc9b2A7f4:Bob"

# Enable Telegram notifications
safe-wallet-monitor track \
  --telegram \
  --telegram-token "YOUR_BOT_TOKEN" \
  --telegram-chat "YOUR_CHAT_ID"

# Use configuration file
safe-wallet-monitor config --output my-config.json
safe-wallet-monitor track --config my-config.json
```

### Programmatic Usage

```typescript
import { monitorSafeWalletQueue, createDefaultConfig } from '@onchain-toolkit/safe-wallet-monitor';
import { createNotificationConfigs } from '@onchain-toolkit/safe-wallet-monitor';

// Create custom configuration
const config = {
  safes: [
    { address: '0xbe2AB3d3d8F6a32b96414ebbd865dBD276d3d899', chain: 'mainnet' },
    { address: '0x6626593C237f530D15aE9980A95ef938Ac15c35c', chain: 'arbitrum' },
  ],
  signers: [
    { address: '0x530d3F8C38C262a619C2686A7f1481815a5e6f92', handle: 'Alice' },
    { address: '0xa96bD9c5D0b169f73c1c8570600aE0BAc9b2A7f4', handle: 'Bob' },
  ],
  formatOptions: {
    showPendingSigner: true,
    showChainIcon: true,
    showStatusIcon: true,
    showTxNote: true,
  },
  notifications: [
    createNotificationConfigs.console(true),
    createNotificationConfigs.telegram('BOT_TOKEN', 'CHAT_ID'),
  ],
};

// Execute tracking
const result = await monitorSafeWalletQueue(config);
console.log(`Found ${result.totalTransactions} pending transactions`);
```

### Configuration File Example

```json
{
  "safes": [
    {
      "address": "0xbe2AB3d3d8F6a32b96414ebbd865dBD276d3d899",
      "chain": "mainnet"
    },
    {
      "address": "0x6626593C237f530D15aE9980A95ef938Ac15c35c",
      "chain": "arbitrum"
    }
  ],
  "signers": [
    {
      "address": "0x530d3F8C38C262a619C2686A7f1481815a5e6f92",
      "handle": "Alice"
    },
    {
      "address": "0xa96bD9c5D0b169f73c1c8570600aE0BAc9b2A7f4",
      "handle": "Bob"
    }
  ],
  "formatOptions": {
    "showConfirmedSigner": false,
    "showPendingSigner": true,
    "showStatusIcon": true,
    "showChainIcon": true,
    "showTxNote": true
  },
  "notifications": [
    {
      "type": "console",
      "enabled": true,
      "colored": true
    },
    {
      "type": "telegram",
      "enabled": true,
      "botToken": "YOUR_BOT_TOKEN",
      "chatId": "YOUR_CHAT_ID",
      "disableNotification": true,
      "parseMode": "HTML"
    }
  ],
  "debug": false
}
```

## 📜 Available Scripts

When working with the source code, these npm scripts are available:

### Development Scripts

```bash
# Build the project
npm run build

# Development mode with auto-rebuild
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

### CLI Commands

```bash
# Generate sample configuration
safe-wallet-monitor config

# Track with default settings
safe-wallet-monitor track

# Track with custom options
safe-wallet-monitor track --safes "address:chain" --debug

# Show help
safe-wallet-monitor --help
safe-wallet-monitor track --help
```

## 📊 Sample Output

### Console Output

```
🔍 Tracking 3 Safe(s) across 2 chain(s)...

⚫ MAINNET - Tx 42 🏅 3/3
    📝 Note: Treasury allocation for Q4 rewards
    ⏳ Not Signed: Alice, Bob
🔗 Safe URL: https://app.safe.global/home?safe=eth:0xbe2AB3d3d8F6a32b96414ebbd865dBD276d3d899

🔵 ARBITRUM - Tx 15 ⚠️ 1/3
    📝 Note: Bridge funds to Optimism
    ⏳ Not Signed: Alice, Bob, Charlie
🔗 Safe URL: https://app.safe.global/home?safe=arbitrum:0x6626593C237f530D15aE9980A95ef938Ac15c35c

📊 Status Summary:
   Alice: 2 signature(s) needed
   Bob: 2 signature(s) needed
   Charlie: 1 transaction to sign

📊 Summary: Found 2 queued transaction(s)

📋 Action Required:
   • Alice: 2 signature(s) needed
   • Bob: 2 signature(s) needed
   • Charlie: 1 signature(s) needed
```

### Telegram Notification

The tool sends rich HTML-formatted messages to Telegram:

```
🔍 <b>Governance Alert</b>

⚫ MAINNET - Tx 42 🏅 3/3
📝 Treasury allocation for Q4 rewards
⏳ <i>Pending:</i> Alice, Bob

🔵 ARBITRUM - Tx 15 ⚠️ 1/3  
📝 Bridge funds to Optimism
⏳ <i>Pending:</i> Alice, Bob, Charlie

<b>📊 Summary:</b> 2 transactions need attention
```

## 🔧 Advanced Configuration

### Format Options

Control what information is displayed:

```typescript
formatOptions: {
  showConfirmedSigner: false,    // Show who already signed
  showPendingSigner: true,       // Show who needs to sign
  showStatusIcon: true,          // Show 🏅, ⚠️ icons
  showChainIcon: true,           // Show ⚫, 🔵 network icons
  showTxNote: true,              // Show transaction descriptions
}
```

### Notification Channels

Configure multiple notification methods:

```typescript
notifications: [
  // Console with colors
  {
    type: 'console',
    enabled: true,
    colored: true
  },
  
  // Telegram bot
  {
    type: 'telegram',
    enabled: true,
    botToken: 'your-bot-token',
    chatId: 'your-chat-id',
    disableNotification: false,
    parseMode: 'HTML'
  },
  
  // Custom webhook
  {
    type: 'webhook',
    enabled: true,
    url: 'https://hooks.slack.com/your-webhook',
    headers: {
      'Content-Type': 'application/json'
    }
  }
]
```

### Supported Networks

The tool supports tracking across multiple blockchain networks:

- **Ethereum Mainnet** (`mainnet`) - Chain ID: 1
- **Arbitrum** (`arbitrum`) - Chain ID: 42161  
- **Optimism** (`optimism`) - Chain ID: 10
- **Polygon** (`polygon`) - Chain ID: 137
- **Gnosis Chain** (`gnosis`) - Chain ID: 100
- **Base** (`base`) - Chain ID: 8453
- **Avalanche** (`avalanche`) - Chain ID: 43114
- **Polygon zkEVM** (`zkevm`) - Chain ID: 1101

## 🐛 Troubleshooting

### Common Issues

1. **No transactions found**: Ensure Safe addresses are correct and have pending transactions
2. **API errors**: Check network connectivity and try again later
3. **Telegram not working**: Verify bot token and chat ID are correct
4. **CLI not found**: Ensure package is installed globally or use npx:
   ```bash
   # If not installed globally, use npx
   npx @onchain-toolkit/safe-wallet-monitor track
   
   # Or install globally first
   npm install -g @onchain-toolkit/safe-wallet-monitor
   safe-wallet-monitor track
   ```

### Debug Mode

Enable debug logging for detailed information:

```bash
safe-wallet-monitor track --debug
```

This shows:
- API calls being made
- Transaction processing steps
- Notification delivery status
- Error details and stack traces

### Verification Steps

1. **Test Safe Address**: Verify in Safe web interface
2. **Check Network**: Ensure the specified chain is correct
3. **Validate Config**: Use `safe-wallet-monitor config` to generate sample
4. **Test Notifications**: Start with console-only, then add other channels

## ⏰ Automated Monitoring

For continuous monitoring without manual intervention, you can set up the Safe Wallet Monitor to run automatically using cron jobs.

📋 **[Complete Cron Setup Guide](./CRON_SETUP.md)** - Detailed instructions for setting up automated monitoring on macOS with:
- Shell script creation and configuration
- Cron job scheduling options
- Environment variable management
- Error handling and logging
- Troubleshooting common issues

## 🤝 Contributing

This is part of the OnChain Toolkit monorepo. Contributions are welcome!

## 📄 License

MIT License - see the [LICENSE](../../LICENSE) file for details.

---

**Author**: doncesarts  
**Part of**: [OnChain Toolkit](../../README.md)
