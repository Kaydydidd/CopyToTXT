# CopyToTXT

CopyToTXT is a lightweight Chrome extension that lets you **right-click selected text** and instantly download it as a file in the format of your choice (e.g. `.txt`, `.csv`, `.xml`, `.md`, etc.). It also keeps a small history of snippets so you can copy them again or reopen their files later.

> **Version:** 2.0.0  
> **Manifest:** MV3  

---

Needed to put this up on GitHub! 

This is a small chrome extension (as of now) that is used for quickly highlighting and downloading text into a specific file format. The main focus of this is to speed up workflow, particularly in an environment working with AI, in which dropping in text/data in and out of a model is common. The workflow changes from **Highlight -> Copy -> Create File -> Rename File -> Paste -> Save** to **Highlight -> Create file -> Place file -> Rename file**. So 6 steps to 4, but small changes scale if you do this often, making it a great means of adding a shortcut to your workflow. For me personally, this is especially useful when pasting large bodies of text into an AI. You see, AI likes to truncate large blocks, causing it to miss certain pieces of context and hallucinate. But, when using files, AI is better able to analyze those pieces of text as files, almost always utilizing better context and missing fewer insights. So this extension has actually helped me out, both in terms of the quality of my AI responses as well as in the speed of my workflow.

Files have a specific ID that is tracked by the extension, meaning that at any point, you can go to the extension window and clear all of the bulk you've built up without needing to meticulously ensure you deleted every text file, as to not clutter up your system, making this a great organizational tool for junk files on top of the slight speed boost.

v1.0 originally only allowed the user to copy text to TXT, but now the user can add more file extensions to their bar, letting them download whatever they want seamlessly. This is especially helpful for AI use in which, say, a model were to give you a drop in piece of testing data. Simply copy the file to a .json format, it downloads from Chrome, and you can drag at drop it seamlessly from there. It doesn't fix any sort of major issue; it just speeds up your workflow a little bit.
