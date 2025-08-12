# Security Guidelines

This document outlines the security measures implemented in this project to protect sensitive information from being exposed to GitHub Copilot, accidentally committed to version control, or otherwise compromised.

## 🔒 Sensitive Data Protection

### What We Consider Sensitive

- **API Keys & Tokens**: Telegram bot tokens, webhook URLs with auth, RPC endpoints
- **Wallet Data**: Private keys, seed phrases, mnemonics, keystore files
- **Configuration Files**: Any file containing actual wallet addresses, signer information, or API credentials
- **Logs**: May contain API responses or debug information with sensitive data
- **Personal Information**: Chat IDs, webhook endpoints, personal wallet addresses

### Protection Mechanisms

#### 1. Enhanced .gitignore Files

**Root Level** (`/.gitignore`):
- Excludes all environment files except `.env.example`
- Blocks configuration files with sensitive data
- Prevents wallet-related files from being committed
- Includes comprehensive patterns for API keys, tokens, and credentials

**Package Level** (`/packages/safe-wallet-monitor/.gitignore`):
- Package-specific sensitive file patterns
- Configuration files that may contain wallet addresses
- Log files that might expose API data

#### 2. GitHub Copilot Protection

**Root Level** (`/.copilotignore`):
- Prevents GitHub Copilot from reading sensitive files
- Blocks AI processing of configuration files
- Excludes logs and temporary files that might contain data

**Package Level** (`/packages/safe-wallet-monitor/.copilotignore`):
- Additional protection for package-specific files
- Ensures local configuration files are not processed by AI

#### 3. Environment Variable Management

**`.env.example` File**:
- Provides template for required environment variables
- Contains placeholder values only
- Safe to commit to version control
- Documents all available configuration options

## 🚨 Critical Security Rules

### Never Commit These Files:
```
.env                                    # Actual environment variables
*.config.json                          # Configuration with real data
safe-wallet-monitor.config.json        # Generated config files
telegram-config.json                   # Bot configurations
logs/                                   # Log files
*secret*, *private*, *credential*       # Any file with sensitive keywords
```

### Safe to Commit:
```
.env.example                           # Template only
*.md                                   # Documentation
src/                                   # Source code (no hardcoded secrets)
package.json                           # Dependencies (no secrets)
```

## 📋 Security Checklist

Before committing any changes:

- [ ] No actual API keys or tokens in code
- [ ] No real wallet addresses in source files
- [ ] No hardcoded sensitive URLs
- [ ] Configuration files use environment variables
- [ ] `.env` file is gitignored
- [ ] Sensitive patterns are in `.copilotignore`

## 🛡️ Best Practices

### 1. Environment Variables
```bash
# ✅ Good - Use environment variables
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

# ❌ Bad - Hardcoded sensitive data
const telegramToken = "1234567890:ABCdefGHIjklMNOpqrsTUVwxyZ";
```

### 2. Configuration Files
```bash
# ✅ Good - Generate config files locally
safe-wallet-monitor config --output my-config.json

# ✅ Good - Use environment variables in config
{
  "notifications": [{
    "botToken": "${TELEGRAM_BOT_TOKEN}",
    "chatId": "${TELEGRAM_CHAT_ID}"
  }]
}

# ❌ Bad - Committing files with real data
git add safe-wallet-monitor.config.json
```

### 3. Development Workflow
```bash
# ✅ Good - Copy example and customize locally
cp .env.example .env
# Edit .env with your actual values

# ✅ Good - Check what you're committing
git diff --cached

# ✅ Good - Use .gitignore patterns
echo "my-personal-config.json" >> .gitignore
```

## 🔍 Verification Commands

### Check for sensitive data before committing:
```bash
# Check for potential API keys in staged files
git diff --cached | grep -i "token\|key\|secret\|password"

# Verify .env is ignored
git check-ignore .env

# List all ignored files
git status --ignored
```

### Verify Copilot exclusions:
```bash
# Check if sensitive files are excluded from Copilot
cat .copilotignore | grep -E "\\.env|\\.config\\.json"
```

## 🚨 What to Do If Sensitive Data is Accidentally Committed

1. **Immediately rotate/regenerate** any exposed credentials
2. **Remove from git history**:
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch path/to/sensitive/file' \
   --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** to overwrite remote history (if you have permission)
4. **Notify team members** to re-clone the repository

## 📞 Security Contacts

If you discover a security issue:
- Create an issue with the "security" label
- Do not include sensitive data in the issue description
- Contact maintainers directly for critical issues

## 🔄 Regular Security Maintenance

- [ ] Review and update `.gitignore` patterns monthly
- [ ] Audit committed files for sensitive data quarterly
- [ ] Rotate API keys and tokens regularly
- [ ] Update documentation when adding new sensitive data types
