import { runClimateTool } from '../tools/queries/climate.js';
import {
  answerById,
  answerOffline,
  cellEntryId,
  describeCall,
} from './offlineCopilot.js';

const DEFAULT_AOI = 'sukkur';
const MAX_QUESTION_CHARS = 500;
const URDU = /[؀-ۿ]/;

const CHIPS = [
  {
    label: 'Riskiest 5 cells',
    entryId: () => 'riskiest_cells',
    calls: ({ aoi }) => [
      ['rank_climate_risk', { aoi, hazard: 'composite', limit: 5 }],
    ],
  },
  {
    label: 'Heat summary',
    entryId: () => 'hazard_heat',
    calls: ({ aoi }) => [
      ['get_aoi_risk_summary', { aoi }],
      ['rank_climate_risk', { aoi, hazard: 'heat', limit: 5 }],
    ],
  },
  {
    label: 'Explain selected cell',
    needsCell: true,
    entryId: ({ cellId }) => cellEntryId(cellId),
    calls: ({ cellId }) => [['get_climate_risk', { cell_id: cellId }]],
  },
  {
    label: 'Urdu advisory',
    calls: ({ aoi, cellId }) => [
      [
        'get_climate_advisory',
        cellId ? { cell_id: cellId, lang: 'ur' } : { aoi, lang: 'ur' },
      ],
    ],
  },
];

const typingDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300));

export class CopilotPanel {
  constructor({ getContext } = {}) {
    this.getContext = getContext || (() => ({}));
    this.visible = false;
    this.busy = false;
    this._buildDOM();
  }

  _buildDOM() {
    this.container = document.createElement('div');
    this.container.id = 'agahi-copilot-panel';
    this.container.className = 'agahi-copilot hidden';
    this.container.innerHTML = `
      <div class="agahi-copilot-header">
        <span class="agahi-copilot-title">Agahi Copilot</span>
        <button class="agahi-copilot-close" type="button" aria-label="Close">✕</button>
      </div>
      <div class="agahi-copilot-chips"></div>
      <div class="agahi-copilot-messages" aria-live="polite"></div>
      <form class="agahi-copilot-form">
        <textarea class="agahi-copilot-input" rows="2" maxlength="${MAX_QUESTION_CHARS}" placeholder="e.g. Which cells have the highest heat risk?"></textarea>
        <button class="agahi-copilot-send" type="submit">Send</button>
      </form>
      <div class="agahi-copilot-foot">Answers use only computed grid values</div>
    `;
    document.body.appendChild(this.container);
    this.messages = this.container.querySelector('.agahi-copilot-messages');
    this.input = this.container.querySelector('.agahi-copilot-input');
    this.sendButton = this.container.querySelector('.agahi-copilot-send');
    const chips = this.container.querySelector('.agahi-copilot-chips');

    for (const chip of CHIPS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'agahi-copilot-chip';
      button.textContent = chip.label;
      button.addEventListener('click', () => this._runChip(chip));
      chips.appendChild(button);
    }

    this.container
      .querySelector('.agahi-copilot-close')
      .addEventListener('click', () => this.hide());
    this.container
      .querySelector('.agahi-copilot-form')
      .addEventListener('submit', (event) => {
        event.preventDefault();
        this._ask();
      });
    this.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this._ask();
      }
    });
  }

  show() {
    this.visible = true;
    this.container.classList.remove('hidden');
    this.input.focus();
  }

  hide() {
    this.visible = false;
    this.container.classList.add('hidden');
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
    return this.visible;
  }

  _context() {
    const context = this.getContext() || {};
    return {
      aoi: context.aoi || DEFAULT_AOI,
      cellId: context.cellId || null,
    };
  }

  _setBusy(busy) {
    this.busy = busy;
    this.sendButton.disabled = busy;
    this.container.classList.toggle('agahi-copilot-busy', busy);
  }

  _add(role, text, { dir = null, footer = null, warning = null } = {}) {
    const node = document.createElement('div');
    node.className = `agahi-copilot-msg agahi-copilot-${role}`;
    const body = document.createElement('div');
    body.className = 'agahi-copilot-text';
    body.textContent = text;
    if (dir === 'rtl' || (dir == null && URDU.test(text))) {
      body.dir = 'rtl';
      body.lang = 'ur';
    }
    node.appendChild(body);
    if (warning) {
      const badge = document.createElement('div');
      badge.className = 'agahi-copilot-warning';
      badge.textContent = `⚠ ${warning}`;
      node.appendChild(badge);
    }
    if (footer) {
      const foot = document.createElement('div');
      foot.className = 'agahi-copilot-computed';
      foot.textContent = `Computed by: ${footer}`;
      node.appendChild(foot);
    }
    this.messages.appendChild(node);
    this.messages.scrollTop = this.messages.scrollHeight;
    return node;
  }

  async _runChip(chip) {
    if (this.busy) return;
    const context = this._context();
    this._add('user', chip.label);
    if (chip.needsCell && !context.cellId) {
      this._add('assistant', 'Select a cell on the map first.');
      return;
    }
    this._setBusy(true);
    try {
      const entry = chip.entryId
        ? await answerById(context.aoi, chip.entryId(context), 'en')
        : null;
      if (entry) {
        this._add('assistant', entry.answer, {
          dir: entry.dir,
          footer: entry.footer,
        });
        return;
      }
      const calls = chip.calls(context);
      for (const [tool, args] of calls) {
        const result = await runClimateTool(tool, args);
        this._add('assistant', result.summary, {
          dir: result.data?.dir ?? null,
          footer: describeCall(tool, args),
        });
      }
    } catch (error) {
      this._add(
        'assistant',
        error?.name === 'ToolError'
          ? error.message
          : 'The risk data could not be loaded.',
      );
    } finally {
      this._setBusy(false);
    }
  }

  async _ask() {
    const question = this.input.value.trim();
    if (!question || this.busy) return;
    this.input.value = '';
    this._add('user', question);
    this._setBusy(true);
    const pending = this._add('assistant', '…');
    const context = this._context();
    try {
      const [result] = await Promise.all([
        answerOffline(question, context),
        typingDelay(),
      ]);
      pending.remove();
      if (!result) {
        this._add(
          'assistant',
          'No pre-written answers are available for this area. Try the chips.',
        );
        return;
      }
      this._add('assistant', result.answer, {
        dir: result.dir,
        footer: result.footer,
      });
    } catch {
      pending.remove();
      this._add('assistant', 'The copilot could not answer that.');
    } finally {
      this._setBusy(false);
    }
  }
}
