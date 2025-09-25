-- Insert sample chatbot templates
INSERT INTO public.chatbot_templates (name, category, description, template_config) VALUES
('Customer Support Bot', 'support', 'A general customer support chatbot template with common FAQ flows', '{
  "welcome_message": "Hi! I''m here to help with any questions you have. How can I assist you today?",
  "messages": [
    {
      "key": "start",
      "text": "What can I help you with today?",
      "type": "button",
      "buttons": [
        {"text": "Product Information", "next_key": "product_info"},
        {"text": "Technical Support", "next_key": "tech_support"},
        {"text": "Billing Questions", "next_key": "billing"},
        {"text": "Speak to Human", "next_key": "human_handoff"}
      ]
    },
    {
      "key": "product_info",
      "text": "I''d be happy to help with product information. What specific product are you interested in?",
      "type": "form",
      "collect_lead": true,
      "lead_fields": ["name", "email"]
    },
    {
      "key": "tech_support", 
      "text": "I can help with technical issues. Please describe the problem you''re experiencing.",
      "type": "text"
    },
    {
      "key": "billing",
      "text": "For billing questions, I can connect you with our billing team. Please provide your account information.",
      "type": "form",
      "collect_lead": true,
      "lead_fields": ["name", "email", "phone"]
    }
  ]
}'),

('Lead Generation Bot', 'sales', 'Designed to capture leads and qualify potential customers', '{
  "welcome_message": "Welcome! I''d love to learn more about your needs and see how we can help.",
  "messages": [
    {
      "key": "start",
      "text": "What brings you to our website today?",
      "type": "button",
      "buttons": [
        {"text": "Looking for a solution", "next_key": "solution_inquiry"},
        {"text": "Getting a quote", "next_key": "quote_request"},
        {"text": "General information", "next_key": "general_info"}
      ]
    },
    {
      "key": "solution_inquiry",
      "text": "Great! I''d love to understand your needs better. Could you share some details?",
      "type": "form",
      "collect_lead": true,
      "lead_fields": ["name", "email", "company"]
    },
    {
      "key": "quote_request",
      "text": "I''ll help you get a personalized quote. Please provide some information about your requirements.",
      "type": "form", 
      "collect_lead": true,
      "lead_fields": ["name", "email", "company", "phone"]
    }
  ]
}'),

('Restaurant Bot', 'restaurant', 'Perfect for restaurants - handle reservations, menu questions, and orders', '{
  "welcome_message": "Welcome to our restaurant! How can I help you today?",
  "messages": [
    {
      "key": "start",
      "text": "What would you like to know about?",
      "type": "button",
      "buttons": [
        {"text": "Make a Reservation", "next_key": "reservation"},
        {"text": "View Menu", "next_key": "menu"},
        {"text": "Hours & Location", "next_key": "info"},
        {"text": "Special Events", "next_key": "events"}
      ]
    },
    {
      "key": "reservation",
      "text": "I''d be happy to help with your reservation. Please provide the following details:",
      "type": "form",
      "collect_lead": true,
      "lead_fields": ["name", "email", "phone"]
    },
    {
      "key": "menu",
      "text": "You can view our full menu at [website.com/menu]. Would you like me to help with anything specific?",
      "type": "text"
    }
  ]
}'),

('E-commerce Bot', 'ecommerce', 'Help customers with product questions, orders, and support', '{
  "welcome_message": "Welcome to our store! I''m here to help you find what you''re looking for.",
  "messages": [
    {
      "key": "start", 
      "text": "How can I assist you today?",
      "type": "button",
      "buttons": [
        {"text": "Find Products", "next_key": "product_search"},
        {"text": "Track Order", "next_key": "order_tracking"},
        {"text": "Return/Exchange", "next_key": "returns"},
        {"text": "Customer Support", "next_key": "support"}
      ]
    },
    {
      "key": "product_search",
      "text": "What type of product are you looking for? I can help you find the perfect item!",
      "type": "text"
    },
    {
      "key": "order_tracking",
      "text": "I can help you track your order. Please provide your order number and email address.",
      "type": "form",
      "collect_lead": true,
      "lead_fields": ["email"]
    }
  ]
}'),

('Real Estate Bot', 'realestate', 'Help potential buyers and sellers with property inquiries', '{
  "welcome_message": "Hello! I''m here to help with all your real estate needs. What can I assist you with?",
  "messages": [
    {
      "key": "start",
      "text": "Are you looking to buy or sell a property?",
      "type": "button", 
      "buttons": [
        {"text": "Buy a Property", "next_key": "buying"},
        {"text": "Sell a Property", "next_key": "selling"},
        {"text": "Market Information", "next_key": "market_info"},
        {"text": "Schedule Viewing", "next_key": "viewing"}
      ]
    },
    {
      "key": "buying",
      "text": "Excellent! I''d love to help you find your dream home. Let me gather some information about your preferences.",
      "type": "form",
      "collect_lead": true,
      "lead_fields": ["name", "email", "phone"]
    },
    {
      "key": "selling",
      "text": "Great! I can help you get the best value for your property. Please share some details about your property.",
      "type": "form",
      "collect_lead": true,
      "lead_fields": ["name", "email", "phone"]
    }
  ]
}'),

('SaaS Demo Bot', 'saas', 'Perfect for SaaS companies to generate trial signups and demos', '{
  "welcome_message": "Hi there! Interested in seeing how our platform can help your business?",
  "messages": [
    {
      "key": "start",
      "text": "What would you like to do?",
      "type": "button",
      "buttons": [
        {"text": "Start Free Trial", "next_key": "trial"},
        {"text": "Book a Demo", "next_key": "demo"},
        {"text": "Pricing Information", "next_key": "pricing"},
        {"text": "Contact Sales", "next_key": "sales"}
      ]
    },
    {
      "key": "trial",
      "text": "Awesome! Let''s get you set up with a free trial. I just need a few details:",
      "type": "form",
      "collect_lead": true,
      "lead_fields": ["name", "email", "company"]
    },
    {
      "key": "demo",
      "text": "Perfect! I''ll connect you with our team for a personalized demo. Please provide your information:",
      "type": "form",
      "collect_lead": true,
      "lead_fields": ["name", "email", "company", "phone"]
    }
  ]
}')