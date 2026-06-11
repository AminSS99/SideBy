import React from "react";
import LegalPageShell from "./LegalPageShell";
import { brand } from "@/config/brand";

const RefundPolicy = () => {
  return (
    <LegalPageShell title="Refund Policy" lastUpdated="June 9, 2026">
      <p>
        Thank you for choosing {brand.productName}, operated by {brand.companyName} ("we," "us," or "our"). We strive to provide the highest quality AI-powered comparison and research experience. 
      </p>

      <h2>1. Standard Refund Terms</h2>
      <p>
        We offer a <strong>14-day refund window</strong> from the date of purchase or renewal for our monthly and annual subscriptions (Pro and Team plans). If you are unsatisfied with {brand.productName} for any reason within the first 14 days of your subscription period, you are eligible for a full refund of your most recent billing charge.
      </p>

      <h2>2. Refund Eligibility Guidelines</h2>
      <p>To qualify for a refund under this policy, you must meet the following criteria:</p>
      <ul>
        <li>Your request must be submitted within 14 calendar days of your initial purchase or renewal transaction.</li>
        <li>For Team accounts, the refund request must be made by the account owner or designated team administrator.</li>
        <li>You must not have exceeded 20% of your plan's comparison limits for the current billing cycle prior to requesting the refund. This abuse prevention limit ensures the policy remains fair to all users.</li>
      </ul>

      <h2>3. Processing of Refunds</h2>
      <p>
        Once approved, your refund will be processed through our merchant platform (Paddle) back to your original payment method. Please note the following timelines:
      </p>
      <ul>
        <li>Refund approvals are typically resolved within 2-3 business days.</li>
        <li>Depending on your financial institution, the credited funds may take 5 to 10 business days to appear on your bank statement.</li>
      </ul>

      <h2>4. Upgrades, Downgrades, and Cancellations</h2>
      <p>
        You can cancel your subscription at any time via the <strong>Billing</strong> section of your workspace settings. 
      </p>
      <ul>
        <li><strong>Cancellations:</strong> Upon cancellation, your account will remain on the paid tier until the end of your current billing period, after which you will be downgraded to the Free tier.</li>
        <li><strong>Mid-cycle changes:</strong> Plan upgrades or downgrades are pro-rated automatically. Refunds are not issued for mid-cycle plan downgrades, but your bill will be credited for the next billing cycle.</li>
      </ul>

      <h2>5. How to Request a Refund</h2>
      <p>
        To request a refund, please contact our support team at <a href={`mailto:billing@${brand.domain}`}>billing@${brand.domain}</a>. Please include:
      </p>
      <ul>
        <li>Your Clerk account email.</li>
        <li>The transaction receipt or invoice number.</li>
        <li>A brief explanation of why you are requesting a refund (your feedback helps us improve the product!).</li>
      </ul>
    </LegalPageShell>
  );
};

export default RefundPolicy;
