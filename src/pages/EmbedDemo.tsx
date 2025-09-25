import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';

const EmbedDemo = () => {
  const [searchParams] = useSearchParams();
  const chatbotId = searchParams.get('id');

  if (!chatbotId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Missing Chatbot ID</CardTitle>
            <CardDescription>
              Please provide a valid chatbot ID in the URL parameters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/chatbots">
              <Button>Back to Chatbots</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const embedCode = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget.js';
    script.setAttribute('data-chatbot-id', '${chatbotId}');
    document.head.appendChild(script);
  })();
</script>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Widget Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                See your chatbot in action on a real website
              </p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              Chatbot ID: {chatbotId}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Demo Website */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Live Demo Website
                    </CardTitle>
                    <CardDescription>
                      This simulates how your chatbot will appear on a customer's website
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Smartphone className="h-3 w-3 mr-1" />
                      Mobile Friendly
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Simulated Website */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 min-h-[500px] relative">
                  {/* Fake Website Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-500 rounded"></div>
                      <h2 className="text-xl font-semibold">Demo Company</h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm">
                      <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Home</a>
                      <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">About</a>
                      <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Services</a>
                      <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Contact</a>
                    </nav>
                  </div>

                  {/* Fake Website Content */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-3">Welcome to Our Website</h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        This is a demonstration of how your chatbot will appear on any website. 
                        The chat widget will float in the corner and allow visitors to interact 
                        with your bot seamlessly.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Our Services</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          We provide excellent customer service and support for all our clients.
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Contact Information</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Reach out to us anytime through our chatbot or traditional contact methods.
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                        💬 Try the Chatbot!
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-200">
                        Click the chat bubble in the bottom corner to start a conversation with your bot.
                        This is exactly how it will work for your website visitors.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instructions & Code */}
          <div className="space-y-6">
            {/* Embed Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Embed Code
                </CardTitle>
                <CardDescription>
                  Copy this code to your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                  <pre>{embedCode}</pre>
                </div>
                <Button onClick={copyEmbedCode} className="w-full">
                  Copy Code
                </Button>
              </CardContent>
            </Card>

            {/* Installation Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Installation Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Copy the embed code</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Use the copy button above to copy the code snippet
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Paste before &lt;/body&gt;</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Add the code just before the closing body tag
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Activate your bot</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Make sure your bot status is "Active" in the dashboard
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device Compatibility */}
            <Card>
              <CardHeader>
                <CardTitle>Device Compatibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Desktop & Laptop</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tablet className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Tablet</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Mobile Phone</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Back to Editor */}
            <Link to={`/chatbots/${chatbotId}/editor`}>
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Back to Editor
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Load the actual widget for demo */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var script = document.createElement('script');
              script.src = '${window.location.origin}/widget.js';
              script.setAttribute('data-chatbot-id', '${chatbotId}');
              document.head.appendChild(script);
            })();
          `
        }}
      />
    </div>
  );
};

export default EmbedDemo;