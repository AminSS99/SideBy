# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in SideBy, please report it responsibly:

1. **Do not** open a public issue
2. Email security concerns to: security@sideby.dev (or the project maintainer)
3. Include a detailed description of the vulnerability
4. Provide steps to reproduce if possible
5. Allow reasonable time for remediation before public disclosure

## What to Expect

- Acknowledgment within 48 hours
- Regular updates on progress
- Credit in the release notes (unless you prefer anonymity)

## Security Measures

SideBy implements the following security practices:

- All API routes require authentication via Clerk
- Rate limiting on expensive endpoints (comparisons, follow-ups, exports)
- Input validation using Zod schemas
- SQL injection prevention via parameterized queries (Drizzle ORM)
- XSS protection via Content Security Policy
- CSRF protection via SameSite cookies
- API keys are never exposed to the frontend
- Request signing for webhooks

## Dependency Security

We regularly update dependencies to patch known vulnerabilities. You can check for issues:

```bash
pnpm audit
```

## Self-Hosting Security

If self-hosting SideBy, ensure:

- `NODE_ENV=production` in production
- All environment variables are properly set
- Database uses SSL/TLS connections
- Redis uses authenticated connections
- Regular backups are configured
