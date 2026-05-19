/* eslint-disable @typescript-eslint/no-explicit-any */
import http from "http";
import crypto from "crypto";
import { triggerWebhooks } from "../api/_lib/webhook-notifier.js";

function verifyWebhookSignature(rawBody: string, header: string, secret: string): boolean {
  try {
    const parts = header.split(",");
    const tPart = parts.find((p) => p.startsWith("t="));
    const v1Part = parts.find((p) => p.startsWith("v1="));
    
    if (!tPart || !v1Part) return false;
    
    const timestamp = tPart.substring(2);
    const signature = v1Part.substring(3);
    
    const signaturePayload = `${timestamp}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(signaturePayload)
      .digest("hex");
      
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch (e) {
    return false;
  }
}

async function runTest() {
  const PORT = 9999;
  const SECRET = "whsec_super_secret_test_key_123";
  let serverReceived = false;
  let signatureValid = false;
  let payloadData: any = null;

  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    
    req.on("end", () => {
      serverReceived = true;
      const signatureHeader = req.headers["x-sideby-signature"] as string || "";
      signatureValid = verifyWebhookSignature(body, signatureHeader, SECRET);
      try {
        payloadData = JSON.parse(body);
      } catch (e) {
        payloadData = null;
      }
      
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
  });

  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`Mock webhook receiver listening on port ${PORT}`);

  try {
    let callsCount = 0;
    const mockDb = {
      select: () => {
        const queryChain: any = {
          from: () => queryChain,
          where: () => queryChain,
          limit: () => queryChain,
          then: (onfulfilled: any) => {
            callsCount++;
            if (callsCount === 1) {
              // Fetching comparison
              onfulfilled([
                {
                  id: "comp_123",
                  clerkUserId: "user_test_123",
                  clerkOrgId: null,
                  workspaceId: null,
                  query: "React vs Vue",
                  slug: "react-vs-vue",
                },
              ]);
            } else {
              // Fetching webhook subscriptions
              onfulfilled([
                {
                  id: "sub_1",
                  url: `http://localhost:${PORT}/webhook`,
                  eventTypes: ["comparison.completed"],
                  active: true,
                  secret: SECRET,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ]);
            }
          }
        };
        return queryChain;
      }
    };

    console.log("Triggering webhook dispatch...");
    await triggerWebhooks(
      mockDb,
      "comp_123",
      "comparison.completed",
      {
        entities: ["React", "Vue"],
        verdict: "React has a larger ecosystem while Vue is easier to adopt.",
      }
    );

    // Give server a brief moment to process the request
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!serverReceived) {
      throw new Error("FAIL: Webhook server did not receive any request.");
    }
    if (!signatureValid) {
      throw new Error("FAIL: Webhook signature verification failed on receiver.");
    }
    if (!payloadData || payloadData.data?.id !== "comp_123") {
      throw new Error("FAIL: Payload data structure mismatch.");
    }

    console.log("🎉 SUCCESS: Webhook dispatched, signed, received, and verified successfully!");
    console.log("Payload:", JSON.stringify(payloadData, null, 2));

  } finally {
    server.close();
    console.log("Mock server stopped.");
  }
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
