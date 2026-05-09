/**
 * AI Sales Agent Widget
 * Self-contained chat widget for website embedding
 */

(function initWidget() {
  'use strict';

  // Configuration - will be set by the script tag data attributes
  const WIDGET_ID = 'ai-sales-agent-widget';

  // Safely resolve the current script element
  function getCurrentScriptSafe() {
    // Try document.currentScript first (most reliable when script is synchronous)
    if (document.currentScript) {
      return document.currentScript;
    }

    // Fallback: find script by data-tenant attribute
    const scriptByTenant = document.querySelector('script[data-tenant]');
    if (scriptByTenant) {
      return scriptByTenant;
    }

    // Fallback: find script by src containing widget.js
    const scriptBySrc = document.querySelector('script[src*="widget.js"]');
    if (scriptBySrc) {
      return scriptBySrc;
    }

    return null;
  }

  // Extract configuration from script attributes
  function extractWidgetConfig() {
    const script = getCurrentScriptSafe();

    if (!script) {
      console.error('[AutoStream Widget] Could not find widget script element. Make sure the script tag has data-tenant attribute or src contains "widget.js"');
      return null;
    }

    const tenantId = script.getAttribute('data-tenant');
    if (!tenantId) {
      console.error('[AutoStream Widget] data-tenant attribute is required on the script tag');
      return null;
    }

    const apiUrl = script.getAttribute('data-api-url');
    let apiBase;

    if (apiUrl) {
      apiBase = apiUrl;
    } else if (script.src) {
      // Infer API base from script src (remove /widget.js and query params)
      apiBase = script.src.replace(/\/widget\.js(?:\?.*)?$/, '');
    } else {
      // Final fallback to current domain
      apiBase = window.location.origin;
    }

    return { tenantId, apiBase };
  }

  // Get widget configuration
  const config = extractWidgetConfig();
  if (!config) {
    return; // Exit early if configuration failed
  }

  const { tenantId, apiBase: API_BASE } = config;

  // Debug log (only once)
  console.log('[AutoStream Widget] Initialized', { tenantId, apiBase: API_BASE });

  // Utility functions
  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.keys(attrs).forEach(key => {
      if (key === 'className') {
        el.className = attrs[key];
      } else if (key === 'style' && typeof attrs[key] === 'object') {
        Object.assign(el.style, attrs[key]);
      } else {
        el.setAttribute(key, attrs[key]);
      }
    });
    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    });
    return el;
  }

  function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Widget class
  class SalesAgentWidget {
    constructor(config) {
      this.config = config;
      this.userId = localStorage.getItem('ai_widget_user_id') || generateUserId();
      localStorage.setItem('ai_widget_user_id', this.userId);
      this.isOpen = false;
      this.messages = [];
      this.init();
    }

    async init() {
      this.createStyles();
      this.createWidget();
      this.bindEvents();

      // Load welcome message
      this.addMessage('agent', this.config.welcome_message);
    }

    createStyles() {
      const style = createElement('style', {}, [`
        #${WIDGET_ID} {
          all: initial;
          --primary: #5b21b6;
          --primary-strong: #7c3aed;
          --surface: rgba(255, 255, 255, 0.94);
          --surface-strong: rgba(248, 250, 252, 0.98);
          --surface-soft: rgba(243, 244, 246, 0.9);
          --border: rgba(15, 23, 42, 0.08);
          --shadow: 0 28px 80px rgba(15, 23, 42, 0.18), 0 8px 24px rgba(15, 23, 42, 0.08);
          --text: #111827;
          --muted-text: #4b5563;
          --agent-bg: #f8fafc;
          --user-bg: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 14px;
          color: var(--text);
        }

        #${WIDGET_ID} .widget-button {
          position: fixed;
          inset: auto 24px 24px auto;
          width: 66px;
          height: 66px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
          border: none;
          color: white;
          cursor: pointer;
          box-shadow: 0 24px 64px rgba(249, 115, 22, 0.22);
          z-index: 99999;
          transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
          display: grid;
          place-items: center;
          outline: none;
        }

        #${WIDGET_ID} .widget-button:hover,
        #${WIDGET_ID} .widget-button:focus-visible {
          transform: translateY(-2px);
          box-shadow: 0 28px 72px rgba(249, 115, 22, 0.26);
          background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
        }

        #${WIDGET_ID} .widget-button-icon {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
        }

        #${WIDGET_ID} .widget-button-icon svg {
          width: 100%;
          height: 100%;
          stroke: white;
          stroke-width: 1.8;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        #${WIDGET_ID} .widget-panel {
          position: fixed;
          right: 24px;
          bottom: 100px;
          width: min(380px, calc(100vw - 32px));
          max-width: 380px;
          height: min(540px, calc(100vh - 120px));
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          box-shadow: var(--shadow);
          z-index: 99998;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
          visibility: hidden;
          transform: translateY(18px) scale(0.98);
          transition: opacity 0.26s ease, transform 0.26s ease, visibility 0.26s ease;
          backdrop-filter: blur(16px);
        }

        #${WIDGET_ID} .widget-panel.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }

        #${WIDGET_ID} .widget-header {
          padding: 18px 20px;
          background: rgba(255, 255, 255, 0.82);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        #${WIDGET_ID} .widget-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          color: var(--text);
          line-height: 1.2;
        }

        #${WIDGET_ID} .widget-close {
          background: rgba(15, 23, 42, 0.04);
          border: 1px solid transparent;
          color: var(--text);
          cursor: pointer;
          font-size: 18px;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        #${WIDGET_ID} .widget-close:hover,
        #${WIDGET_ID} .widget-close:focus-visible {
          background: rgba(79, 70, 229, 0.1);
          transform: translateY(-1px);
        }

        #${WIDGET_ID} .widget-messages {
          flex: 1;
          overflow-y: auto;
          padding: 18px 18px 10px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        #${WIDGET_ID} .message {
          max-width: 82%;
          min-width: 80px;
          padding: 14px 18px;
          border-radius: 22px;
          font-size: 14px;
          line-height: 1.65;
          white-space: pre-wrap;
          word-break: break-word;
          box-shadow: 0 14px 40px rgba(15, 23, 42, 0.05);
          animation: widgetMessageFade 0.28s ease;
        }

        #${WIDGET_ID} .message.agent {
          align-self: flex-start;
          background: var(--agent-bg);
          color: var(--text);
        }

        #${WIDGET_ID} .message.user {
          align-self: flex-end;
          background: var(--user-bg);
          color: #fff;
          box-shadow: 0 18px 40px rgba(79, 70, 229, 0.12);
        }

        #${WIDGET_ID} .message.typing {
          display: flex;
          align-items: center;
          gap: 8px;
          font-style: normal;
          color: var(--muted-text);
          background: rgba(243, 244, 246, 0.92);
          border-radius: 20px;
          box-shadow: none;
        }

        #${WIDGET_ID} .message.typing::before {
          content: '';
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #c7d2fe;
          animation: widgetTypingPulse 1.4s infinite ease-in-out;
        }

        #${WIDGET_ID} .widget-input-area {
          position: relative;
          padding: 18px 20px 20px;
          border-top: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.92);
        }

        #${WIDGET_ID} .widget-input {
          width: 100%;
          min-height: 44px;
          padding: 16px 58px 16px 18px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 18px;
          background: #ffffff;
          color: var(--text);
          font-size: 14px;
          line-height: 1.6;
          outline: none;
          resize: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        #${WIDGET_ID} .widget-input:focus {
          border-color: rgba(124, 58, 237, 0.5);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.08);
        }

        #${WIDGET_ID} .widget-send {
          position: absolute;
          right: 22px;
          bottom: 24px;
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: none;
          background: var(--primary);
          color: #fff;
          cursor: pointer;
          display: grid;
          place-items: center;
          font-size: 16px;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        #${WIDGET_ID} .widget-send:hover,
        #${WIDGET_ID} .widget-send:focus-visible {
          background: #8b5cf6;
          transform: translateY(-1px);
        }

        #${WIDGET_ID} .widget-send:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @keyframes widgetMessageFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes widgetTypingPulse {
          0%, 80%, 100% { opacity: 0.35; }
          40% { opacity: 1; }
        }

        @media (max-width: 540px) {
          #${WIDGET_ID} .widget-button {
            right: 16px;
            bottom: 16px;
          }

          #${WIDGET_ID} .widget-panel {
            right: 12px;
            bottom: 12px;
            width: calc(100vw - 24px);
            max-width: none;
            height: calc(100vh - 24px);
            border-radius: 20px;
          }

          #${WIDGET_ID} .widget-input-area {
            padding: 16px 16px 22px;
          }
        }
      `]);

      document.head.appendChild(style);
    }

    createWidget() {
      // Create root container
      this.root = createElement('div', {
        id: WIDGET_ID
      });
      document.body.appendChild(this.root);

      // Button
      this.button = createElement('button', {
        className: 'widget-button',
        'aria-label': 'Open chat'
      }, [createElement('span', { className: 'widget-button-icon' }, [
        createElement('svg', {
          viewBox: '0 0 24 24',
          xmlns: 'http://www.w3.org/2000/svg',
          'aria-hidden': 'true',
          focusable: 'false'
        }, [
          createElement('path', { d: 'M4 5.5C4 4.12 5.12 3 6.5 3h11c1.38 0 2.5 1.12 2.5 2.5v9c0 1.38-1.12 2.5-2.5 2.5H9.5L5 21V17.5H6.5C5.67 17.5 5 16.83 5 16V5.5Z' }),
          createElement('path', { d: 'M8.75 9.5h6.5M8.75 12.5h4' })
        ])
      ])]);
      this.root.appendChild(this.button);

      // Panel
      this.panel = createElement('div', {
        className: 'widget-panel'
      }, [
        // Header
        createElement('div', { className: 'widget-header' }, [
          createElement('h3', { className: 'widget-title' }, [this.config.business_name]),
          createElement('button', {
            className: 'widget-close',
            'aria-label': 'Close chat'
          }, ['×'])
        ]),

        // Messages
        createElement('div', { className: 'widget-messages' }),

        // Input area
        createElement('div', { className: 'widget-input-area' }, [
          createElement('textarea', {
            className: 'widget-input',
            placeholder: 'Type your message...',
            rows: 1
          }),
          createElement('button', {
            className: 'widget-send',
            'aria-label': 'Send message'
          }, ['→'])
        ])
      ]);

      this.root.appendChild(this.panel);

      // Get references
      this.messagesContainer = this.panel.querySelector('.widget-messages');
      this.input = this.panel.querySelector('.widget-input');
      this.sendButton = this.panel.querySelector('.widget-send');
      this.closeButton = this.panel.querySelector('.widget-close');
    }

    bindEvents() {
      this.button.addEventListener('click', () => this.toggle());
      this.closeButton.addEventListener('click', () => this.close());
      this.sendButton.addEventListener('click', () => this.sendMessage());
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Auto-resize textarea
      this.input.addEventListener('input', () => {
        this.input.style.height = 'auto';
        this.input.style.height = Math.min(this.input.scrollHeight, 100) + 'px';
      });
    }

    toggle() {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.panel.classList.add('open');
        this.input.focus();
      } else {
        this.close();
      }
    }

    close() {
      this.isOpen = false;
      this.panel.classList.remove('open');
    }

    addMessage(sender, text) {
      const messageEl = createElement('div', {
        className: `message ${sender}`
      }, [text]);

      this.messagesContainer.appendChild(messageEl);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      this.messages.push({ sender, text });
    }

    async sendMessage() {
      const text = this.input.value.trim();
      if (!text) return;

      this.addMessage('user', text);
      this.input.value = '';
      this.input.style.height = 'auto';

      // Show typing indicator
      const typingEl = createElement('div', { className: 'message agent typing' }, ['Typing...']);
      this.messagesContainer.appendChild(typingEl);

      try {
        const response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_id: this.config.tenant_id,
            user_id: this.userId,
            message: text
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        typingEl.remove();
        this.addMessage('agent', data.response);
      } catch (error) {
        typingEl.remove();
        this.addMessage('agent', 'Sorry, I encountered an error. Please try again.');
        console.error('Widget error:', error);
      }
    }
  }

  // Initialize widget when DOM is ready
  function initWidget() {
    // Fetch widget config
    fetch(`${API_BASE}/widget/config?tenant_id=${encodeURIComponent(tenantId)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load widget config');
        }
        return response.json();
      })
      .then(config => {
        new SalesAgentWidget(config);
      })
      .catch(error => {
        console.error('[AutoStream Widget] Initialization failed:', error);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

})();