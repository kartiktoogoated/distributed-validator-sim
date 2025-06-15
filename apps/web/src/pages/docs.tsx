import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Code, Server, Globe, Shield, Zap } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const DocsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('');

  // Handle smooth scrolling to sections
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // Adjust based on your header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      const scrollPosition = window.scrollY + 100; // Offset for header

      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection(sectionId || '');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    {
      title: 'Getting Started',
      icon: Book,
      items: [
        { title: 'Introduction', href: '#introduction' },
        { title: 'Quick Start Guide', href: '#quick-start' },
        { title: 'Installation', href: '#installation' },
        { title: 'Basic Concepts', href: '#concepts' },
        { title: 'Architecture Overview', href: '#architecture' },
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
        { title: 'Performance Tuning', href: '#performance' },
        { title: 'Troubleshooting', href: '#troubleshooting' },
      ]
    },
    {
      title: 'Website Monitoring',
      icon: Globe,
      items: [
        { title: 'Adding Websites', href: '#add-website' },
        { title: 'Monitoring Options', href: '#options' },
        { title: 'Alerts & Notifications', href: '#alerts' },
        { title: 'Reports & Analytics', href: '#reports' },
        { title: 'Custom Checks', href: '#custom-checks' },
        { title: 'Status Pages', href: '#status-pages' },
      ]
    },
    {
      title: 'Security & Compliance',
      icon: Shield,
      items: [
        { title: 'Authentication', href: '#auth' },
        { title: 'Authorization', href: '#authorization' },
        { title: 'Data Protection', href: '#data-protection' },
        { title: 'Compliance', href: '#compliance' },
        { title: 'Best Practices', href: '#security-best-practices' },
      ]
    },
    {
      title: 'API Reference',
      icon: Code,
      items: [
        { title: 'Authentication', href: '#api-auth' },
        { title: 'Endpoints', href: '#endpoints' },
        { title: 'Rate Limits', href: '#rate-limits' },
        { title: 'WebSocket API', href: '#websocket' },
        { title: 'SDK Examples', href: '#sdk-examples' },
        { title: 'Error Handling', href: '#error-handling' },
      ]
    },
    {
      title: 'Advanced Topics',
      icon: Zap,
      items: [
        { title: 'Scaling & Deployment', href: '#scaling' },
        { title: 'High Availability', href: '#high-availability' },
        { title: 'Performance Optimization', href: '#optimization' },
        { title: 'Custom Integrations', href: '#integrations' },
        { title: 'Contributing', href: '#contributing' },
      ]
    },
  ];

  // Helper to get icon for section
  const getSectionIcon = (Icon: React.ElementType) => (
    <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-primary mr-2">
      <Icon className="h-4 w-4" />
    </span>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 w-full flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 bg-muted/40 border-r border-muted/30 py-10 px-6 lg:px-8 flex-shrink-0">
          <div className="sticky top-8">
            <div className="mb-8">
              <Input
                type="search"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-muted bg-muted/50 focus:ring-2 focus:ring-primary"
              />
            </div>
            <ScrollArea className="h-[calc(100vh-12rem)] pr-2">
              <div className="space-y-10">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.title}>
                      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        {getSectionIcon(Icon)}
                        {section.title}
                      </h3>
                      <ul className="space-y-1">
                        {section.items.map((item) => {
                          const sectionId = item.href.replace('#', '');
                          const isActive = activeSection === sectionId;
                          return (
                            <li key={item.title}>
                              <button
                                onClick={() => scrollToSection(sectionId)}
                                className={`w-full text-left block text-[15px] rounded px-2 py-1 transition-colors hover:bg-primary/10 hover:text-primary font-medium ${
                                  isActive 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'text-foreground/90'
                                }`}
                              >
                                {item.title}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 bg-background px-4 py-12 md:px-12">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Getting Started */}
            <section id="introduction" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Introduction</h2>
              <p className="mb-4 text-base text-foreground/90">Welcome to DeepFry! This platform provides distributed, consensus-based website monitoring and analytics. Validators from around the world check your sites, reach consensus, and deliver real-time, reliable status and performance data.</p>
            </section>
            <section id="quick-start" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Quick Start Guide</h2>
              <ol className="list-decimal pl-6 space-y-2 mb-2 text-foreground/90">
                <li>Sign up for a DeepFry account and verify your email.</li>
                <li>Add your website(s) to start monitoring.</li>
                <li>Optionally, set up your own validator node to contribute and earn rewards.</li>
                <li>View live status, analytics, and receive alerts.</li>
              </ol>
            </section>
            <section id="installation" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Installation</h2>
              <p className="mb-2 text-foreground/90">To run a validator node locally:</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`git clone https://github.com/your-org/deepfry.git
cd deepfry
npm install
cd apps/server
npm install`}</code></pre>
              <p className="text-foreground/80">Set up your <span className="font-mono">.env</span> file with the required environment variables (see Configuration).</p>
            </section>
            <section id="concepts" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Basic Concepts</h2>
              <ul className="mb-2 text-foreground/90">
                <li><b>Validator:</b> A node that checks website status from its region.</li>
                <li><b>Consensus:</b> Weighted voting among validators for accurate results.</li>
                <li><b>Reputation:</b> Validators earn weight based on accuracy and uptime.</li>
                <li><b>Real-time:</b> Status and alerts are pushed instantly via WebSocket.</li>
              </ul>
            </section>
            <section id="architecture" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Architecture Overview</h2>
              <p className="mb-4 text-base text-foreground/90">DeepFry uses a microservice architecture with Kafka, PostgreSQL, Redis, and a network of validators. The aggregator service coordinates consensus and broadcasts results to clients via WebSocket.</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`graph TD
  Client["Client Dashboard"]
  API["REST API / WebSocket"]
  Aggregator["Aggregator Service (Consensus)"]
  Validator1["Validator Node 1"]
  Validator2["Validator Node 2"]
  Kafka["Kafka (Message Bus)"]
  DB["Database"]
  Alerts["Alert Service"]
  Cache["Redis Cache"]
  Metrics["Prometheus Metrics"]

  Client -- HTTP/WebSocket --> API
  API -- gRPC/HTTP --> Aggregator
  Aggregator -- Kafka --> Validator1
  Aggregator -- Kafka --> Validator2
  Validator1 -- Kafka --> Aggregator
  Validator2 -- Kafka --> Aggregator
  Aggregator -- DB --> DB
  Aggregator -- Cache --> Cache
  Aggregator -- WebSocket --> Client
  Aggregator -- Alerts --> Alerts
  Aggregator -- Metrics --> Metrics
`}</code></pre>
            </section>

            {/* Validator Guide */}
            <section id="node-setup" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Setting Up a Node</h2>
              <ol className="list-decimal pl-6 space-y-2 mb-2 text-foreground/90">
                <li>Clone the repo and install dependencies (see Installation).</li>
                <li>Set your <span className="font-mono">VALIDATOR_ID</span> and <span className="font-mono">PEERS</span> in <span className="font-mono">.env</span>.</li>
                <li>Run database migrations: <span className="font-mono">npx prisma migrate dev</span></li>
                <li>Start your node: <span className="font-mono">npm run dev</span></li>
              </ol>
            </section>
            <section id="configuration" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Configuration</h2>
              <ul className="mb-2 text-foreground/90">
                <li><b>VALIDATOR_ID</b>: Unique number for your node</li>
                <li><b>PEERS</b>: Comma-separated list of peer node addresses</li>
                <li><b>DATABASE_URL</b>: PostgreSQL connection string</li>
                <li><b>REDIS_URL</b>: Redis connection string</li>
                <li><b>KAFKA_BOOTSTRAP_SERVERS</b>: Kafka broker addresses</li>
                <li><b>JWT_SECRET</b>: Secret for authentication tokens</li>
              </ul>
            </section>
            <section id="running" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Running a Validator</h2>
              <p className="mb-2 text-foreground/90">Start your node in development or production mode:</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`# Development
npm run dev

# Production
npm run build
npm start`}</code></pre>
              <p className="text-foreground/80">Monitor logs and check your node's health in the dashboard.</p>
            </section>
            <section id="maintenance" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Maintenance</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Keep dependencies up to date</li>
                <li>Monitor validator weight and accuracy</li>
                <li>Backup your database regularly</li>
                <li>Check logs for errors or warnings</li>
              </ul>
            </section>
            <section id="performance" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Performance Tuning</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Optimize system resources (CPU, RAM, network)</li>
                <li>Use SSD storage for database</li>
                <li>Monitor latency and adjust check intervals</li>
                <li>Review logs for slow queries or bottlenecks</li>
              </ul>
            </section>
            <section id="troubleshooting" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Troubleshooting</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Check logs for errors</li>
                <li>Ensure all environment variables are set</li>
                <li>Verify network connectivity between nodes</li>
                <li>Restart services if stuck</li>
              </ul>
            </section>

            {/* Website Monitoring */}
            <section id="add-website" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Adding Websites</h2>
              <p className="mb-2 text-foreground/90">Add a website from the dashboard or via API:</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`POST /api/websites
{
  "url": "https://yourwebsite.com",
  "description": "My main site"
}`}</code></pre>
            </section>
            <section id="options" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Monitoring Options</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Set custom check intervals</li>
                <li>Pause/resume monitoring</li>
                <li>View uptime, latency, and region-specific results</li>
              </ul>
            </section>
            <section id="alerts" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Alerts & Notifications</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Get instant alerts for downtime or slow response</li>
                <li>Receive notifications via email or dashboard</li>
                <li>Configure alert thresholds per website</li>
              </ul>
            </section>
            <section id="reports" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Reports & Analytics</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Download uptime and latency reports</li>
                <li>View historical trends and analytics</li>
                <li>Export data as CSV or JSON</li>
              </ul>
            </section>
            <section id="custom-checks" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Custom Checks</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Define custom HTTP checks (status code, response body, headers)</li>
                <li>Set up keyword or regex matching</li>
                <li>Monitor APIs, not just websites</li>
              </ul>
            </section>
            <section id="status-pages" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Status Pages</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Public or private status pages for your monitored sites</li>
                <li>Custom branding and domain support</li>
                <li>Embed status widgets on your website</li>
              </ul>
            </section>

            {/* Security & Compliance */}
            <section id="auth" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Authentication</h2>
              <p className="mb-2 text-foreground/90">All API endpoints require a JWT token in the <span className="font-mono">Authorization</span> header after login.</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`Authorization: Bearer <your-token>`}</code></pre>
            </section>
            <section id="authorization" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Authorization</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Role-based access control (RBAC) for users and teams</li>
                <li>Granular permissions for API keys</li>
                <li>Audit logs for sensitive actions</li>
              </ul>
            </section>
            <section id="data-protection" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Data Protection</h2>
              <ul className="mb-2 text-foreground/90">
                <li>All data encrypted at rest and in transit</li>
                <li>Regular backups and disaster recovery</li>
                <li>Data retention policies for logs and analytics</li>
              </ul>
            </section>
            <section id="compliance" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Compliance</h2>
              <ul className="mb-2 text-foreground/90">
                <li>GDPR, SOC 2, and ISO 27001 compliance</li>
                <li>Data processing agreements available</li>
                <li>Regular security audits and penetration testing</li>
              </ul>
            </section>
            <section id="security-best-practices" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Best Practices</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Use strong, unique passwords and enable 2FA</li>
                <li>Rotate API keys regularly</li>
                <li>Review access logs and permissions periodically</li>
              </ul>
            </section>

            {/* API Reference */}
            <section id="api-auth" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">API Authentication</h2>
              <p className="mb-2 text-foreground/90">All API endpoints require a JWT token in the <span className="font-mono">Authorization</span> header after login.</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`Authorization: Bearer <your-token>`}</code></pre>
            </section>
            <section id="endpoints" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Endpoints</h2>
              <ul className="mb-2 text-foreground/90">
                <li><b>POST /api/login</b> — Authenticate and receive a JWT token.</li>
                <li><b>GET /api/websites</b> — List all monitored websites.</li>
                <li><b>POST /api/websites</b> — Add a new website to monitor.</li>
                <li><b>GET /api/websites/:id/history</b> — Get uptime and latency logs for a website.</li>
                <li><b>GET /api/consensus</b> — Get latest consensus results for all sites.</li>
                <li><b>POST /api/simulate/gossip</b> — Submit a validator vote (internal).</li>
                <li><b>GET /api/logs</b> — Get recent validator logs.</li>
              </ul>
            </section>
            <section id="rate-limits" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Rate Limits</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Standard: 60 requests/minute per user</li>
                <li>Contact support for higher limits or bulk access</li>
              </ul>
            </section>
            <section id="websocket" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">WebSocket API</h2>
              <p className="mb-2 text-foreground/90">Subscribe to live consensus updates:</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`wss://deepfry.tech/api/ws`}</code></pre>
              <p className="mb-2 text-foreground/90">Example message:</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`{
  "url": "https://yourwebsite.com",
  "consensus": "UP",
  "votes": [...],
  "timestamp": "2024-06-01T12:00:00Z"
}`}</code></pre>
            </section>
            <section id="sdk-examples" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">SDK Examples</h2>
              <p className="mb-2 text-foreground/90">Use our SDKs to integrate DeepFry into your workflow. Example (Node.js):</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`const axios = require('axios');
const token = 'YOUR_JWT_TOKEN';
axios.get('https://deepfry.tech/api/websites', {
  headers: { Authorization: 'Bearer REDACTED_TOKEN' }
}).then(res => console.log(res.data));`}</code></pre>
            </section>
            <section id="error-handling" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Error Handling</h2>
              <ul className="mb-2 text-foreground/90">
                <li>All errors return a JSON object with <span className="font-mono">error</span> and <span className="font-mono">message</span> fields</li>
                <li>HTTP status codes indicate error type (e.g., 401 for auth, 429 for rate limit)</li>
                <li>Check error messages for troubleshooting tips</li>
              </ul>
            </section>

            {/* Advanced Topics */}
            <section id="scaling" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Scaling & Deployment</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Each service (aggregator, validator, alert, API) can be scaled independently</li>
                <li>Stateless services are ideal for containerization (Docker/Kubernetes)</li>
                <li>Kafka and database should be run in HA mode for production</li>
                <li>Use cloud load balancers and managed DBs for reliability</li>
                <li>Monitor with Prometheus, Grafana, and alerting integrations</li>
              </ul>
            </section>
            <section id="high-availability" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">High Availability</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Deploy multiple instances of each service</li>
                <li>Use health checks and auto-restart on failure</li>
                <li>Distribute validators across regions for redundancy</li>
              </ul>
            </section>
            <section id="optimization" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Performance Optimization</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Profile and optimize code paths</li>
                <li>Use caching for frequent queries</li>
                <li>Monitor latency and throughput</li>
              </ul>
            </section>
            <section id="integrations" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Custom Integrations</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Integrate with Slack, PagerDuty, or custom webhooks</li>
                <li>Use API keys for automation</li>
                <li>Contact support for enterprise integrations</li>
              </ul>
            </section>
            <section id="contributing" className="scroll-mt-20 bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">Contributing</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Fork the repo and submit pull requests</li>
                <li>Open issues for bugs or feature requests</li>
                <li>See <a href="https://github.com/kartiktoogoated/DeepFry/blob/main/CONTRIBUTING.md" className="underline text-primary">CONTRIBUTING.md</a> for guidelines</li>
              </ul>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DocsPage;