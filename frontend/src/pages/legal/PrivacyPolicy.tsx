import React from "react";
import LegalPageShell from "./LegalPageShell";
import { brand } from "@/config/brand";

const PrivacyPolicy = () => {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="March 8, 2024">
      <p>
        At {brand.companyName} ("we," "us," or "our"), we respect your privacy and are committed to protecting it through our compliance with this policy. This policy describes the types of information we may collect from you or that you may provide when you visit {brand.domain} (our "Website") and our practices for collecting, using, maintaining, protecting, and disclosing that information.
      </p>

      <h2>1. Information We Collect</h2>
      <p>We collect several types of information from and about users of our Website, including information:</p>
      <ul>
        <li>By which you may be personally identified, such as name, e-mail address, and billing information ("personal information");</li>
        <li>That is about you but individually does not identify you; and/or</li>
        <li>About your internet connection, the equipment you use to access our Website, and usage details.</li>
      </ul>

      <h2>2. AI Processing and Data Uploads</h2>
      <p>
        When using {brand.productName}, you may upload documents or provide proprietary data for analysis. We process this data using third-party Large Language Model providers (such as OpenAI, Anthropic, or Google). 
      </p>
      <p>
        <strong>Important:</strong> We do not use your proprietary data to train our own base models, and we opt-out of data training with our third-party LLM providers whenever possible through their enterprise agreements.
      </p>

      <h2>3. How We Use Your Information</h2>
      <p>We use information that we collect about you or that you provide to us, including any personal information:</p>
      <ul>
        <li>To present our Website and its contents to you.</li>
        <li>To provide you with information, products, or services that you request from us.</li>
        <li>To fulfill any other purpose for which you provide it.</li>
        <li>To provide you with notices about your account, including expiration and renewal notices.</li>
        <li>To carry out our obligations and enforce our rights arising from any contracts entered into between you and us, including for billing and collection.</li>
      </ul>

      <h2>4. Data Security</h2>
      <p>
        We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on our secure servers behind firewalls. Any payment transactions will be encrypted using SSL technology.
      </p>

      <h2>5. Contact Information</h2>
      <p>
        To ask questions or comment about this privacy policy and our privacy practices, contact us at: <a href="mailto:privacy@snapsolve.ink">privacy@snapsolve.ink</a>.
      </p>
    </LegalPageShell>
  );
};

export default PrivacyPolicy;