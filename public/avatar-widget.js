(function() {
  'use strict';

  // Resolve our own origin at load time. Must happen here: init() is often
  // invoked from script.onload, where document.currentScript is null.
  var thisScript = document.currentScript;
  if (!thisScript) {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('avatar-widget.js') !== -1) {
        thisScript = scripts[i];
        break;
      }
    }
  }
  var WIDGET_ORIGIN = thisScript && thisScript.src
    ? (function() {
        var u = new URL(thisScript.src, window.location.href);
        return u.protocol + '//' + u.host;
      })()
    : window.location.protocol + '//' + window.location.host;

  // Prevent multiple initializations
  if (window.AvatarChatbotWidget) {
    console.warn('AvatarChatbotWidget already initialized');
    return;
  }

  const AvatarChatbotWidget = {
    init: function(config) {
      if (!config.chatbotId) {
        console.error('AvatarChatbotWidget: chatbotId is required');
        return;
      }

      this.chatbotId = config.chatbotId;
      this.baseUrl = WIDGET_ORIGIN;

      this.createWidget();
      this.attachStyles();
    },

    createWidget: function() {
      // Create container
      const container = document.createElement('div');
      container.id = 'avatar-chatbot-widget-container';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
      `;

      // Create button
      const button = document.createElement('button');
      button.id = 'avatar-chatbot-widget-button';
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
      button.style.cssText = `
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: hsl(262.1 83.3% 57.8%);
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      `;
      button.onmouseover = () => {
        button.style.transform = 'scale(1.05)';
      };
      button.onmouseout = () => {
        button.style.transform = 'scale(1)';
      };

      // Create iframe container (hidden by default)
      const iframeContainer = document.createElement('div');
      iframeContainer.id = 'avatar-chatbot-widget-iframe-container';
      iframeContainer.style.cssText = `
        display: none;
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 384px;
        height: 600px;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
        overflow: hidden;
        background: white;
        z-index: 999999;
      `;

      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = `${this.baseUrl}/widget?chatbotId=${this.chatbotId}&type=avatar&embedded=true`;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
      `;
      iframe.allow = 'camera; microphone';

      // Add close button to iframe container
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        cursor: pointer;
        font-size: 24px;
        line-height: 1;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Toggle widget
      button.onclick = () => {
        const isOpen = iframeContainer.style.display === 'block';
        button.style.display = isOpen ? 'flex' : 'none';
        iframeContainer.style.display = isOpen ? 'none' : 'block';
      };

      closeButton.onclick = () => {
        button.style.display = 'flex';
        iframeContainer.style.display = 'none';
      };

      // Assemble
      iframeContainer.appendChild(closeButton);
      iframeContainer.appendChild(iframe);
      container.appendChild(button);
      container.appendChild(iframeContainer);
      document.body.appendChild(container);
    },

    attachStyles: function() {
      // Add responsive styles
      const style = document.createElement('style');
      style.textContent = `
        @media (max-width: 640px) {
          #avatar-chatbot-widget-iframe-container {
            width: 100vw !important;
            height: 100vh !important;
            bottom: 0 !important;
            right: 0 !important;
            border-radius: 0 !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  };

  window.AvatarChatbotWidget = AvatarChatbotWidget;
})();
