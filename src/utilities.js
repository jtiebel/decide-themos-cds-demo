export const syntaxHighlight = json => {
  if (typeof json !== 'string') json = JSON.stringify(json, null, 2);
  return json.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|\d+)/g,
      match => {
        const cls = /^"/.test(match)
          ? (/:$/.test(match) ? 'console-key' : 'console-string')
          : (/true|false/.test(match)
              ? 'console-boolean'
              : (/null/.test(match) ? 'console-null' : 'console-number'));
        return `<span class="${cls}">${match}</span>`;
      }
    );
};

export function logToConsole(label, data, extra = {}) {
  const time = new Date().toLocaleTimeString();
  let html = `<span class="console-timestamp">[${time}] ${label}:</span><br>${syntaxHighlight(data)}`;
  if (Object.keys(extra).length > 0) {
    html += `<br><em>Zusätzliche Details:</em><br>${syntaxHighlight(extra)}`;
  }
  const pre = document.createElement('pre');
  pre.innerHTML = html;
  const consoleDiv = document.getElementById('console');
  consoleDiv.querySelectorAll('pre').forEach(el => el.classList.remove('highlight'));
  pre.classList.add('highlight');
  consoleDiv.append(pre);
  setTimeout(() => { consoleDiv.scrollTop = consoleDiv.scrollHeight; }, 10);
}
