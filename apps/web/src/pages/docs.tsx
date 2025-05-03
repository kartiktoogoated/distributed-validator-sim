import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Code, Terminal, Server, Globe, Zap } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const DocsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    {
      title: 'Getting Started',
      icon: Book,
      items: [
        { title: 'Introduction', href: '#introduction' },
        { title: 'Quick Start Guide', href: '#quick-start' },
        { title: 'Installation', href: '#installation' },
        { title: 'Basic Concepts', href: '#concepts' },
      ]
    },
    {
      title: 'Validator Guide',
      icon: Server,
      items: [
        { title: 'Setting Up a Node', href: '#node-setup' },
        { title: 'Configuration', href: '#configuration' },
        { title: 'Running a Validator', href: '#running' },
        { title: 'Maintenance', href: '#maintenance' },
      ]
    },
    {
      title: 'Website Monitoring',
      icon: Globe,
      items: [
        { title: 'Adding Websites', href: '#add-website' },
        { title: 'Monitoring Options', href: '#options' },
        { title: 'Alerts & Notifications', href: '#alerts' },
        { title: 'Reports', href: '#reports' },
      ]
    },
    {
      title: 'API Reference',
      icon: Code,
      items: [
        { title: 'Authentication', href: '#auth' },
        { title: 'Endpoints', href: '#endpoints' },
        { title: 'Rate Limits', href: '#rate-limits' },
        { title: 'Examples', href: '#examples' },
      ]
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-8">
              <div className="mb-6">
                <Input
                  type="search"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="space-y-6">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <div key={section.title}>
                        <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
                          <Icon className="h-4 w-4" />
                          {section.title}
                        </h3>
                        <ul className="space-y-1">
                          {section.items.map((item) => (
                            <li key={item.title}>
                              <a
                                href={item.href}
                                className="block text-sm text-muted-foreground hover:text-foreground py-1"
                              >
                                {item.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="prose dark:prose-invert max-w-none">
              <h1>Documentation</h1>
              <p className="lead">
                Welcome to the DePin documentation. Here you'll find everything you need to know about running a validator node or monitoring your websites.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose mb-12">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="h-5 w-5" />
                      Quick Start
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Get up and running with DePin in minutes
                    </p>
                    <Button variant="outline" className="w-full">View Guide</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      API Reference
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Comprehensive API documentation
                    </p>
                    <Button variant="outline" className="w-full">View API Docs</Button>
                  </CardContent>
                </Card>
              </div>

              <h2 id="introduction">Introduction</h2>
              <p>
                DePin is a decentralized website monitoring platform that leverages a network of validator nodes to provide reliable and transparent uptime monitoring.
              </p>

              <h3>Key Features</h3>
              <ul>
                <li>Decentralized monitoring through validator nodes</li>
                <li>Consensus-based reporting</li>
                <li>Real-time alerts and notifications</li>
                <li>Comprehensive API access</li>
                <li>Detailed analytics and reporting</li>
              </ul>

              <h2 id="quick-start">Quick Start Guide</h2>
              <p>
                Follow these steps to get started with DePin:
              </p>

              <ol>
                <li>
                  <strong>Create an Account</strong>
                  <p>Sign up for a DePin account using our simple registration process.</p>
                </li>
                <li>
                  <strong>Choose Your Role</strong>
                  <p>Decide whether you want to run a validator node or monitor websites.</p>
                </li>
                <li>
                  <strong>Configuration</strong>
                  <p>Set up your validator node or add websites to monitor.</p>
                </li>
                <li>
                  <strong>Start Monitoring</strong>
                  <p>Begin receiving real-time updates and alerts.</p>
                </li>
              </ol>

              {/* Add more documentation sections as needed */}
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DocsPage;