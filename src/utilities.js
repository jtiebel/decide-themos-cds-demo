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

  // Erstelle den Container für den Logeintrag
  const container = document.createElement('div');
  container.classList.add('console-entry');

  // Header-DIV: Zeitstempel und Label
  const headerDiv = document.createElement('div');
  headerDiv.classList.add('console-header');
  headerDiv.textContent = `[${time}] ${label}:`;
  container.appendChild(headerDiv);

  // Falls extra.source vorhanden, erstelle einen separaten DIV mit dem klickbaren Link
  if (extra.source) {
    const linkDiv = document.createElement('div');
    linkDiv.classList.add('console-link');
    linkDiv.innerHTML = `<span>{</span><br><span class="link">source: ${extra.source}</span><br><span>}</span>`;
    container.appendChild(linkDiv);
    // Den Link entfernen, damit er nicht doppelt erscheint
    delete extra.source;
  }

  // Wenn extra.hideData true ist, keine Daten (also JSON) im pre-Block ausgeben
  if (!extra.hideData) {
    const preData = document.createElement('pre');
    preData.classList.add('highlight');
    preData.innerHTML = syntaxHighlight(data);
    container.appendChild(preData);
  }

  // Falls zusätzliche Details (ohne hideData) vorhanden sind, in einem separaten PRE ausgeben
  if (Object.keys(extra).length > 0 && !extra.hideData) {
    const preExtra = document.createElement('pre');
    preExtra.classList.add('highlight');
    preExtra.innerHTML = `Zusätzliche Details:\n${syntaxHighlight(extra)}`;
    container.appendChild(preExtra);
  }

  // Füge den kompletten Logeintrag in das Console-DIV ein
  const consoleDiv = document.getElementById('console');
  consoleDiv.appendChild(container);

  // Automatisches Scrollen ans Ende
  setTimeout(() => { consoleDiv.scrollTop = consoleDiv.scrollHeight; }, 10);
}


