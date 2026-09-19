const AGENT_URL = import.meta.env.VITE_THERMAL_PRINT_AGENT_URL || 'http://127.0.0.1:17858';
const LINE_WIDTH = 32;

const waitFor = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function wrapLine(line) {
  const words = line.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= LINE_WIDTH) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function ticketToPlainText(ticket) {
  // innerText conserva los saltos entre los bloques del comprobante y evita
  // enviar HTML al controlador de la impresora.
  return ticket.innerText
    .replace(/\u00a0/g, ' ')
    .split(/\r?\n/)
    .flatMap((line) => {
      const compact = line.replace(/\s+/g, ' ').trim();
      if (/^[─—–_-]{3,}$/.test(compact)) return ['-'.repeat(LINE_WIDTH)];
      return wrapLine(compact);
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function callAgent(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${AGENT_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'El agente de impresión rechazó la solicitud.');
    return body;
  } finally {
    window.clearTimeout(timeout);
  }
}

/**
 * Imprime un ticket por ESC/POS mediante el agente local de MoliCell.
 * Esto evita la ventana de Chrome y el largo de papel que fija el driver POS.
 *
 * @param {string} elementId ID del contenedor del ticket visible.
 * @returns {Promise<boolean>} true cuando el trabajo se envió a Windows.
 */
export const printThermalTicket = async (elementId) => {
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

  try {
    await callAgent('/health');
    await callAgent('/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return true;
  } catch (error) {
    const isUnavailable = error.name === 'AbortError' || error instanceof TypeError;
    window.alert(
      isUnavailable
        ? 'No se encontró el agente de impresión MoliCell. Conectá la POS-58 y verificá que el agente esté iniciado en esta PC.'
        : `No se pudo imprimir el ticket: ${error.message}`,
    );
    return false;
  }
};

// Pequeña pausa exportada para que las pantallas que creen un ticket y lo
// impriman inmediatamente puedan esperar el render de React si lo necesitan.
export const waitForTicketRender = () => waitFor(0);
