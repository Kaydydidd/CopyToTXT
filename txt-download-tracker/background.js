// CopyToTXT v2.0 - background script

// Utility: create all context menus based on saved formats
function createContextMenus(formats) {
  if (!Array.isArray(formats) || formats.length === 0) {
    formats = ["txt"];
  }

  chrome.contextMenus.removeAll(() => {
    formats.forEach((fmt) => {
      const cleanFmt = String(fmt).toLowerCase();
      chrome.contextMenus.create({
        id: `save-prompt-download-${cleanFmt}`,
        title: `Download as .${cleanFmt}`,
        contexts: ["selection"],
      });
    });
  });
}

// Initialize context menus on install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ formats: ["txt"] }, ({ formats }) => {
    createContextMenus(formats);
  });
});

// Also rebuild menus on browser startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get({ formats: ["txt"] }, ({ formats }) => {
    createContextMenus(formats);
  });
});

// Handle format updates from the popup (when user adds/removes formats)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "updateFormats" && Array.isArray(message.formats)) {
    chrome.storage.local.set({ formats: message.formats }, () => {
      createContextMenus(message.formats);
      sendResponse({ ok: true });
    });
    return true; // async response
  }
});

// Sanitize a string for filename use
function sanitizeFileName(name) {
  if (!name) return "snippet";
  return name
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "snippet";
}

// Generate a prompt object
function buildPrompt(text, tab, format) {
  const id =
    (typeof crypto !== "undefined" &&
      crypto.randomUUID &&
      crypto.randomUUID()) ||
    String(Date.now()) + "-" + Math.floor(Math.random() * 1e6);

  return {
    id,
    text,
    title: tab && tab.title ? tab.title : "Untitled",
    url: tab && tab.url ? tab.url : "unknown",
    createdAt: Date.now(),
    format: format || "txt",
  };
}

// Actually perform the download for the prompt
function downloadPromptFile(prompt) {
  const ext = (prompt.format || "txt").toLowerCase();
  const baseName = sanitizeFileName(prompt.title || prompt.text);
  const filename = `CopyToTXT/${baseName}-${prompt.id}.${ext}`;

  const content = prompt.text;

  // Dynamically build the data: URL from the extension
  const url = `data:text/${ext};charset=utf-8,` + encodeURIComponent(content);

  console.log("DEBUG download:", { ext, url, filename });

  chrome.downloads.download(
    {
      url,
      filename,
      saveAs: false,
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Download error:", chrome.runtime.lastError.message);
        return;
      }

      chrome.storage.local.get({ promptDownloads: {} }, (data) => {
        const promptDownloads = data.promptDownloads || {};
        promptDownloads[prompt.id] = downloadId;
        chrome.storage.local.set({ promptDownloads });
      });
    }
  );
}

// Handle clicks on any of the context menu items
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;

  const text = info.selectionText;
  const menuId = info.menuItemId || "";
  let format = "txt";

  const match = String(menuId).match(/^save-prompt-download-(.+)$/);
  if (match && match[1]) {
    format = match[1].toLowerCase();
  }

  const prompt = buildPrompt(text, tab, format);

  chrome.storage.local.get({ prompts: [] }, (data) => {
    const prompts = Array.isArray(data.prompts) ? data.prompts : [];
    const updatedPrompts = [prompt, ...prompts];

    chrome.storage.local.set({ prompts: updatedPrompts }, () => {
      downloadPromptFile(prompt);
    });
  });
});