# Skribbl.io Helper

Simple Chrome extension that reads the blank/letter pattern shown on skribbl.io and shows matching words from a local word list. Clicking a word copies it to the clipboard so you can paste it into chat.

## What it is
- A Chrome extension (Manifest V3).
- Passive content script that detects the on-page pattern.
- Popup UI that filters a local `words.json` word bank.

## How it works
- `content.js` observes the game DOM (selectors: `#game-word .word`, `#game-word .hints .container`) and sends the pattern to the popup.
- `popup.js` loads `words.json`, filters matches by pattern (underscores -> wildcard), and lists results.
- Clicking a result copies the word to the clipboard.

## Requirements
- Google Chrome (or Chromium) with Developer mode to load unpacked extensions.
- No Node.js runtime required to run the extension. Node/npm only needed if you add local tooling (optional).

## Installation (load unpacked)
1. Open `chrome://extensions/` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and pick this project folder (the one containing `manifest.json`).

## Usage
1. Open or join a game on https://skribbl.io/.
2. Click the extension icon to open the popup.
3. The popup will display the current pattern and matching words.
4. Click a word to copy it to the clipboard; paste into the game chat and press Enter.

## Files
- `manifest.json` — extension manifest (MV3).
- `content.js` — detects pattern and sends updates.
- `popup.html`, `popup.js` — popup UI and logic.
- `words.json` — local word bank (editable).

## WARNING
This extension is intended for educational purposes only. Using it to gain an unfair advantage in games may violate the terms of service of skribbl.io and could lead to penalties, including being banned from the platform. Use responsibly and ethically.

## Known issues
1. Word list may be incomplete.
2. Clipboard access may be blocked by browser security settings.
