# CopyToTXT

CopyToTXT is a lightweight Chrome extension that lets you **right-click selected text** and instantly download it as a file in the format of your choice (e.g. `.txt`, `.csv`, `.xml`, `.md`, etc.). It also keeps a small history of snippets so you can copy them again or reopen their files later.

> **Version:** 2.0.0  
> **Manifest:** MV3  

---

## Features

### Right-click → Download as file

- Select any text on a web page
- Right-click and choose **Download as .ext** (e.g. `.txt`, `.csv`, `.xml`)
- CopyToTXT will:
  - Build a filename based on the page title (and a unique ID)
  - Save it into a `CopyToTXT/` subfolder in your default downloads directory
  - Store a record of the snippet (text, page title, URL, timestamp, format)

### Snippet history (popup)

Click the extension icon to open the popup:

- See a list of **saved snippets**
  - Shows origin domain, timestamp, page title, and format (`.txt`, `.csv`, etc.)
  - Preview the first portion of the text
- Per snippet you can:
  - **Copy** text back to your clipboard
  - **Show File** to open the downloaded file in your system’s file manager
  - **Delete** the snippet entry (and attempt to remove its downloaded file)
- There’s also a **“Clear Files”** button to wipe all snippets and associated files.

### Custom file formats

As of v2.0, you can configure which extensions appear in the right-click menu.

In the popup under **Download Formats**:

- See the current list of formats (e.g. `.csv`, `.txt`, `.xml`)
- **Add** a new format (e.g. `md`, `log`, `json`)
- **Remove** formats you don’t want

The extension will:

- Store your chosen formats in `chrome.storage.local`
- Rebuild the context menu so each format appears as its own item:
  - `Download as .csv`
  - `Download as .xml`
  - `Download as .md`
  - etc.
