// Register context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sideby-compare",
    title: "Compare '%s' with SideBy",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "sideby-compare" && info.selectionText) {
    const query = info.selectionText.trim();
    if (!query) return;

    // Retrieve API key and host configurations
    chrome.storage.local.get(["apiKey", "hostUrl"], async (data) => {
      const apiKey = data.apiKey;
      const hostUrl = data.hostUrl || "https://sideby.ink";

      if (!apiKey) {
        // Open the popup or alert the user to configure their API key
        chrome.tabs.create({ url: `${hostUrl}/app/settings` });
        return;
      }

      try {
        // Trigger a new comparison job via API
        const response = await fetch(`${hostUrl}/api/v1/comparisons`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({ query })
        });

        if (!response.ok) {
          throw new Error("Failed to start comparison.");
        }

        const result = await response.json();
        const comparisonId = result.comparison?.id || result.id;
        
        if (comparisonId) {
          // Open comparison detail workbench
          chrome.tabs.create({ url: `${hostUrl}/app/comparisons/${comparisonId}` });
        }
      } catch (err) {
        console.error("SideBy context menu run error:", err);
      }
    });
  }
});
