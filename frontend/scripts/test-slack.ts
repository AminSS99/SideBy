/* eslint-disable @typescript-eslint/no-explicit-any */
// Set environment variables before imports evaluate
process.env.DATABASE_URL = "postgres://dummy:dummy@localhost:5432/dummy";
process.env.SLACK_SIGNING_SECRET = "slack_signing_secret_test_123";

import http from "http";
import crypto from "crypto";

function createMockResponse(cb: (status: number, body: any) => void): any {
  return {
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      cb(this.statusCode || 200, data);
      return this;
    },
    setHeader() {},
    statusCode: 200,
  };
}

async function runTest() {
  const PORT = 9999;
  const SLACK_SECRET = process.env.SLACK_SIGNING_SECRET!;
  let slackMessageReceived = false;
  let slackBlocks: any = null;

  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      slackMessageReceived = true;
      try {
        slackBlocks = JSON.parse(body);
      } catch (e) {
        slackBlocks = null;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
  });

  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`Mock Slack server listening on port ${PORT}`);

  try {
    const bodyStr = `command=%2Fsideby&text=React+vs+Vue&response_url=http%3A%2F%2Flocalhost%3A${PORT}%2Fslack-callback`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const sigBaseString = `v0:${timestamp}:${bodyStr}`;
    const calculatedSignature = "v0=" + crypto
      .createHmac("sha256", SLACK_SECRET)
      .update(sigBaseString)
      .digest("hex");

    const mockRequest: any = {
      method: "POST",
      body: bodyStr,
      headers: {
        "x-slack-signature": calculatedSignature,
        "x-slack-request-timestamp": timestamp,
      },
    };

    let initialStatus = 0;
    let initialBody: any = null;

    const mockResponse = createMockResponse((status, body) => {
      initialStatus = status;
      initialBody = body;
    });

    console.log("Invoking Slack endpoint handler...");
    const { default: slackHandler } = await import("../api/integrations/slack.js");
    
    try {
      await slackHandler(mockRequest, mockResponse);
    } catch (err: any) {
      if (err.message && (err.message.includes("Database URL") || err.message.includes("Failed query") || err.message.includes("fetch failed"))) {
        console.log("Initial Slack HTTP Response Code:", initialStatus);
        console.log("Initial Slack HTTP Response Body:", JSON.stringify(initialBody, null, 2));
        console.log("🎉 SUCCESS: Slack signature validation passed successfully! (Database call reached)");
        return;
      }
      throw err;
    }

    console.log("Initial Slack HTTP Response Code:", initialStatus);
    console.log("Initial Slack HTTP Response Body:", JSON.stringify(initialBody, null, 2));

    if (initialStatus === 401) {
      throw new Error("FAIL: Signature verification failed inside handler.");
    }

    console.log("🎉 SUCCESS: Slack signature validation passed successfully!");

  } finally {
    server.close();
    console.log("Mock server stopped.");
  }
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
