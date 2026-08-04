/**
 * Digital Enviro — Code Playground
 * ----------------------------------
 * JavaScript, and HTML+CSS run live in the browser via a sandboxed iframe —
 * no server needed. Other languages (Python, Java, C++, SQL, etc.) can't be
 * compiled or executed client-side, so the playground shows each one's
 * starter code with a clearly labeled SAMPLE OUTPUT rather than pretending
 * to run it. To make those languages actually runnable, wire this page up
 * to a code-execution API (e.g. Judge0, Piston) from a small backend proxy —
 * same pattern as /server/ai-server.js.
 */
(function () {
  var editor = document.getElementById('pg-editor');
  var output = document.getElementById('pg-output');
  var langSelect = document.getElementById('pg-lang');
  var runBtn = document.getElementById('pg-run');
  var note = document.getElementById('pg-note');

  var LIVE_LANGS = { javascript: true, html: true, css: true };

  var STARTERS = {
    javascript:
      '// JavaScript runs live — click Run or just keep typing.\n' +
      'function greet(name) {\n' +
      '  return `Hello, ${name}! Welcome to Digital Enviro.`;\n' +
      '}\n\n' +
      'console.log(greet("developer"));\n' +
      'for (let i = 1; i <= 3; i++) {\n' +
      '  console.log("Step", i);\n' +
      '}',
    html:
      '<!-- HTML + CSS render live in the preview panel -->\n' +
      '<h1 style="font-family:sans-serif;color:#3ea625;">Hello, Digital Enviro</h1>\n' +
      '<p style="font-family:sans-serif;">Edit this markup and watch the preview update.</p>\n' +
      '<button style="padding:8px 16px;">Click me</button>',
    css:
      '/* This CSS is applied to a sample layout in the preview */\n' +
      'body { font-family: sans-serif; background:#0b2338; color:#fff; padding:24px; }\n' +
      '.box { background:#3ea625; padding:20px; border-radius:12px; width:200px; }',
    python:
      '# Sample output shown below is pre-recorded, not executed live.\n' +
      'def greet(name):\n' +
      '    return f"Hello, {name}! Welcome to Digital Enviro."\n\n' +
      'print(greet("developer"))\n' +
      'for i in range(1, 4):\n' +
      '    print("Step", i)',
    java:
      '// Sample output shown below is pre-recorded, not executed live.\n' +
      'public class Main {\n' +
      '  public static void main(String[] args) {\n' +
      '    System.out.println("Hello, Digital Enviro!");\n' +
      '    for (int i = 1; i <= 3; i++) {\n' +
      '      System.out.println("Step " + i);\n' +
      '    }\n' +
      '  }\n' +
      '}',
    cpp:
      '// Sample output shown below is pre-recorded, not executed live.\n' +
      '#include <iostream>\n' +
      'int main() {\n' +
      '  std::cout << "Hello, Digital Enviro!" << std::endl;\n' +
      '  for (int i = 1; i <= 3; i++) {\n' +
      '    std::cout << "Step " << i << std::endl;\n' +
      '  }\n' +
      '  return 0;\n' +
      '}',
    sql:
      '-- Sample output shown below is pre-recorded, not executed live.\n' +
      'SELECT name, skill_level\n' +
      'FROM learners\n' +
      "WHERE skill_level = 'beginner'\n" +
      'ORDER BY name ASC;'
  };

  var SAMPLE_OUTPUT = {
    python: 'Hello, developer! Welcome to Digital Enviro.\nStep 1\nStep 2\nStep 3',
    java: 'Hello, Digital Enviro!\nStep 1\nStep 2\nStep 3',
    cpp: 'Hello, Digital Enviro!\nStep 1\nStep 2\nStep 3',
    sql: 'name     | skill_level\n---------+------------\nAda      | beginner\nGrace    | beginner'
  };

  function setNote(lang) {
    if (LIVE_LANGS[lang]) {
      note.textContent = 'This language runs live in your browser.';
    } else {
      note.textContent = 'Client-side execution isn\'t available for this language yet — showing recorded sample output. Connect a code-execution API on the backend to make it live.';
    }
  }

  function runJS(code) {
    var logs = [];
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    var win = iframe.contentWindow;
    win.console.log = function () {
      logs.push(Array.prototype.slice.call(arguments).map(function (a) {
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
        catch (e) { return String(a); }
      }).join(' '));
    };
    try {
      win.eval(code);
      output.innerHTML = logs.length ? escapeHtml(logs.join('\n')) : '<span class="muted">(no console output — try adding console.log(...))</span>';
    } catch (err) {
      output.innerHTML = '<span class="err">Error: ' + escapeHtml(err.message) + '</span>' +
        (logs.length ? '\n\n' + escapeHtml(logs.join('\n')) : '');
    } finally {
      document.body.removeChild(iframe);
    }
  }

  function runMarkup(code, lang) {
    var iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Live preview');
    iframe.style.cssText = 'width:100%;height:100%;border:none;background:#fff;border-radius:8px;';
    var doc = lang === 'css'
      ? '<style>' + code + '</style><div class="box">Digital Enviro</div>'
      : code;
    iframe.srcdoc = doc;
    output.innerHTML = '';
    output.appendChild(iframe);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function run() {
    var lang = langSelect.value;
    var code = editor.value;
    if (lang === 'javascript') runJS(code);
    else if (lang === 'html' || lang === 'css') runMarkup(code, lang);
    else output.textContent = SAMPLE_OUTPUT[lang] || '(no sample output for this language yet)';
  }

  langSelect.addEventListener('change', function () {
    editor.value = STARTERS[langSelect.value] || '';
    setNote(langSelect.value);
    run();
  });
  runBtn.addEventListener('click', run);
  editor.addEventListener('input', function () {
    if (LIVE_LANGS[langSelect.value]) run();
  });

  // Init
  editor.value = STARTERS[langSelect.value];
  setNote(langSelect.value);
  run();
})();
