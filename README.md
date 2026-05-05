# Traffic Flow Optimizer

A monorepo project for optimizing traffic flow management with a React frontend and API server backend.

## Project Structure

- **artifacts/api-server** - Backend API server
- **artifacts/traffic-mgmt** - React frontend application
- **artifacts/mockup-sandbox** - Sandbox environment for testing
- **lib/** - Shared libraries (API client, specs, database)

## Prerequisites

- Node.js v18+
- pnpm (package manager)

## Installation

```bash
pnpm install
```

## Development

### Frontend
```bash
cd artifacts/traffic-mgmt
pnpm dev
```

### Backend
```bash
cd artifacts/api-server
pnpm dev
```

## Build

```bash
pnpm run build
```

## Type Checking

```bash
pnpm run typecheck
```

## License

MIT
