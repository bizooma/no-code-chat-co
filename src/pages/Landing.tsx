import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Bot, Zap, Code, Users, ArrowRight, CheckCircle, MessageSquare, Video, Sparkles, PlayCircle, Brain, Gauge } from 'lucide-react';
import heroBackground from '@/assets/hero-background.jpg';
import { FloatingAvatarWidget } from '@/components/avatar/FloatingAvatarWidget';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Floating Avatar Widget */}
      <FloatingAvatarWidget chatbotId="39227a3c-a72f-4580-a9be-a11393cecf58" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">SupportBots.dev</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="py-12 px-4 relative bg-cover bg-center bg-no-repeat min-h-[60vh] flex items-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Build Chatbots
              <span className="text-white"> Without Code</span>
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Create powerful chatbots for your website in minutes. Build traditional text bots, 
              mobile-optimized video flows, or AI-powered avatars. Generate leads, 
              provide support, and engage customers with our visual bot builder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/onboarding">
                <Button size="lg" className="flex items-center space-x-2">
                  <span>Start 5-Min Setup</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/templates">
                <Button variant="secondary" size="lg" className="bg-white/90 text-foreground hover:bg-white">
                  Browse Templates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bot Types Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-foreground mb-4">
              Three Powerful Bot Types, One Platform
            </h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Choose the perfect bot type for your business needs. From simple conversations to AI-powered video avatars.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* ChatFlow */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="h-12 w-12 text-primary" />
                  <span className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
                    TEXT-BASED
                  </span>
                </div>
                <CardTitle className="text-2xl mb-2">ChatFlow</CardTitle>
                <CardDescription className="text-base">
                  Perfect for FAQ, lead capture, and customer support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h4 className="font-semibold text-sm text-foreground mb-3">How It Works:</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Build conversation flows with our drag-and-drop builder. Visitors interact through text messages and button responses. Perfect for automating customer support and qualifying leads.
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-sm text-foreground mb-3">Key Features:</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Quick setup with templates</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Customizable conversation flows</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Lead collection forms</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Multi-channel deployment</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm text-foreground mb-2">Best For:</h4>
                  <p className="text-sm text-muted-foreground">
                    Customer support, Lead generation, Product info
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* VideoFlow */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                  ⚡ NEW
                </span>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Video className="h-12 w-12 text-secondary" />
                  <span className="text-xs font-semibold px-3 py-1 bg-secondary/10 text-secondary rounded-full">
                    INTERACTIVE
                  </span>
                </div>
                <CardTitle className="text-2xl mb-2">VideoFlow</CardTitle>
                <CardDescription className="text-base">
                  Engage visitors with branching video experiences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h4 className="font-semibold text-sm text-foreground mb-3">How It Works:</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create engaging video journeys with portrait videos optimized for mobile. Visitors watch your videos and respond with interactive buttons that overlay during playback. Upload vertical videos (TikTok/Reels style) for maximum engagement.
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-sm text-foreground mb-3">Key Features:</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Visual flow builder</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Conditional video paths</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Interactive decision points</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Advanced analytics & heatmaps</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm text-foreground mb-2">Best For:</h4>
                  <p className="text-sm text-muted-foreground">
                    Product demos, Training, Interactive tours
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AvatarFlow */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Sparkles className="h-12 w-12 text-primary" />
                  <span className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
                    AI AVATAR
                  </span>
                </div>
                <CardTitle className="text-2xl mb-2">AvatarFlow</CardTitle>
                <CardDescription className="text-base">
                  Realistic AI avatars powered by HeyGen/D-ID
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h4 className="font-semibold text-sm text-foreground mb-3">How It Works:</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    An AI-powered digital human that speaks to visitors in real-time. Uses GPT for natural language understanding and D-ID/HeyGen for realistic avatar animation. Visitors talk or type, the avatar responds with voice and video.
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-sm text-foreground mb-3">Key Features:</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Natural conversations with AI</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Lifelike video avatars</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Knowledge base integration</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Real-time responses</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm text-foreground mb-2">Best For:</h4>
                  <p className="text-sm text-muted-foreground">
                    Sales pitches, Consultations, Virtual assistants
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <div className="bg-card rounded-lg p-8 mt-12 border">
            <h4 className="text-2xl font-bold text-center mb-8">Quick Comparison</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold">ChatFlow</th>
                    <th className="text-center py-3 px-4 font-semibold">VideoFlow</th>
                    <th className="text-center py-3 px-4 font-semibold">AvatarFlow</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-3 px-4">Setup Time</td>
                    <td className="text-center py-3 px-4">5 mins</td>
                    <td className="text-center py-3 px-4">15 mins</td>
                    <td className="text-center py-3 px-4">10 mins</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Content Type</td>
                    <td className="text-center py-3 px-4">Text</td>
                    <td className="text-center py-3 px-4">Portrait Videos (Mobile-First)</td>
                    <td className="text-center py-3 px-4">AI-Generated Video</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Video Format</td>
                    <td className="text-center py-3 px-4">N/A</td>
                    <td className="text-center py-3 px-4">9:16 Portrait</td>
                    <td className="text-center py-3 px-4">N/A</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Interaction Style</td>
                    <td className="text-center py-3 px-4">Button Clicks</td>
                    <td className="text-center py-3 px-4">Overlay Buttons During Video</td>
                    <td className="text-center py-3 px-4">Natural Language</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Mobile Optimized</td>
                    <td className="text-center py-3 px-4">Yes</td>
                    <td className="text-center py-3 px-4">Excellent</td>
                    <td className="text-center py-3 px-4">Yes</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Best Engagement</td>
                    <td className="text-center py-3 px-4">Good</td>
                    <td className="text-center py-3 px-4">Excellent</td>
                    <td className="text-center py-3 px-4">Outstanding</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Pricing</td>
                    <td className="text-center py-3 px-4 font-semibold text-primary">Included</td>
                    <td className="text-center py-3 px-4 font-semibold text-primary">Pro+</td>
                    <td className="text-center py-3 px-4 font-semibold text-primary">Enterprise</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-foreground mb-6">
                Perfect for Small Businesses
              </h3>
              <p className="text-muted-foreground mb-6">
                Our platform is designed specifically for entrepreneurs and small business 
                owners who want to improve their customer engagement without the complexity 
                of traditional chatbot solutions.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-foreground">24/7 customer support automation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-foreground">Lead qualification and collection</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-foreground">Easy website integration</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-foreground">Real-time analytics and insights</span>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-8">
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-medium text-foreground">SupportBot</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-primary/10 rounded-lg p-3">
                    <p className="text-sm text-foreground">
                      👋 Hi! I'm here to help. What can I assist you with today?
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Product Info</Button>
                    <Button variant="outline" size="sm">Pricing</Button>
                    <Button variant="outline" size="sm">Contact</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your business. All plans include ChatFlow bots. Upgrade for advanced features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {/* Starter Plan */}
            <Card className="relative hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription>Perfect for small businesses getting started</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$19</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="bg-primary/5 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">ChatFlow</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Text-based conversational bots</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Up to 5 chatbots</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">2,500 conversations/month</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Visual flow builder</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Lead capture & forms</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Basic analytics</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Email support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Template library</span>
                  </div>
                </div>
                <Link to="/auth">
                  <Button className="w-full" variant="outline">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-2 border-primary shadow-lg hover:shadow-2xl transition-shadow">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-6 py-1.5 rounded-full text-sm font-bold shadow-lg">
                  MOST POPULAR
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <CardDescription>For growing businesses with video needs</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 space-y-2">
                  <div className="bg-primary/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">ChatFlow</span>
                    </div>
                  </div>
                  <div className="bg-secondary/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="h-5 w-5 text-secondary" />
                      <span className="font-semibold text-sm">VideoFlow</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Interactive video flows</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">Everything in Starter, plus:</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Up to 15 chatbots</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">10,000 conversations/month</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Video upload & hosting</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Video analytics & heatmaps</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">A/B testing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Priority support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Custom branding</span>
                  </div>
                </div>
                <Link to="/auth">
                  <Button className="w-full" size="lg">
                    Start Pro Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>Complete solution with AI avatars</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$149</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 space-y-2">
                  <div className="bg-primary/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">ChatFlow</span>
                    </div>
                  </div>
                  <div className="bg-secondary/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="h-5 w-5 text-secondary" />
                      <span className="font-semibold text-sm">VideoFlow</span>
                    </div>
                  </div>
                  <div className="bg-primary/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">AvatarFlow</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Lifelike AI video avatars</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">Everything in Pro, plus:</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Unlimited chatbots</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">50,000 conversations/month</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">AI avatar creation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Custom knowledge base</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">White-label solution</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">24/7 dedicated support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">API access & webhooks</span>
                  </div>
                </div>
                <Link to="/auth">
                  <Button className="w-full" variant="outline">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Feature Availability Table */}
          <div className="max-w-6xl mx-auto bg-card rounded-xl p-8 shadow-lg border">
            <h4 className="text-2xl font-bold text-center mb-8">Bot Type Availability</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="font-semibold text-left">Bot Type</div>
              <div className="font-semibold">Starter</div>
              <div className="font-semibold">Professional</div>
              <div className="font-semibold">Enterprise</div>
              
              <div className="text-left flex items-center gap-2 pt-4 border-t">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span>ChatFlow</span>
              </div>
              <div className="pt-4 border-t">
                <CheckCircle className="h-6 w-6 text-primary mx-auto" />
              </div>
              <div className="pt-4 border-t">
                <CheckCircle className="h-6 w-6 text-primary mx-auto" />
              </div>
              <div className="pt-4 border-t">
                <CheckCircle className="h-6 w-6 text-primary mx-auto" />
              </div>
              
              <div className="text-left flex items-center gap-2 pt-4">
                <Video className="h-5 w-5 text-secondary" />
                <span>VideoFlow</span>
              </div>
              <div className="pt-4">
                <span className="text-muted-foreground">—</span>
              </div>
              <div className="pt-4">
                <CheckCircle className="h-6 w-6 text-primary mx-auto" />
              </div>
              <div className="pt-4">
                <CheckCircle className="h-6 w-6 text-primary mx-auto" />
              </div>
              
              <div className="text-left flex items-center gap-2 pt-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>AvatarFlow</span>
              </div>
              <div className="pt-4">
                <span className="text-muted-foreground">—</span>
              </div>
              <div className="pt-4">
                <span className="text-muted-foreground">—</span>
              </div>
              <div className="pt-4">
                <CheckCircle className="h-6 w-6 text-primary mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Got questions? We have answers. Learn more about our chatbot platform.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-card rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  What is a website support chatbot and how does it work?
                </AccordionTrigger>
                <AccordionContent>
                  A website support chatbot is a digital assistant that answers customer questions 24/7. It works by either following pre-set conversation flows or using AI to provide instant, natural responses. Our chatbot platform lets you add it to your site in minutes with a simple embed code.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-card rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Can I build a custom chatbot for my business without coding?
                </AccordionTrigger>
                <AccordionContent>
                  Yes. Our chatbot builder is 100% no-code. You can use drag-and-drop flows, upload FAQs, or train the bot with AI. In just a few clicks, your chatbot is live on your website.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-card rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  How do chatbots capture leads from website visitors?
                </AccordionTrigger>
                <AccordionContent>
                  Our chatbot collects visitor details like name, email, and phone directly inside the chat. Leads are saved in your dashboard, exported to CSV, or synced automatically to your CRM.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-card rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Does your chatbot integrate with popular tools like Google Sheets, HubSpot, or Slack?
                </AccordionTrigger>
                <AccordionContent>
                  Yes. You can connect your chatbot to Google Sheets, HubSpot, Slack, Mailchimp, or any app through Zapier and Make. This way, new leads and chat data flow directly into your existing systems.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-card rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Can a human agent take over the conversation from the chatbot?
                </AccordionTrigger>
                <AccordionContent>
                  Absolutely. Our platform offers live chat takeover. If the bot can't answer, a human can jump into the conversation in real time from the dashboard or mobile app.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-card rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  What industries can benefit from using a chatbot on their website?
                </AccordionTrigger>
                <AccordionContent>
                  Any industry that serves customers online can use a chatbot. Common examples include law firms, real estate, e-commerce stores, nonprofits, SaaS companies, restaurants, and healthcare clinics.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="bg-card rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Is your chatbot white-label so I can use it for my agency clients?
                </AccordionTrigger>
                <AccordionContent>
                  Yes. With agency mode, you can rebrand the chatbot with your client's logo and colors. You can even give clients their own login and custom dashboard under your brand.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="bg-card rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  How fast can I set up a chatbot on my website?
                </AccordionTrigger>
                <AccordionContent>
                  Most users set up their first chatbot in under 5 minutes. Simply sign up, customize your chatbot, and paste a one-line code into your website. No coding or developers required.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="bg-card rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Does your chatbot support multiple languages?
                </AccordionTrigger>
                <AccordionContent>
                  Yes. Our chatbot can automatically detect and respond in multiple languages, making it ideal for businesses with international customers.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="bg-card rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  What makes your chatbot platform different from other chatbot software?
                </AccordionTrigger>
                <AccordionContent>
                  Unlike other chatbot tools, our platform offers unlimited conversations, pre-built industry templates, live chat takeover, AI + rule-based options, and full white-label agency features — all without expensive monthly fees.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Build Your First Chatbot?
          </h3>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using SupportBots.dev to improve 
            their customer engagement and generate more leads.
          </p>
          <Link to="/auth">
            <Button variant="secondary" size="lg" className="flex items-center space-x-2 mx-auto">
              <span>Start Building Now</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        {/* Google Map */}
        <div className="w-full mb-8">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3443.794538479383!2d-81.6591862!3d30.3283615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88e5b7ba8c79c7b7%3A0x29d0d337ce7701c4!2sBizooma%20Digital%20Marketing%20Agency!5e0!3m2!1sen!2sus!4v1758842732390!5m2!1sen!2sus"
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
        </div>
        
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Bot className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">SupportBots.dev</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Support Bots.dev, A{" "}
            <a 
              href="https://bizooma.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Bizooma, LLC
            </a>{" "}
            Company | All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;