const AGENT_URL = import.meta.env.VITE_THERMAL_PRINT_AGENT_URL || 'http://127.0.0.1:17858';
const LINE_WIDTH = 32;
const PRINT_COOLDOWN_MS = 5000;

let printInProgress = false;
let lastPrintAt = 0;

function textOf(element) {
  return (element?.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function wrapLine(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines = [];
  let current = '';
  for (const word of words) {
    if (!current) current = word;
    else if (`${current} ${word}`.length <= LINE_WIDTH) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function addWrapped(lines, text, centered = false) {
  wrapLine(text).forEach((line) => lines.push(centered ? line.padStart(Math.floor((LINE_WIDTH + line.length) / 2)) : line));
}

function addKeyValue(lines, label, value) {
  const cleanLabel = label.replace(/\s+/g, ' ').trim();
  const valueLines = wrapLine(value);
  const firstValue = valueLines.shift() || '';
  const available = LINE_WIDTH - firstValue.length;

  if (cleanLabel.length + 1 <= available) {
    lines.push(`${cleanLabel}${' '.repeat(available - cleanLabel.length)}${firstValue}`);
  } else {
    addWrapped(lines, cleanLabel);
    if (firstValue) lines.push(firstValue);
  }
  valueLines.forEach((line) => lines.push(line));
}

function addMetaRows(lines, section) {
  section.querySelectorAll('.meta-row').forEach((row) => {
    const values = Array.from(row.children).map(textOf).filter(Boolean);
    if (values.length >= 2) addKeyValue(lines, values[0], values.slice(1).join(' '));
    else if (values[0]) addWrapped(lines, values[0]);
  });
}

function addTable(lines, table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return;

  const headings = Array.from(rows[0].querySelectorAll('th')).map(textOf).filter(Boolean);
  if (headings.length) lines.push('CANT  PRODUCTO              TOTAL');

  rows.filter((row) => row.querySelector('td')).forEach((row) => {
    const cells = Array.from(row.querySelectorAll('td')).map(textOf);
    if (cells.length < 3) {
      addWrapped(lines, cells.join(' '));
      return;
    }

    const quantity = cells[0];
    const product = cells[1];
    const total = cells[2];
    const productLines = wrapLine(`${quantity} ${product}`);
    const firstLine = productLines.shift() || quantity;
    const room = LINE_WIDTH - total.length;

    if (firstLine.length + 1 <= room) lines.push(`${firstLine}${' '.repeat(room - firstLine.length)}${total}`);
    else {
      lines.push(firstLine);
      lines.push(total.padStart(LINE_WIDTH));
    }
    productLines.forEach((line) => lines.push(line));
  });
}

function ticketToPlainText(ticket) {
  const lines = [];

  Array.from(ticket.children).forEach((section) => {
    const classes = section.classList;
    if (classes.contains('ticket-header') || classes.contains('ticket-repair-header')) {
      addWrapped(lines, textOf(section.querySelector('h4')), true);
      addWrapped(lines, textOf(section.querySelector('.ticket-subtitle, .ticket-repair-subtitle')), true);
    } else if (classes.contains('ticket-divider') || classes.contains('ticket-repair-divider')) {
      lines.push('-'.repeat(LINE_WIDTH));
    } else if (classes.contains('ticket-meta') || classes.contains('ticket-repair-meta')) {
      addMetaRows(lines, section);
    } else if (classes.contains('ticket-repair-box')) {
      addWrapped(lines, textOf(section.querySelector('.box-title')));
      addWrapped(lines, textOf(section.querySelector('.box-value')));
    } else if (section.tagName === 'TABLE') {
      addTable(lines, section);
    } else if (classes.contains('ticket-total-box')) {
      const values = Array.from(section.children).map(textOf).filter(Boolean);
      if (values.length >= 2) addKeyValue(lines, values[0], values.slice(1).join(' '));
    } else if (classes.contains('ticket-footer') || classes.contains('ticket-repair-footer')) {
      addWrapped(lines, textOf(section), true);
    } else {
      addWrapped(lines, textOf(section));
    }
  });

  return lines.filter((line, index) => line || index > 0).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function callAgent(path, options = {}, timeoutMs = 2500) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${AGENT_URL}${path}`, { ...options, signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'El agente de impresión rechazó la solicitud.');
    return body;
  } finally {
    window.clearTimeout(timeout);
  }
}

/**
 * Imprime un ticket por ESC/POS mediante el agente local de MoliCell.
 * La protección local evita duplicados al hacer varios clics seguidos.
 *
 * @param {string} elementId ID del contenedor del ticket visible.
 * @returns {Promise<boolean>} true cuando el trabajo se envió a Windows.
 */
export const printThermalTicket = async (elementId) => {
  const now = Date.now();
  if (printInProgress || now - lastPrintAt < PRINT_COOLDOWN_MS) return false;

  const ticket = document.getElementById(elementId);
  if (!ticket) {
    window.alert('No se encontró el comprobante que se debe imprimir.');
    return false;
  }

  const text = ticketToPlainText(ticket);
  if (!text) {
    window.alert('El comprobante está vacío y no se puede imprimir.');
    return false;
  }

  printInProgress = true;
  try {
    await callAgent('/health');
    await callAgent('/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }, 15000);
    lastPrintAt = Date.now();
    return true;
  } catch (error) {
    const isUnavailable = error.name === 'AbortError' || error instanceof TypeError;
    window.alert(
      isUnavailable
        ? 'No se encontró el agente de impresión MoliCell. Conectá la POS-58 y verificá que el agente esté iniciado en esta PC.'
        : `No se pudo imprimir el ticket: ${error.message}`,
    );
    return false;
  } finally {
    printInProgress = false;
  }
};
