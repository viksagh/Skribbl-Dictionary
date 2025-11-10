// background.js - handles keyboard command to send stored word to active tab
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'send-word') {
    try {
      const data = await chrome.storage.local.get('pendingWord');
      const word = data && data.pendingWord;
      if (!word) {
        console.warn('[SkribblHelper] No pending word to send.');
        return;
      }
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || !tabs[0]) return;
      const tabId = tabs[0].id;
      // Execute script directly in page context to attempt a reliable send using clipboard + paste
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: async (word) => {
          try {
            // Try to write to clipboard (requires user gesture which this command provides)
            try {
              await navigator.clipboard.writeText(word);
            } catch (e) {
              // ignore clipboard write failure
            }
            const input = document.querySelector('input[placeholder="Type your guess here..."]');
            if (!input) return { success: false, reason: 'no_input' };
            input.focus();
            input.select();
            // Try paste via execCommand (may work under user gesture)
            let pasted = false;
            try {
              pasted = document.execCommand('paste');
            } catch (e) {
              pasted = false;
            }
            if (!pasted) {
              // Fallback: set value directly
              input.value = word;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
            // Try submit methods
            try {
              const form = input.closest('form');
              if (form) {
                try { form.submit(); } catch (e) { /* ignore */ }
              }
            } catch (e) {}
            try {
              const sendBtn = document.querySelector('form.chat-form button, .chat-form button');
              if (sendBtn) try { sendBtn.click(); } catch (e) {}
            } catch (e) {}
            // Dispatch Enter key events
            try {
              const evDown = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 });
              const evPress = new KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 });
              const evUp = new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 });
              input.dispatchEvent(evDown);
              input.dispatchEvent(evPress);
              input.dispatchEvent(evUp);
            } catch (e) {}
            // Wait briefly to let handlers run
            await new Promise(r => setTimeout(r, 300));
            return { success: input.value === '' };
          } catch (err) {
            return { success: false, error: String(err) };
          }
        },
        args: [word]
      });
      const res = results && results[0] && results[0].result;
      if (res && res.success) {
        console.log('[SkribblHelper] Word force-sent via command:', word);
        await chrome.storage.local.remove('pendingWord');
      } else {
        console.warn('[SkribblHelper] Force send via command failed:', res);
        // If failed, still show overlay via content script
        chrome.tabs.sendMessage(tabId, { action: 'sendWord', word });
      }
    } catch (err) {
      console.error('[SkribblHelper] Error in command handler:', err);
    }
  }
});

// Also handle storeWord message from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'storeWord' && msg.word) {
    chrome.storage.local.set({ pendingWord: msg.word }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
