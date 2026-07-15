import React from "react";
import LegalPageShell from "./LegalPageShell";
import { brand } from "@/config/brand";

const TermsOfService = () => {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="March 8, 2024">
      <p>
        These Terms of Service ("Terms") govern your access to and use of {brand.productName}, operated by {brand.companyName} ("we," "us," or "our"). Please read these Terms carefully before using the service.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using {brand.productName}, you agree to be bound by these Terms and our Privacy Policy. If you disagree with any part of the terms, you may not access the service.
      </p>

      <h2>2. Use of AI and Outputs</h2>
      <p>
        {brand.productName} utilizes artificial intelligence to generate research, comparisons, and summaries. While we strive for accuracy by grounding our AI in official sources:
      </p>
      <ul>
        <li>We do not guarantee the absolute accuracy, completeness, or reliability of any AI-generated output.</li>
        <li>You are responsible for independently verifying critical information before making technical, financial, or architectural decisions.</li>
        <li>The outputs are provided "as is" without warranty of any kind.</li>
      </ul>

      <h2>3. User Content and Conduct</h2>
      <p>
        You are solely responsible for the content you upload to {brand.productName}. You agree not to upload:
      </p>
      <ul>
        <li>Information that violates any third-party intellectual property rights.</li>
        <li>Highly classified state secrets or regulated sensitive data (e.g., PHI/HIPAA data) unless explicitly covered by a custom Enterprise MSA.</li>
        <li>Malicious code or content intended to disrupt the service.</li>
      </ul>

      <h2>4. Subscriptions and Billing</h2>
      <p>
        Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis. We reserve the right to change our subscription plans or adjust pricing for our service in any manner and at any time as we may determine in our sole and absolute discretion.
      </p>

      <h2>5. Limitation of Liability</h2>
      <p>
        In no event shall {brand.companyName}, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
      </p>

      <h2>6. Changes to Terms</h2>
      <p>
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
      </p>
      
      <p>
        Contact us at <a href="mailto:legal@sideby.ink">legal@sideby.ink</a> for any legal inquiries.
      </p>
    </LegalPageShell>
  );
};

export default TermsOfService;
