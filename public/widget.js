(function() {
  'use strict';

  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var chatbotId = currentScript.getAttribute('data-chatbot-id');

  if (!chatbotId) {
    console.error('CatchJar: No chatbot ID provided. Please add data-chatbot-id attribute to the script tag.');
    return;
  }

  if (window.CatchJar && window.CatchJar.loaded) {
    return;
  }

  window.CatchJar = window.CatchJar || {};
  window.SupportBots = window.CatchJar; // back-compat alias, safe to drop later
  window.CatchJar.loaded = true;
  window.CatchJar.chatbotId = chatbotId;

  // Base URL = where widget.js was loaded from (the CatchJar app origin,
  // NOT the customer's site).
  var scriptUrl = new URL(currentScript.src, window.location.href);
  var baseUrl = scriptUrl.protocol + '//' + scriptUrl.host;

  var SUPABASE_URL = 'https://jsyqavxvspkqitrwbeay.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzeXFhdnh2c3BrcWl0cndiZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjY2NjgsImV4cCI6MjA3MzYwMjY2OH0.JVFxiqvteDQToL3nrhCeKbJC8lm6LivGcVurXkT8AeQ';

  // Collapsed bubble footprint. The iframe is intentionally small so it never
  // covers (and never steals clicks from) the customer's page.
  var CLOSED = { width: 96, height: 96 };
  var MARGIN = 16;

  // Public read path: SECURITY DEFINER RPC, active bots only.
  fetch(SUPABASE_URL + '/rest/v1/rpc/get_chatbot_widget_config', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ _chatbot_id: chatbotId })
  })
  .then(function(response) { return response.json(); })
  .then(function(data) {
    if (!data || !data.length) {
      console.error('CatchJar: Chatbot not found, or it is not active yet. Activate the chatbot in your CatchJar dashboard.');
      return;
    }

    var chatbotData = data[0];
    var chatbotType = chatbotData.chatbot_type || 'standard';
    var config = chatbotData.widget_config || {};
    var position = config.position || 'bottom-right';

    var widgetContainer = document.createElement('div');
    widgetContainer.id = 'catchjar-widget-' + chatbotId;

    // Anchor the container itself; size it to the collapsed bubble and grow it
    // only when the widget page asks (CATCHJAR_RESIZE).
    function anchor(width, height) {
      var vertical = position.indexOf('top') === 0 ? 'top' : 'bottom';
      var horizontal = position.indexOf('left') !== -1 ? 'left' : 'right';
      widgetContainer.style.cssText = [
        'position: fixed',
        vertical + ': 0',
        horizontal + ': 0',
        'width: ' + width + 'px',
        'height: ' + height + 'px',
        'max-width: 100vw',
        'max-height: 100vh',
        'border: none',
        'background: transparent',
        'overflow: hidden',
        'z-index: 2147483647'
      ].join('; ');
    }

    anchor(CLOSED.width, CLOSED.height);

    var widgetUrl = baseUrl + '/widget?id=' + encodeURIComponent(chatbotId) + '&embedded=true';
    if (chatbotType === 'video_bot') {
      widgetUrl += '&type=video';
    } else if (chatbotType === 'avatar_bot') {
      widgetUrl += '&type=avatar';
    }

    var iframe = document.createElement('iframe');
    iframe.src = widgetUrl;
    iframe.style.cssText = [
      'width: 100%',
      'height: 100%',
      'border: none',
      'background: transparent',
      'display: block',
      'color-scheme: normal'
    ].join('; ');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('title', 'CatchJar Chat Widget');
    iframe.setAttribute('allow', 'microphone; camera; autoplay');

    widgetContainer.appendChild(iframe);
    document.body.appendChild(widgetContainer);

    window.addEventListener('message', function(event) {
      if (event.origin !== baseUrl) return;
      var payload = event.data || {};

      if (payload.type === 'CATCHJAR_RESIZE' || payload.type === 'SUPPORTBOTS_RESIZE') {
        var w = Math.max(CLOSED.width, Number(payload.width) || CLOSED.width);
        var h = Math.max(CLOSED.height, Number(payload.height) || CLOSED.height);
        anchor(w + MARGIN, h + MARGIN);
      } else if (payload.type === 'CATCHJAR_CLOSE' || payload.type === 'SUPPORTBOTS_CLOSE') {
        anchor(CLOSED.width, CLOSED.height);
      }
    });

    window.CatchJar.api = {
      show: function() { widgetContainer.style.display = 'block'; },
      hide: function() { widgetContainer.style.display = 'none'; },
      destroy: function() {
        if (widgetContainer.parentNode) {
          widgetContainer.parentNode.removeChild(widgetContainer);
        }
        delete window.CatchJar;
        delete window.SupportBots;
      }
    };
  })
  .catch(function(error) {
    console.error('CatchJar: Error loading chatbot data', error);
  });
})();
