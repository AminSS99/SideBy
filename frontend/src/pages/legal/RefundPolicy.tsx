import React from "react";
import LegalPageShell from "./LegalPageShell";
import { brand } from "@/config/brand";

const RefundPolicy = () => {
  return (
    <LegalPageShell title="Refund Policy" lastUpdated="July 29, 2026">
      <p>
        {brand.productName} is part of the {brand.companyName} product ecosystem. Paid access is purchased and managed as a shared SnapSolve subscription rather than as a separate SideBy plan.
      </p>

      <h2>1. Shared Subscription Terms</h2>
      <p>
        Flow, Pulse, Core, and Orbit are SnapSolve ecosystem tiers. The price, renewal terms, availability, cancellation rules, and refund terms shown in SnapSolve Cockpit at checkout govern the purchase across all included products.
      </p>

      <h2>2. Cancellations and Refund Review</h2>
      <p>
        You may cancel future renewal from the shared billing area in SnapSolve Cockpit. Cancellation normally preserves access through the current paid period. Refund requests are reviewed under the current SnapSolve refund policy and any checkout terms that applied to the transaction.
      </p>

      <h2>3. Payment Processing</h2>
      <p>
        Dodo Payments is the merchant platform used for eligible SnapSolve subscription transactions. Any approved refund is returned through the original payment method, subject to the payment provider and financial institution processing time.
      </p>

      <h2>4. Current Governing Policy</h2>
      <p>
        Read the current <a href={brand.refundPolicyUrl}>SnapSolve Refund Policy</a> before purchasing or requesting a refund. It is the authoritative policy for shared ecosystem subscriptions.
      </p>

      <h2>5. How to Request Review</h2>
      <p>Contact <a href="mailto:aminsoborr@gmail.com">aminsoborr@gmail.com</a> and include:</p>
      <ul>
        <li>The email used for your SnapSolve account.</li>
        <li>The transaction receipt or invoice number.</li>
        <li>A short explanation of the billing issue or refund request.</li>
      </ul>
    </LegalPageShell>
  );
};

export default RefundPolicy;
