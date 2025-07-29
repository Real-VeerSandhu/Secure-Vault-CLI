# SecureVault CLI

A secure, interactive command-line password manager built with TypeScript, featuring encryption and an intuitive user experience.

## Features

### Security-First Design
- **AES-256-CBC Encryption** with PBKDF2 key derivation
- **100,000 PBKDF2 iterations** for protection against brute force attacks
- **Cryptographically secure random salts** prevent rainbow table attacks
- **Random initialization vectors (IVs)** for each encryption operation
- **Zero-knowledge architecture** - master password never stored in plaintext
- **Secure memory handling** with proper cleanup

### Interactive User Experience
- **Intuitive CLI interface** with colored output and clear navigation
- **Smart search functionality** across sites and usernames
- **Secure clipboard integration** for password copying
- **Interactive password generation** with customizable policies
- **Real-time password strength analysis** with actionable feedback
- **Comprehensive password audit system** detects weak and reused passwords

### Technical Features
- **TypeScript implementation** with full type safety
- **Modular architecture** with clean separation of concerns
- **Encrypted vault storage** with automatic locking/unlocking
- **Cross-platform compatibility** (Windows, macOS, Linux)
- **Zero external dependencies** for core crypto operations
- **Extensible design** for future enhancements

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/securevault-cli.git
cd securevault-cli

# Install dependencies
npm install

# Build the project
npm run build

# Run the application
npm run dev
```

### Global Installation (Optional)
```bash
# Make it available globally
npm link
securevault
```

## Technical Architecture

### Cryptographic Implementation
```typescript
// Key derivation using PBKDF2
static deriveKey(password: string, salt: string): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 100000
  }).toString();
}

// AES-256-CBC encryption with random IV
static encrypt(data: string, password: string): string {
  const salt = CryptoJS.lib.WordArray.random(128/8);
  const key = this.deriveKey(password, salt.toString());
  const iv = CryptoJS.lib.WordArray.random(16);
  
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return salt.toString() + ':' + iv.toString() + ':' + encrypted.toString();
}
```

### Security Features
- **Salt-based encryption**: Each vault uses a unique random salt
- **IV randomization**: Every encryption operation uses a fresh random IV
- **Key stretching**: PBKDF2 with 100,000 iterations makes brute force attacks computationally expensive
- **Secure storage format**: `salt:iv:ciphertext` prevents cryptographic attacks
- **Memory protection**: Sensitive data cleared from memory after use

### Data Structure
```typescript
interface VaultEntry {
  id: string;
  site: string;
  username: string;
  password: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface VaultData {
  entries: VaultEntry[];
  version: string;
}
```

## Usage

### Basic Commands
```bash
# Start the application
npm run dev

# Build for production
npm run build

# Run built version
node dist/index.js
```

### Core Features

#### **Search & Retrieve**
- Fuzzy search across sites and usernames
- Instant results with highlighted matches
- Secure clipboard integration
- Password masking with reveal option

#### **Add New Passwords**
- Manual password entry
- Integrated password generation
- Optional notes and metadata
- Automatic timestamp tracking

#### **Password Generation**
- Customizable length (4-128 characters)
- Character set options (uppercase, lowercase, numbers, symbols)
- Similar character exclusion (i, l, 1, L, o, 0, O)
- Real-time strength analysis

#### **Security Audit**
- Weak password detection
- Duplicate password identification
- Comprehensive security scoring
- Actionable recommendations

## Security Considerations

### Encryption Standards
- **Algorithm**: AES-256-CBC (Advanced Encryption Standard)
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 100,000 (exceeds OWASP recommendations)
- **Salt Length**: 128 bits (16 bytes)
- **IV Length**: 128 bits (16 bytes)

### Attack Resistance
- **Brute Force**: 100,000 PBKDF2 iterations make attacks computationally expensive
- **Rainbow Tables**: Unique random salts prevent precomputed attacks
- **Pattern Analysis**: Random IVs prevent ciphertext pattern recognition
- **Side-Channel**: Constant-time operations where possible

### Data Protection
- **At Rest**: All vault data encrypted with AES-256
- **In Transit**: No network communication (local-only)
- **In Memory**: Sensitive data cleared after use
- **Backup**: Encrypted vault file can be safely backed up

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│       CLI       │    │      Vault      │    │     Crypto      │
│   Interface     │────│   Management    │────│   Operations    │
│   (inquirer)    │    │   (CRUD ops)    │    │   (AES-256)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Generator     │    │   File System   │    │   Clipboard     │
│  (Passwords)    │    │  (Encrypted)    │    │  Integration    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technical Specifications

### Dependencies
```json
{
  "dependencies": {
    "chalk": "^4.1.2",        // Terminal colors
    "clipboardy": "^2.3.0",   // Clipboard operations
    "crypto-js": "^4.1.1",    // Cryptographic functions
    "inquirer": "^8.2.4"      // Interactive prompts
  },
  "devDependencies": {
    "@types/crypto-js": "^4.1.1",
    "@types/inquirer": "^8.2.3",
    "@types/node": "^18.15.0",
    "ts-node": "^10.9.1",
    "typescript": "^4.9.5"
  }
}
```

### File Structure
```
src/
├── index.ts      # Application entry point
├── cli.ts        # Command-line interface
├── vault.ts      # Vault management and CRUD operations
├── crypto.ts     # Cryptographic operations
└── generator.ts  # Password generation and analysis
```

### Development Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests (coming soon)
npm test
```

### Code Standards
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for consistent formatting
- Comprehensive type definitions
