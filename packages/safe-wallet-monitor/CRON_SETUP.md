# Automated Monitoring with Cron (macOS)

For continuous monitoring, you can set up the Safe Wallet Monitor to run automatically using cron on macOS.

## Prerequisites

1. **Install the package globally**:
   ```bash
   npm install -g @onchain-toolkit/safe-wallet-monitor
   ```

2. **Create a configuration file**:
   ```bash
   safe-wallet-monitor config --output ~/safe-wallet-monitor.config.json
   ```

3. **Edit the configuration** with your Safe addresses and notification settings.

## Setting up Cron Job

### Step 1: Create a Shell Script

Create a script that handles the environment and logging:

```bash
# Create the script file
nano ~/scripts/safe-monitor.sh
```

Add the following content:

```bash
#!/bin/bash

# Set up environment
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
export NODE_PATH="/usr/local/lib/node_modules"

# Load environment variables if using .env file
if [ -f ~/.env ]; then
    export $(cat ~/.env | xargs)
fi

# Log file location
LOG_FILE="$HOME/logs/safe-monitor.log"
CONFIG_FILE="$HOME/safe-wallet-monitor.config.json"

# Create log directory if it doesn't exist
mkdir -p "$HOME/logs"

# Add timestamp to log
echo "$(date): Starting Safe Wallet Monitor check..." >> "$LOG_FILE"

# Run the monitor and append output to log
/usr/local/bin/safe-wallet-monitor track --config "$CONFIG_FILE" >> "$LOG_FILE" 2>&1

# Log completion
echo "$(date): Safe Wallet Monitor check completed." >> "$LOG_FILE"
echo "----------------------------------------" >> "$LOG_FILE"
```

### Step 2: Make the Script Executable

```bash
chmod +x ~/scripts/safe-monitor.sh
```

### Step 3: Set up Cron Job

Open the cron editor:

```bash
crontab -e
```

Add one of these cron entries depending on your monitoring frequency:

```bash
# Run every 12 hours (recommended)
0 */12 * * * /Users/$(whoami)/scripts/safe-monitor.sh

# Run daily at 9 AM and 6 PM
0 9,18 * * * /Users/$(whoami)/scripts/safe-monitor.sh

# Run every Monday at 10 AM (weekly check)
0 10 * * 1 /Users/$(whoami)/scripts/safe-monitor.sh
```

### Step 4: Enable Cron Access (macOS Security)

On macOS, you may need to grant cron access to send notifications:

1. **System Preferences** → **Security & Privacy** → **Privacy**
2. Select **Full Disk Access** and add **cron** (`/usr/sbin/cron`)
3. For Terminal notifications, also add your terminal app

### Step 5: Test the Setup

Test your cron job manually:

```bash
# Test the script directly
~/scripts/safe-monitor.sh

# Check the log output
tail -f ~/logs/safe-monitor.log

# List active cron jobs
crontab -l
```

## Advanced Configuration

### Environment Variables for Cron

Create a `.env` file in your home directory for sensitive data:

```bash
# ~/.env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
WEBHOOK_URL=https://your-webhook-endpoint.com/notify
```

### Monitoring Cron Execution

You can set up monitoring for the cron job itself:

```bash
# Add to your safe-monitor.sh script
if [ $? -eq 0 ]; then
    echo "$(date): ✅ Monitor executed successfully" >> "$LOG_FILE"
else
    echo "$(date): ❌ Monitor execution failed with exit code $?" >> "$LOG_FILE"
    # Optional: Send alert about cron failure
    curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
         -d "chat_id=$TELEGRAM_CHAT_ID" \
         -d "text=🚨 Safe Wallet Monitor cron job failed at $(date)"
fi
```

### Log Rotation

To prevent log files from growing too large:

```bash
# Add to your safe-monitor.sh script (before the main execution)
# Keep only last 100 lines of log
if [ -f "$LOG_FILE" ] && [ $(wc -l < "$LOG_FILE") -gt 100 ]; then
    tail -n 50 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi
```

## Troubleshooting Cron Issues

1. **Check cron service is running**:
   ```bash
   sudo launchctl list | grep cron
   ```

2. **Check cron logs**:
   ```bash
   tail -f /var/log/cron.log
   # Or check system logs
   log stream --predicate 'subsystem == "com.apple.cron"'
   ```

3. **Verify paths in cron environment**:
   ```bash
   # Add this to your script to debug path issues
   echo "PATH: $PATH" >> "$LOG_FILE"
   which safe-wallet-monitor >> "$LOG_FILE"
   ```

4. **Common issues**:
   - **PATH not set correctly**: Cron has minimal environment, specify full paths
   - **Node.js not found**: Install Node.js globally or specify full path
   - **Permissions**: Ensure script has execute permissions
   - **macOS Security**: Grant necessary permissions in System Preferences

## Example Complete Setup

```bash
# 1. Install and configure
npm install -g @onchain-toolkit/safe-wallet-monitor
safe-wallet-monitor config --output ~/safe-wallet-monitor.config.json

# 2. Create directories
mkdir -p ~/scripts ~/logs

# 3. Create and edit the monitoring script
nano ~/scripts/safe-monitor.sh
# (Add the script content from above)

# 4. Make executable
chmod +x ~/scripts/safe-monitor.sh

# 5. Test manually
~/scripts/safe-monitor.sh

# 6. Add to cron (every 12 hours)
(crontab -l 2>/dev/null; echo "0 */12 * * * $HOME/scripts/safe-monitor.sh") | crontab -

# 7. Verify cron job
crontab -l
```

This setup will automatically monitor your Safe wallets and send notifications according to your configuration, providing continuous oversight of pending transactions without manual intervention.

## Additional Resources

- [Cron Expression Generator](https://crontab.guru/) - Visual cron schedule expressions
- [macOS Cron Documentation](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/ScheduledJobs.html)
- [Safe Wallet Monitor Main Documentation](./README.md)
