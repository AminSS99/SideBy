-- 013: Rename billing columns from paddle_* to provider_*
-- Keeps the live Dodo Payments subscription rows while dropping the
-- misleadingly-named "paddle" prefix after consolidating on a single provider.

ALTER TABLE "users" RENAME COLUMN "paddle_customer_id" TO "provider_customer_id";
ALTER TABLE "organizations" RENAME COLUMN "paddle_customer_id" TO "provider_customer_id";
ALTER TABLE "subscriptions" RENAME COLUMN "paddle_subscription_id" TO "provider_subscription_id";
ALTER TABLE "subscriptions" RENAME COLUMN "paddle_plan_id" TO "provider_plan_id";

ALTER INDEX "subscriptions_paddle_subscription_id_unique" RENAME TO "subscriptions_provider_subscription_id_unique";
ALTER INDEX "subscriptions_paddle_idx" RENAME TO "subscriptions_provider_idx";
