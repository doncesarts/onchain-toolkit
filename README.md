# OnChain Toolkit

A comprehensive suite of utilities to streamline blockchain operations for individuals, teams, and DAOs.

## Author

**doncesarts**

## Overview

OnChain Toolkit provides a collection of modular utilities designed to simplify on-chain and off-chain operations across multiple blockchain networks. Whether you're managing personal DeFi positions, coordinating DAO governance, or automating treasury operations, these tools help streamline your workflow.

## Packages

### Core Utilities
- **safe-wallet-monitor** - Monitor and track governance proposals across protocols

### Shared Infrastructure
- **blockchain-client** - Unified blockchain interaction layer
- **common-types** - Shared TypeScript types and interfaces
- **utils** - Common utility functions and helpers

## Getting Started

```bash
# Clone the repository
git clone https://github.com/doncesarts/onchain-toolkit.git
cd onchain-toolkit

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

## Architecture

This monorepo uses a modular architecture where each utility is a standalone package that can be used independently or in combination with others. Shared code is organized in the `shared/` directory to promote code reuse and maintain consistency.

## Contributing

Contributions are welcome! Please read our contributing guidelines and code of conduct before submitting pull requests.

## License

MIT License - see LICENSE file for details.
