// Load word list
let words = [];
fetch('words.json').then(r => r.json()).then(data => words = data).catch(() => words = []);

function filterWords(pattern) {
  pattern = (pattern || '').replace(/[^a-zA-Z_]/g, '');
  const results = document.getElementById('results');
  results.innerHTML = '';
  if (!pattern || pattern.length < 1) {
    return;
  }
  const regex = new RegExp('^' + pattern.replace(/_/g, '.') + '$', 'i');
  const matches = words.filter(w => regex.test(w));
  matches.slice(0, 200).forEach(word => {
    const li = document.createElement('li');
    li.textContent = word;
    li.onclick = async () => {
      try {
        await navigator.clipboard.writeText(word);
        li.classList.add('copied');
        setTimeout(() => li.classList.remove('copied'), 500);
      } catch (e) {
        // fallback: select text to allow manual copy
        console.warn('Clipboard write failed', e);
        const ta = document.createElement('textarea');
        ta.value = word;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        li.classList.add('copied');
        setTimeout(() => li.classList.remove('copied'), 500);
      }
    };
    results.appendChild(li);
  });
}

// Listen for pattern updates
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'patternUpdate' && msg.pattern) {
    document.getElementById('pattern').value = msg.pattern;
    filterWords(msg.pattern);
  }
});

// Initial fetch when popup opens
chrome.tabs.query({active: true, currentWindow: true}, tabs => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.url || !tab.url.startsWith('https://skribbl.io')) return;
  chrome.tabs.sendMessage(tab.id, { action: 'getPattern' }, res => {
    if (res && res.pattern) {
      document.getElementById('pattern').value = res.pattern;
      filterWords(res.pattern);
    }
  });
});
