/**
 * Digital Enviro — AI Tutor widget
 * ---------------------------------
 * Default mode: POSTs to a same-origin backend proxy (see /server/ai-server.js)
 * at `/api/ask-ai`. The proxy holds the real Anthropic API key server-side,
 * so nothing secret ever ships to the browser. This is the recommended setup.
 *
 * Fallback mode: if no backend is running, a visitor can open Settings and
 * paste their own Anthropic API key to call the API directly from the
 * browser. This is clearly labeled as insecure (the key lives in this
 * browser's localStorage and is visible in network requests) and is meant
 * for quick local testing only — never for a public deployment.
 */
(function () {
  var STORAGE_KEY = 'de_ai_tutor_settings_v1';
  var DEFAULT_ENDPOINT = '/api/ask-ai';
  var DIRECT_API_URL = 'https://api.anthropic.com/v1/messages';
  var DIRECT_MODEL = 'claude-sonnet-4-6';

  var state = {
    endpoint: DEFAULT_ENDPOINT,
    directKey: '',
    mode: 'proxy', // 'proxy' | 'direct'
    history: []
  };

  function loadSettings() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) Object.assign(state, JSON.parse(raw));
    } catch (e) { /* ignore corrupted storage */ }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        endpoint: state.endpoint, directKey: state.directKey, mode: state.mode
      }));
    } catch (e) { /* storage unavailable, continue in-memory only */ }
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  function buildWidget() {
    var launcher = el('button', {
      id: 'ai-launcher', type: 'button',
      'aria-haspopup': 'dialog', 'aria-controls': 'ai-panel',
      'aria-expanded': 'false'
    });
    launcher.innerHTML = '<span aria-hidden="true">&#9679;</span> Ask AI Tutor';

    var panel = el('div', {
      id: 'ai-panel', role: 'dialog', 'aria-label': 'AI Tutor chat', 'aria-modal': 'false'
    });

    var head = el('div', { class: 'ai-head' });
    head.innerHTML =
      '<strong><span class="status-dot" aria-hidden="true"></span>Digital Enviro AI Tutor</strong>';
    var headBtns = el('div', {});
    var settingsBtn = el('button', { class: 'ai-settings-btn', type: 'button', 'aria-label': 'AI Tutor settings', title: 'Settings' });
    settingsBtn.textContent = '\u2699';
    var closeBtn = el('button', { class: 'ai-close', type: 'button', 'aria-label': 'Close AI Tutor' });
    closeBtn.textContent = '\u2715';
    headBtns.appendChild(settingsBtn);
    headBtns.appendChild(closeBtn);
    head.appendChild(headBtns);

    var messages = el('div', { class: 'ai-messages', id: 'ai-messages' });

    var settingsView = el('div', { class: 'ai-settings', id: 'ai-settings-view', style: 'display:none;' });
    settingsView.innerHTML =
      '<label class="hint" for="ai-mode">Connection mode</label>' +
      '<select id="ai-mode" class="pg-select" style="width:100%;">' +
        '<option value="proxy">Use backend proxy (recommended)</option>' +
        '<option value="direct">Call Anthropic API directly (testing only)</option>' +
      '</select>' +
      '<div id="ai-proxy-fields">' +
        '<label class="hint" for="ai-endpoint">Backend endpoint</label>' +
        '<input id="ai-endpoint" type="text" placeholder="/api/ask-ai" />' +
      '</div>' +
      '<div id="ai-direct-fields" style="display:none;">' +
        '<label class="hint" for="ai-key">Your Anthropic API key</label>' +
        '<input id="ai-key" type="password" placeholder="sk-ant-..." />' +
        '<p class="hint">Stored only in this browser. Exposes your key in network ' +
        'requests — fine for local testing, never for a public site. See README ' +
        'for the safer backend-proxy setup.</p>' +
      '</div>' +
      '<button class="btn btn-primary" id="ai-save-settings" type="button" style="justify-content:center;">Save settings</button>';

    var inputRow = el('div', { class: 'ai-input-row' });
    var textarea = el('textarea', { id: 'ai-text', rows: '1', placeholder: 'Ask about any lesson, error, or concept…' });
    var sendBtn = el('button', { class: 'ai-send', type: 'button', 'aria-label': 'Send message' });
    sendBtn.textContent = 'Send';
    inputRow.appendChild(textarea);
    inputRow.appendChild(sendBtn);

    panel.appendChild(head);
    panel.appendChild(settingsView);
    panel.appendChild(messages);
    panel.appendChild(inputRow);

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    return { launcher: launcher, panel: panel, messages: messages, settingsView: settingsView, textarea: textarea, sendBtn: sendBtn, settingsBtn: settingsBtn, closeBtn: closeBtn };
  }

  function addMessage(container, role, text) {
    var msg = el('div', { class: 'ai-msg ' + role });
    msg.textContent = text;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    return msg;
  }

  function systemPrompt() {
    var pageTitle = document.title || 'Digital Enviro';
    return 'You are the Digital Enviro AI Tutor, embedded on a learning site for ' +
      'software development, AI, prompt engineering, web development, cyber ' +
      'security, cloud computing, blockchain, and machine learning. The visitor ' +
      'is currently on the page "' + pageTitle + '". Answer clearly and concisely, ' +
      'use short code examples in fenced blocks when helpful, and stay focused on ' +
      'programming and technology education. If asked something unrelated, gently ' +
      'redirect back to what you can help with on this site.';
  }

  async function askProxy(userText) {
    var res = await fetch(state.endpoint || DEFAULT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText, history: state.history })
    });
    if (!res.ok) throw new Error('Backend responded with ' + res.status);
    var data = await res.json();
    return data.reply || '(no reply returned)';
  }

  async function askDirect(userText) {
    if (!state.directKey) throw new Error('No API key set');
    var res = await fetch(DIRECT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.directKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: DIRECT_MODEL,
        max_tokens: 700,
        system: systemPrompt(),
        messages: state.history.concat([{ role: 'user', content: userText }])
      })
    });
    if (!res.ok) {
      var errBody = await res.text();
      throw new Error('Anthropic API error ' + res.status + ': ' + errBody.slice(0, 200));
    }
    var data = await res.json();
    var textBlock = (data.content || []).find(function (b) { return b.type === 'text'; });
    return textBlock ? textBlock.text : '(no reply returned)';
  }

  function init() {
    loadSettings();
    var ui = buildWidget();

    // Populate settings fields from saved state
    var modeSel = document.getElementById('ai-mode');
    var endpointInput = document.getElementById('ai-endpoint');
    var keyInput = document.getElementById('ai-key');
    var proxyFields = document.getElementById('ai-proxy-fields');
    var directFields = document.getElementById('ai-direct-fields');
    modeSel.value = state.mode;
    endpointInput.value = state.endpoint;
    keyInput.value = state.directKey;
    proxyFields.style.display = state.mode === 'proxy' ? '' : 'none';
    directFields.style.display = state.mode === 'direct' ? '' : 'none';

    modeSel.addEventListener('change', function () {
      proxyFields.style.display = modeSel.value === 'proxy' ? '' : 'none';
      directFields.style.display = modeSel.value === 'direct' ? '' : 'none';
    });

    document.getElementById('ai-save-settings').addEventListener('click', function () {
      state.mode = modeSel.value;
      state.endpoint = endpointInput.value.trim() || DEFAULT_ENDPOINT;
      state.directKey = keyInput.value.trim();
      saveSettings();
      ui.settingsView.style.display = 'none';
      addMessage(ui.messages, 'system', 'Settings saved (' + state.mode + ' mode).');
    });

    ui.launcher.addEventListener('click', function () {
      var open = ui.panel.classList.toggle('open');
      ui.launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && !ui.messages.childElementCount) {
        addMessage(ui.messages, 'bot',
          'Hi! I\'m your AI Tutor. Ask me to explain a concept, debug a snippet, ' +
          'or suggest what to learn next. If this is a fresh install, open ' +
          '\u2699 Settings first to connect a backend or API key — see the README.');
      }
      if (open) ui.textarea.focus();
    });
    ui.closeBtn.addEventListener('click', function () {
      ui.panel.classList.remove('open');
      ui.launcher.setAttribute('aria-expanded', 'false');
    });
    ui.settingsBtn.addEventListener('click', function () {
      ui.settingsView.style.display = ui.settingsView.style.display === 'none' ? 'flex' : 'none';
    });

    function autoGrow() {
      ui.textarea.style.height = 'auto';
      ui.textarea.style.height = Math.min(ui.textarea.scrollHeight, 90) + 'px';
    }
    ui.textarea.addEventListener('input', autoGrow);
    ui.textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    ui.sendBtn.addEventListener('click', send);

    async function send() {
      var text = ui.textarea.value.trim();
      if (!text) return;
      ui.textarea.value = '';
      autoGrow();
      addMessage(ui.messages, 'user', text);
      var thinking = addMessage(ui.messages, 'bot', 'Thinking…');
      try {
        var reply = state.mode === 'direct' ? await askDirect(text) : await askProxy(text);
        thinking.textContent = reply;
        state.history.push({ role: 'user', content: text });
        state.history.push({ role: 'assistant', content: reply });
        if (state.history.length > 20) state.history = state.history.slice(-20);
      } catch (err) {
        thinking.textContent =
          'Couldn\'t reach the AI Tutor (' + err.message + '). If you haven\'t set ' +
          'up the backend yet, run /server (see README) or switch to direct mode ' +
          'in \u2699 Settings.';
      }
      ui.messages.scrollTop = ui.messages.scrollHeight;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
