# Contributing to SideBy

Thank you for your interest in contributing to SideBy! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/sideby.git`
3. Install dependencies: `pnpm install`
4. Copy `.env.example` to `.env` and fill in required values
5. Run the dev server: `pnpm dev`

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (or Neon account)
- Redis (or Upstash account)
- Clerk account

### Environment Variables

See `frontend/.env.example` for all required and optional environment variables.

Key required variables:
- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `DEEPSEEK_API_KEY`

## Code Style

- We use TypeScript for all new code
- Follow the existing code style in the files you modify
- Run `pnpm lint` before committing
- Prefer explicit types over `any`

## Making Changes

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Add or update tests as needed
4. Ensure the build passes: `pnpm build`
5. Commit your changes with a clear message
6. Push to your fork
7. Open a pull request

## Commit Messages

Use clear, descriptive commit messages:

- `feat: add dark mode toggle`
- `fix: resolve comparison loading issue`
- `docs: update API documentation`
- `refactor: simplify rate limiter logic`

## Pull Request Process

1. Update the README.md or relevant documentation if needed
2. Ensure all CI checks pass
3. Request review from maintainers
4. Address review feedback
5. Squash commits if requested

## Reporting Issues

When reporting bugs, please include:

- A clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable

## Security Issues

Please do not open public issues for security vulnerabilities. See [SECURITY.md](./SECURITY.md) for responsible disclosure.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intent

## Questions?

Feel free to open a discussion or reach out to the maintainers.
