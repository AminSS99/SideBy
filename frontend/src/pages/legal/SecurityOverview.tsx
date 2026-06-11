import React from "react";
import LegalPageShell from "./LegalPageShell";
import { brand } from "@/config/brand";

const SecurityOverview = () => {
  return (
    <LegalPageShell title="Security Overview" lastUpdated="June 9, 2026">
      <p>
        At {brand.companyName}, we understand that security, privacy, and data integrity are critical when you choose {brand.productName} for competitive research and strategic comparisons. This Security Overview outlines the measures we take to protect your data, secure our platform, and maintain your trust.
      </p>

      <h2>1. Data Protection & Encryption</h2>
      <p>
        We employ industry-standard encryption practices to protect your data both in transit and at rest:
      </p>
      <ul>
        <li><strong>In Transit:</strong> All communications between your browser, our client applications, and our API servers are encrypted using Transport Layer Security (TLS 1.3) with strong cipher suites.</li>
        <li><strong>At Rest:</strong> Our relational databases (Neon Postgres) and caches (Upstash Redis) are fully encrypted at rest using AES-256. Database backups are also encrypted.</li>
        <li><strong>Vercel Blob Storage:</strong> Documents uploaded to your custom Knowledge Base are stored in secure buckets using AES-256 server-side encryption.</li>
      </ul>

      <h2>2. Database & Row Level Security (RLS)</h2>
      <p>
        SideBy enforces multi-tenant boundary checks throughout the database:
      </p>
      <ul>
        <li>Every workspace, project, comparison, and knowledge source is tied to a specific user id or organization id.</li>
        <li>Database queries are scoped explicitly using Drizzle ORM to verify that the requesting authenticated session has permissions for the resource.</li>
        <li>Public comparisons are only viewable by URL slug after a user explicitly changes the visibility from `private` to `public`.</li>
      </ul>

      <h2>3. API Security & Key Management</h2>
      <p>
        For developers utilizing our integration API keys:
      </p>
      <ul>
        <li><strong>Hashing:</strong> API keys are never stored in plaintext on our servers. We generate a unique prefix for identification and store a cryptographic SHA-256 hash of the key.</li>
        <li><strong>Authentication:</strong> API endpoints verify incoming keys by comparing their hashes using timing-safe comparisons to prevent side-channel attacks.</li>
        <li><strong>Revocation:</strong> Keys can be instantly rotated or revoked via the Settings dashboard to stop subsequent authorization checks.</li>
      </ul>

      <h2>4. AI Model & Data Confidentiality</h2>
      <p>
        When you run a research query or upload files to your Knowledge Base:
      </p>
      <ul>
        <li>Your data is parsed and formatted into context payloads for our LLM providers (such as DeepSeek or Google).</li>
        <li><strong>Zero Training Retention:</strong> We configure all API requests to opt-out of data logging and model training. None of your proprietary data or queries are used to train public models.</li>
        <li><strong>No Cache Leakage:</strong> Comparisons are cached locally using Upstash Redis. Cache entries are partitioned strictly by tenant so that proprietary research is never leaked between different workspaces.</li>
      </ul>

      <h2>5. Compliance & Infrastructure</h2>
      <p>
        SideBy is built on top of modern, compliant infrastructure:
      </p>
      <ul>
        <li>Our backend code runs inside Vercel Serverless Functions, benefitting from isolated container environments.</li>
        <li> Neon Postgres operates on secure AWS clouds and complies with SOC 2 Type II certifications.</li>
        <li>We enforce Content Security Policies (CSP), HSTS, and X-Frame-Options to mitigate Cross-Site Scripting (XSS) and Clickjacking.</li>
      </ul>

      <h2>6. Incident Response</h2>
      <p>
        If you discover a security vulnerability, please report it immediately to our security team at <a href={`mailto:security@${brand.domain}`}>security@${brand.domain}</a>. We support responsible disclosure and will investigate reports promptly.
      </p>
    </LegalPageShell>
  );
};

export default SecurityOverview;
