// Elements
const toggleSettingsBtn = document.getElementById("toggle-settings-btn");
const settingsForm = document.getElementById("settings-form");
const apiKeyInput = document.getElementById("api-key-input");
const hostUrlInput = document.getElementById("host-url-input");
const saveSettingsBtn = document.getElementById("save-settings-btn");

const searchPane = document.getElementById("search-pane");
const queryInput = document.getElementById("query-input");
const compareBtn = document.getElementById("compare-btn");

const historyPane = document.getElementById("history-pane");
const historyList = document.getElementById("history-list");

// Load stored configurations on start
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["apiKey", "hostUrl"], (data) => {
    if (data.apiKey) {
      apiKeyInput.value = data.apiKey;
      fetchHistory(data.apiKey, data.hostUrl || "https://snapsolve.ink");
    } else {
      // Show settings form immediately if no key is configured
      settingsForm.style.display = "flex";
    }
    if (data.hostUrl) {
      hostUrlInput.value = data.hostUrl;
    }
  });
});

// Toggle Settings Form display
toggleSettingsBtn.addEventListener("click", () => {
  if (settingsForm.style.display === "none" || !settingsForm.style.display) {
    settingsForm.style.display = "flex";
    toggleSettingsBtn.textContent = "Close Settings";
  } else {
    settingsForm.style.display = "none";
    toggleSettingsBtn.textContent = "Configure Key";
  }
});

// Save Settings configuration
saveSettingsBtn.addEventListener("click", () => {
  const apiKey = apiKeyInput.value.trim();
  const hostUrl = hostUrlInput.value.trim() || "https://snapsolve.ink";

  if (!apiKey) {
    alert("Please provide an API Key.");
    return;
  }

  chrome.storage.local.set({ apiKey, hostUrl }, () => {
    alert("Configurations saved successfully.");
    settingsForm.style.display = "none";
    toggleSettingsBtn.textContent = "Configure Key";
    fetchHistory(apiKey, hostUrl);
  });
});

// Trigger new comparison
compareBtn.addEventListener("click", async () => {
  const query = queryInput.value.trim();
  if (!query) {
    alert("Please enter a comparison query.");
    return;
  }

  chrome.storage.local.get(["apiKey", "hostUrl"], async (data) => {
    const apiKey = data.apiKey;
    const hostUrl = data.hostUrl || "https://snapsolve.ink";

    if (!apiKey) {
      alert("Please configure your API Key first.");
      settingsForm.style.display = "flex";
      return;
    }

    compareBtn.disabled = true;
    compareBtn.textContent = "Creating Job...";

    try {
      const response = await fetch(`${hostUrl}/api/v1/comparisons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error("Unable to trigger comparison. Please verify API key.");
      }

      const result = await response.json();
      const comparisonId = result.comparison?.id || result.id;
      
      if (comparisonId) {
        // Open comparison details page in new tab
        chrome.tabs.create({ url: `${hostUrl}/app/comparisons/${comparisonId}` });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      compareBtn.disabled = false;
      compareBtn.textContent = "Compare Entities";
    }
  });
});

// Fetch recent comparisons
async function fetchHistory(apiKey, hostUrl) {
  try {
    const response = await fetch(`${hostUrl}/api/v1/comparisons`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    if (!response.ok) return;

    const data = await response.json();
    const list = data.comparisons || [];

    if (list.length > 0) {
      historyPane.style.display = "block";
      historyList.innerHTML = "";

      list.slice(0, 5).forEach((item) => {
        const itemLink = document.createElement("a");
        itemLink.className = "history-item";
        itemLink.href = `${hostUrl}/app/comparisons/${item.id}`;
        itemLink.target = "_blank";

        const textSpan = document.createElement("span");
        textSpan.className = "history-query";
        textSpan.textContent = item.query;

        const statusSpan = document.createElement("span");
        statusSpan.className = `history-status status-${item.status || "completed"}`;
        statusSpan.textContent = item.status || "completed";

        itemLink.appendChild(textSpan);
        itemLink.appendChild(statusSpan);
        historyList.appendChild(itemLink);
      });
    }
  } catch (err) {
    console.error("Error loading historical comparisons:", err);
  }
}
