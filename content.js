// Extracts the current word pattern from the skribbl.io page
function getCurrentPattern() {
  // Try both possible selectors for the word pattern
  const selectors = ['#game-word .word', '#game-word .hints .container'];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim()) {
      // Minimal passive debug (non-invasive)
      let dbg = document.getElementById('skribbl-helper-debug');
      if (!dbg) {
        dbg = document.createElement('div');
        dbg.id = 'skribbl-helper-debug';
        dbg.style.position = 'fixed';
        dbg.style.bottom = '10px';
        dbg.style.right = '10px';
        dbg.style.background = 'rgba(0,0,0,0.7)';
        dbg.style.color = 'white';
        dbg.style.padding = '4px 8px';
        dbg.style.zIndex = '9999';
        // keep debug small and non-blocking
        dbg.style.pointerEvents = 'none';
        dbg.style.fontSize = '12px';
        document.body.appendChild(dbg);
      }
      dbg.textContent = '[SkribblHelper] Pattern: ' + el.textContent.trim();
      console.log('[SkribblHelper] Found word element with selector:', sel, 'Pattern:', el.textContent.trim());
      return el.textContent.trim();
    }
  }
  return '';
}

function attachObserver() {
  const selectors = ['#game-word .word', '#game-word .hints .container'];
  let wordEl = null;
  let usedSel = null;
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) { wordEl = el; usedSel = sel; break; }
  }
  if (!wordEl) {
    // retry later if not present
    setTimeout(attachObserver, 1000);
    return;
  }
  let lastPattern = wordEl.textContent.trim();
  const observer = new MutationObserver(() => {
    const newPattern = wordEl.textContent.trim();
    if (newPattern !== lastPattern) {
      lastPattern = newPattern;
      // Only send the pattern; do not modify the page
      chrome.runtime.sendMessage({ action: 'patternUpdate', pattern: newPattern });
      console.log('[SkribblHelper] Pattern changed:', newPattern, '(selector:', usedSel, ')');
    }
  });
  observer.observe(wordEl, { childList: true, characterData: true, subtree: true });
}

// Wait for DOM ready and attach observer
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachObserver);
} else {
  attachObserver();
}

// Minimal message handling: only respond to pattern requests, do not perform any sends or DOM writes
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getPattern') {
    sendResponse({ pattern: getCurrentPattern() });
  }
  // Explicitly ignore other message types to avoid interference
});

