import React from "react";
import LegalPageShell from "./LegalPageShell";
import { brand } from "@/config/brand";

const CookiesPolicy = () => {
  return (
    <LegalPageShell title="Cookies Policy" lastUpdated="March 8, 2024">
      <p>
        This Cookie Policy explains how {brand.companyName} ("we", "us", and "our") uses cookies and similar technologies to recognize you when you visit our website at {brand.domain} ("Website"). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
      </p>

      <h2>2. Why do we use cookies?</h2>
      <p>We use first-party and third-party cookies for several reasons:</p>
      <ul>
        <li>
          <strong>Essential Cookies:</strong> Some cookies are required for technical reasons in order for our Website to operate, such as managing user sessions through Clerk.
        </li>
        <li>
          <strong>Performance and Functionality Cookies:</strong> These cookies are used to enhance the performance and functionality of our Website but are non-essential to their use. Without these cookies, certain functionality may become unavailable.
        </li>
        <li>
          <strong>Analytics and Customization Cookies:</strong> These cookies collect information that is used either in aggregate form to help us understand how our Website is being used or how effective our marketing campaigns are, or to help us customize our Website for you.
        </li>
      </ul>

      <h2>3. Third-Party Cookies</h2>
      <p>
        In addition to our own cookies, we may also use various third-parties cookies to report usage statistics of the Service. Specifically, we use third-party services like Vercel Analytics and PostHog for telemetry and error tracking.
      </p>

      <h2>4. How can I control cookies?</h2>
      <p>
        You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted. As the means by which you can refuse cookies through your web browser controls vary from browser-to-browser, you should visit your browser's help menu for more information.
      </p>

      <h2>5. Updates to this policy</h2>
      <p>
        We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
      </p>
      
      <p>
        If you have any questions about our use of cookies or other technologies, please email us at <a href="mailto:privacy@snapsolve.ink">privacy@snapsolve.ink</a>.
      </p>
    </LegalPageShell>
  );
};

export default CookiesPolicy;