🔒 [security fix] Secure CORS configuration via environment variables

🎯 **What:**
Removed hardcoded `@CrossOrigin` annotations from `ComparisonResearchController.java` and `ComparisonController.java` and introduced a global, environment-driven CORS configuration via `WebConfig.java`. The allowed origins are now dynamically read from `application.properties` (using the `CORS_ALLOWED_ORIGINS` environment variable).

⚠️ **Risk:**
Hardcoding allowed origins (such as `http://localhost:5173` or `https://snapsolve.ink`) directly into controller logic makes it difficult to maintain and enforce environment-specific security postures. In production, hardcoded localhost entries unnecessarily broaden the attack surface and can potentially be leveraged in CSRF attacks or lead to unintended data exposure if the same binary is deployed across multiple environments (dev/staging/prod).

🛡️ **Solution:**
- Added `app.cors.allowed-origins` property to `application.properties` and `application.properties.example` to allow injection via the `CORS_ALLOWED_ORIGINS` environment variable.
- Created `WebConfig.java` to implement `WebMvcConfigurer` and apply the configurable allowed origins globally across all API routes (`/**`).
- Removed the overly permissive and hardcoded `@CrossOrigin` annotations from all RestControllers.
- Implemented `CorsTest.java` to verify that the configured origins are correctly enforced and unauthorized origins are rejected.
