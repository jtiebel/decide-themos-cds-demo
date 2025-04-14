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
  
  // Erstelle einen Header-Bereich, der den Zeitstempel, die Log-Message und (optional) den Link enthält
  let headerHtml = `<div class="console-header">[${time}] ${label}:</div>`;
  
  // Wenn in extra.source ein Link enthalten ist, diesen als klickbaren Link einfügen
  if (extra.source) {
    headerHtml += `<div class="console-link">Source: ${extra.source}</div>`;
    delete extra.source;  // Entferne den source-Eintrag, um Duplikate in extra zu vermeiden
  }
  
  // Erstelle den pre-Bereich für die formatierten Daten
  let preHtml = `<pre class="highlight">${syntaxHighlight(data)}</pre>`;
  
  // Bei zusätzlichen Details ebenfalls in einem separaten pre-Block darstellen
  if (Object.keys(extra).length > 0) {
    preHtml += `<pre class="highlight">Zusätzliche Details:<br>${syntaxHighlight(extra)}</pre>`;
  }
  
  // Erstelle einen Container und setze innerHTML aus Header und pre-Block
  const container = document.createElement('div');
  container.innerHTML = headerHtml + preHtml;
  
  const consoleDiv = document.getElementById('console');
  consoleDiv.append(container);
  
  // Scrollt automatisch ans Ende
  setTimeout(() => { consoleDiv.scrollTop = consoleDiv.scrollHeight; }, 10);
}
