import React from "react";
import LegalPageShell from "./LegalPageShell";
import { brand } from "@/config/brand";

const CookiesPolicy = () => {
  return (
    <LegalPageShell title="Cookies Policy" lastUpdated="July 14, 2026">
      <p>
        This Cookie Policy explains how {brand.companyName} ("we", "us", and "our") uses cookies and similar technologies to recognize you when you visit our website at {brand.domain} ("Website"). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
      </p>

      <h2>2. Cookies and storage we use</h2>
      <p>We use cookies and similar browser-storage technologies for the following purposes:</p>
      <ul>
        <li>
          <strong>Essential authentication and security:</strong> Clerk sets the cookies required to sign in and maintain a session. We also use a first-party CSRF cookie to protect state-changing requests. These are necessary to provide the Service and cannot be switched off in our settings.
        </li>
        <li>
          <strong>Functional preferences:</strong> We store a sidebar-display preference for up to seven days. We also use local storage for workspace and project selections so the application can restore your interface preferences.
        </li>
        <li>
          <strong>Optional analytics:</strong> With your permission, PostHog collects product-usage events and page views to help us understand and improve SideBy. We do not enable this browser analytics until you choose to accept it. You can withdraw permission at any time through the “Cookie settings” control.
        </li>
      </ul>

      <h2>3. Third-Party Cookies</h2>
      <p>
        We use Clerk to provide authentication and PostHog for optional product analytics. These providers may process information on our behalf under their applicable agreements. We do not use advertising or cross-context behavioral advertising cookies.
      </p>

      <h2>4. How can I control cookies?</h2>
      <p>
        You can accept or reject optional analytics through our “Cookie settings” control at any time. Rejecting analytics does not affect essential authentication or security cookies. You can also manage cookies through your browser settings. Where supported, we treat a browser Global Privacy Control signal as an opt-out of optional analytics.
      </p>

      <h2>5. Updates to this policy</h2>
      <p>
        We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
      </p>
      
      <p>
        If you have any questions about our use of cookies or other technologies, please email us at <a href="mailto:privacy@sideby.ink">privacy@sideby.ink</a>.
      </p>
    </LegalPageShell>
  );
};

export default CookiesPolicy;
