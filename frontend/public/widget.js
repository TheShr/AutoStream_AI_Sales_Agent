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
          --primary: #8b5cf6;
          --primary-dark: #7c3aed;
          --background: #0f0f0f;
          --foreground: #ffffff;
          --muted: #1f1f1f;
          --border: #2a2a2a;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        #${WIDGET_ID} .widget-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--primary);
          border: none;
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 9999;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        #${WIDGET_ID} .widget-button:hover {
          background: var(--primary-dark);
          transform: scale(1.05);
        }

        #${WIDGET_ID} .widget-panel {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 350px;
          height: 500px;
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          z-index: 9998;
          display: none;
          flex-direction: column;
          overflow: hidden;
        }

        #${WIDGET_ID} .widget-panel.open {
          display: flex;
        }

        #${WIDGET_ID} .widget-header {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          background: var(--muted);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        #${WIDGET_ID} .widget-title {
          font-weight: 600;
          color: var(--foreground);
          margin: 0;
        }

        #${WIDGET_ID} .widget-close {
          background: none;
          border: none;
          color: var(--foreground);
          cursor: pointer;
          font-size: 20px;
          padding: 4px;
          border-radius: 4px;
        }

        #${WIDGET_ID} .widget-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        #${WIDGET_ID} .widget-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        #${WIDGET_ID} .message {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.4;
        }

        #${WIDGET_ID} .message.agent {
          background: var(--muted);
          color: var(--foreground);
          align-self: flex-start;
        }

        #${WIDGET_ID} .message.user {
          background: var(--primary);
          color: white;
          align-self: flex-end;
        }

        #${WIDGET_ID} .widget-input-area {
          padding: 16px;
          border-top: 1px solid var(--border);
          background: var(--background);
        }

        #${WIDGET_ID} .widget-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border);
          border-radius: 24px;
          background: var(--muted);
          color: var(--foreground);
          font-size: 14px;
          outline: none;
          resize: none;
        }

        #${WIDGET_ID} .widget-input:focus {
          border-color: var(--primary);
        }

        #${WIDGET_ID} .widget-send {
          position: absolute;
          right: 24px;
          bottom: 24px;
          background: var(--primary);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        #${WIDGET_ID} .widget-send:hover {
          background: var(--primary-dark);
        }

        #${WIDGET_ID} .typing {
          display: none;
          font-style: italic;
          color: #888;
          font-size: 14px;
        }

        @media (max-width: 480px) {
          #${WIDGET_ID} .widget-panel {
            width: calc(100vw - 40px);
            height: calc(100vh - 140px);
            bottom: 90px;
            right: 20px;
          }
        }
      `]);

      document.head.appendChild(style);
    }

    createWidget() {
      // Button
      this.button = createElement('button', {
        className: 'widget-button',
        'aria-label': 'Open chat'
      }, ['💬']);
      document.body.appendChild(this.button);

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

      document.body.appendChild(this.panel);

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