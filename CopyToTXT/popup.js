const promptListEl = document.getElementById("prompt-list");
const statusEl = document.getElementById("status");
const refreshBtn = document.getElementById("refresh-btn");
const nukeBtn = document.getElementById("nuke-btn");

// Format management elements
const formatListEl = document.getElementById("format-list");
const newFormatInput = document.getElementById("new-format-input");
const addFormatBtn = document.getElementById("add-format-btn");

document.addEventListener("DOMContentLoaded", () => {
  loadPrompts();
  loadFormats();
});

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    loadPrompts("Refreshed.");
  });
}

if (nukeBtn) {
  nukeBtn.addEventListener("click", () => {
    if (!confirm("Delete ALL saved files and history?")) return;
    clearAllFiles();
  });
}

if (addFormatBtn) {
  addFormatBtn.addEventListener("click", () => {
    const raw = newFormatInput.value.trim();
    if (!raw) return;

    const fmt = normalizeFormat(raw);
    if (!fmt) {
      setStatus("Invalid format. Use letters/numbers only, e.g. txt, csv, md.");
      return;
    }

    chrome.storage.local.get({ formats: ["txt"] }, (data) => {
      let formats = Array.isArray(data.formats) ? data.formats : ["txt"];
      if (formats.includes(fmt)) {
        setStatus(`Format .${fmt} already exists.`);
        return;
      }
      formats = [...formats, fmt];
      chrome.storage.local.set({ formats }, () => {
        // Tell background to rebuild context menus
        chrome.runtime.sendMessage({ type: "updateFormats", formats }, () => {
          loadFormats();
          newFormatInput.value = "";
          setStatus(`Added .${fmt} to right-click menu.`);
        });
      });
    });
  });
}

function normalizeFormat(input) {
  let fmt = input.trim().toLowerCase();
  if (!fmt) return null;
  if (fmt.startsWith(".")) fmt = fmt.slice(1);
  if (!/^[a-z0-9]{1,10}$/.test(fmt)) return null;
  return fmt;
}

// ----- PROMPTS UI -----

function loadPrompts(statusMsg) {
  chrome.storage.local.get({ prompts: [], promptDownloads: {} }, (data) => {
    const prompts = Array.isArray(data.prompts) ? data.prompts : [];
    const promptDownloads = data.promptDownloads || {};

    promptListEl.innerHTML = "";

    if (statusMsg) {
      setStatus(statusMsg);
    } else if (!prompts.length) {
      setStatus("No saved files yet. Highlight text and use right-click to save.");
    } else {
      setStatus("");
    }

    if (!prompts.length) return;

    prompts.forEach((prompt) => {
      const li = document.createElement("li");
      li.className = "prompt-item";

      const header = document.createElement("div");
      header.className = "prompt-header";

      const title = document.createElement("div");
      title.className = "prompt-title";
      const host = truncateUrl(prompt.url || "unknown");
      const date = new Date(prompt.createdAt || Date.now()).toLocaleString();
      const fmt = prompt.format || "txt";
      title.textContent = `${host} • ${date} • .${fmt}`;

      const meta = document.createElement("div");
      meta.className = "prompt-meta";
      meta.textContent = prompt.title || "";

      header.appendChild(title);
      header.appendChild(meta);

      const body = document.createElement("div");
      body.className = "prompt-body";
      body.textContent =
        prompt.text.length > 200
          ? prompt.text.slice(0, 200) + "…"
          : prompt.text;

      const actions = document.createElement("div");
      actions.className = "prompt-actions";

      const copyBtn = document.createElement("button");
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(prompt.text).then(
          () => setStatus("Copied to clipboard."),
          () => setStatus("Failed to copy.")
        );
      });

      const openBtn = document.createElement("button");
      openBtn.textContent = "Show File";
      openBtn.addEventListener("click", () => {
        const downloadId = promptDownloads[prompt.id];
        if (!downloadId) {
          setStatus("No download tracked for this snippet.");
          return;
        }
        chrome.downloads.show(downloadId);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        if (!confirm("Delete this snippet and its file (if present)?")) return;
        deletePrompt(prompt.id);
      });

      actions.appendChild(copyBtn);
      actions.appendChild(openBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(header);
      li.appendChild(body);
      li.appendChild(actions);

      promptListEl.appendChild(li);
    });
  });
}

function deletePrompt(promptId) {
  chrome.storage.local.get({ prompts: [], promptDownloads: {} }, (data) => {
    const prompts = Array.isArray(data.prompts) ? data.prompts : [];
    const promptDownloads = data.promptDownloads || {};

    const downloadId = promptDownloads[promptId];

    if (downloadId != null) {
      try {
        chrome.downloads.removeFile(downloadId, () => {
          // ignore errors if file already gone
          chrome.downloads.erase({ id: downloadId });
        });
      } catch (e) {
        console.warn("Failed to remove file for prompt", promptId, e);
      }
      delete promptDownloads[promptId];
    }

    const remaining = prompts.filter((p) => p.id !== promptId);
    chrome.storage.local.set(
      { prompts: remaining, promptDownloads },
      () => {
        loadPrompts("Deleted snippet.");
      }
    );
  });
}

function clearAllFiles() {
  chrome.storage.local.get({ prompts: [], promptDownloads: {} }, (data) => {
    const promptDownloads = data.promptDownloads || {};

    const ids = Object.values(promptDownloads);
    ids.forEach((id) => {
      try {
        chrome.downloads.removeFile(id, () => {
          chrome.downloads.erase({ id });
        });
      } catch (e) {
        console.warn("Failed to remove download", id, e);
      }
    });

    chrome.storage.local.set(
      { prompts: [], promptDownloads: {} },
      () => {
        promptListEl.innerHTML = "";
        setStatus("Cleared all snippets and files.");
      }
    );
  });
}

// ----- FORMATS UI -----

function loadFormats() {
  if (!formatListEl) return;

  chrome.storage.local.get({ formats: ["txt"] }, (data) => {
    const formats = Array.isArray(data.formats) ? data.formats : ["txt"];

    formatListEl.innerHTML = "";

    formats.forEach((fmt) => {
      const chip = document.createElement("div");
      chip.className = "format-chip";

      const label = document.createElement("span");
      label.textContent = "." + fmt;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      removeBtn.className = "format-remove";
      removeBtn.title = "Remove format";

      removeBtn.addEventListener("click", () => {
        if (!confirm(`Remove .${fmt} from right-click menu?`)) return;

        const next = formats.filter((f) => f !== fmt);
        chrome.storage.local.set({ formats: next }, () => {
          chrome.runtime.sendMessage(
            { type: "updateFormats", formats: next },
            () => {
              loadFormats();
              setStatus(`Removed .${fmt} from right-click menu.`);
            }
          );
        });
      });

      chip.appendChild(label);
      chip.appendChild(removeBtn);
      formatListEl.appendChild(chip);
    });
  });
}

function setStatus(msg) {
  if (!statusEl) return;
  statusEl.textContent = msg;
}

function truncateUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch {
    return "unknown";
  }
}