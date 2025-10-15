(function() {
  'use strict';
  
  // Get the script tag that loaded this widget
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  
  // Extract chatbot ID from script attributes
  var chatbotId = currentScript.getAttribute('data-chatbot-id');
  
  if (!chatbotId) {
    console.error('SupportBots: No chatbot ID provided. Please add data-chatbot-id attribute to the script tag.');
    return;
  }
  
  // Prevent loading multiple times
  if (window.SupportBots && window.SupportBots.loaded) {
    return;
  }
  
  // Create SupportBots namespace
  window.SupportBots = window.SupportBots || {};
  window.SupportBots.loaded = true;
  window.SupportBots.chatbotId = chatbotId;
  
  // Get the base URL from the script src or use default
  var scriptSrc = currentScript.src;
  var baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));
  
  // If running locally, use localhost
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    baseUrl = 'http://localhost:8080';
  } else {
    // Production URL - replace with your actual domain
    baseUrl = 'https://supportbots.dev';
  }
  
  // Supabase configuration
  var SUPABASE_URL = 'https://jsyqavxvspkqitrwbeay.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzeXFhdnh2c3BrcWl0cndiZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjY2NjgsImV4cCI6MjA3MzYwMjY2OH0.JVFxiqvteDQToL3nrhCeKbJC8lm6LivGcVurXkT8AeQ';
  
  // Fetch chatbot data to determine type
  fetch(SUPABASE_URL + '/rest/v1/chatbots?id=eq.' + chatbotId + '&select=id,name,chatbot_type,widget_config', {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    }
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    if (!data || data.length === 0) {
      console.error('SupportBots: Chatbot not found');
      return;
    }
    
    var chatbotData = data[0];
    var chatbotType = chatbotData.chatbot_type || 'standard';
    
    console.log('SupportBots: Loading ' + chatbotType + ' widget for chatbot ' + chatbotId);
    
    // Create widget container
    var widgetContainer = document.createElement('div');
    widgetContainer.id = 'supportbots-widget-' + chatbotId;
    widgetContainer.style.cssText = 'position: fixed; z-index: 2147483647; pointer-events: none;';
    
    // Determine widget URL based on type
    var widgetUrl;
    if (chatbotType === 'video_bot') {
      widgetUrl = baseUrl + '/widget?id=' + encodeURIComponent(chatbotId) + '&type=video';
    } else if (chatbotType === 'avatar_bot') {
      widgetUrl = baseUrl + '/widget?id=' + encodeURIComponent(chatbotId) + '&type=avatar';
    } else {
      widgetUrl = baseUrl + '/widget?id=' + encodeURIComponent(chatbotId);
    }
    
    // Create iframe for the widget
    var iframe = document.createElement('iframe');
    iframe.src = widgetUrl;
    iframe.style.cssText = [
      'width: 100vw',
      'height: 100vh', 
      'border: none',
      'background: transparent',
      'pointer-events: auto',
      'position: absolute',
      'top: 0',
      'left: 0'
    ].join('; ');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('title', 'SupportBots Chat Widget');
    
    // Add iframe to container
    widgetContainer.appendChild(iframe);
    
    // Add container to page
    document.body.appendChild(widgetContainer);
  
    // Handle iframe communication (optional)
    window.addEventListener('message', function(event) {
      // Verify origin for security
      if (event.origin !== baseUrl) return;
      
      var data = event.data;
      
      if (data.type === 'SUPPORTBOTS_RESIZE') {
        // Handle widget resize if needed
        console.log('SupportBots: Widget resize requested', data);
      } else if (data.type === 'SUPPORTBOTS_CLOSE') {
        // Handle widget close
        if (widgetContainer && widgetContainer.parentNode) {
          widgetContainer.parentNode.removeChild(widgetContainer);
        }
      }
    });
    
    // Expose API methods
    window.SupportBots.api = {
      show: function() {
        if (widgetContainer) {
          widgetContainer.style.display = 'block';
        }
      },
      hide: function() {
        if (widgetContainer) {
          widgetContainer.style.display = 'none';
        }
      },
      destroy: function() {
        if (widgetContainer && widgetContainer.parentNode) {
          widgetContainer.parentNode.removeChild(widgetContainer);
        }
        delete window.SupportBots;
      }
    };
    
    // CSS injection for better mobile support
    var css = [
      '@media (max-width: 768px) {',
      '  #supportbots-widget-' + chatbotId + ' iframe {',
      '    width: 100vw !important;',
      '    height: 100vh !important;',
      '  }',
      '}',
      '',
      '/* Hide scrollbars on the widget container */',
      '#supportbots-widget-' + chatbotId + ' {',
      '  overflow: hidden;',
      '}',
      '',
      '/* Ensure the widget doesn\'t interfere with page scrolling */',
      '#supportbots-widget-' + chatbotId + ' iframe {',
      '  pointer-events: auto;',
      '}'
    ].join('\n');
    
    var style = document.createElement('style');
    style.type = 'text/css';
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
    document.head.appendChild(style);
    
    console.log('SupportBots: ' + chatbotType + ' widget loaded successfully');
  })
  .catch(function(error) {
    console.error('SupportBots: Error loading chatbot data', error);
  });
})();