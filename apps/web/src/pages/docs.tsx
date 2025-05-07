import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Code, Server, Globe } from 'lucide-react';
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
                        {section.items.map((item) => (
                          <li key={item.title}>
                            <a
                              href={item.href}
                              className="block text-[15px] rounded px-2 py-1 transition-colors hover:bg-primary/10 hover:text-primary font-medium text-foreground/90"
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
        <main className="flex-1 min-w-0 bg-background px-4 py-12 md:px-12">
          <div className="max-w-3xl mx-auto space-y-12">
            <section className="bg-card/80 border border-muted/30 rounded-2xl shadow-sm p-8">
              <h1 className="text-4xl font-bold mb-2 tracking-tight">Documentation</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Welcome to the DeepFry documentation. Here you'll find everything you need to know about running a validator node or monitoring your websites.
              </p>
            </section>

            {/* --- Getting Started --- */}
            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="introduction" className="text-2xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Book)} Introduction</h2>
              <p className="mb-4 text-base text-foreground/90">DeepFry is a distributed validator network for website uptime and performance monitoring. Validators from different regions ping your sites, reach consensus, and deliver accurate, real-time status and analytics.</p>
              <h3 className="text-lg font-semibold mb-2 mt-6">Key Features</h3>
              <ul className="mb-4 pl-4 space-y-1 text-foreground/90">
                <li>• Decentralized monitoring through validator nodes</li>
                <li>• Consensus-based reporting</li>
                <li>• Real-time alerts and notifications</li>
                <li>• Comprehensive API access</li>
                <li>• Detailed analytics and reporting</li>
              </ul>
            </section>

            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="quick-start" className="text-xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Book)} Quick Start Guide</h2>
              <ol className="list-decimal pl-6 space-y-2 mb-2 text-foreground/90">
                <li><span className="font-semibold">Sign Up:</span> Create your DeepFry account with email verification.</li>
                <li><span className="font-semibold">Add a Website:</span> Enter your site URL to start monitoring.</li>
                <li><span className="font-semibold">(Optional) Run a Validator:</span> Set up a node to join the network and earn reputation.</li>
                <li><span className="font-semibold">View Results:</span> Get real-time status, alerts, and historical analytics.</li>
              </ol>
            </section>

            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="installation" className="text-xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Book)} Installation</h2>
              <p className="mb-2 text-foreground/90">To run a validator node:</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`git clone https://github.com/your-org/deepfry.git
cd deepfry
npm install
cd apps/server
npm install`}</code></pre>
              <p className="text-foreground/80">Set up your <span className="font-mono">.env</span> file with the required environment variables (see Configuration).</p>
            </section>

            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="concepts" className="text-xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Book)} Basic Concepts</h2>
              <ul className="mb-2 text-foreground/90">
                <li><b>Validator:</b> A node that checks website status from its region.</li>
                <li><b>Consensus:</b> Weighted voting among validators for accurate results.</li>
                <li><b>Reputation:</b> Validators earn weight based on accuracy and uptime.</li>
                <li><b>Real-time:</b> Status and alerts are pushed instantly via WebSocket.</li>
              </ul>
            </section>

            {/* --- Validator Guide --- */}
            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="node-setup" className="text-2xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Server)} Setting Up a Node</h2>
              <ol className="list-decimal pl-6 space-y-2 mb-2 text-foreground/90">
                <li>Clone the repo and install dependencies (see Installation).</li>
                <li>Set your <span className="font-mono">VALIDATOR_ID</span> and <span className="font-mono">PEERS</span> in <span className="font-mono">.env</span>.</li>
                <li>Run database migrations: <span className="font-mono">npx prisma migrate dev</span></li>
                <li>Start your node: <span className="font-mono">npm run dev</span></li>
              </ol>
            </section>

            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="configuration" className="text-xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Server)} Configuration</h2>
              <ul className="mb-2 text-foreground/90">
                <li><b>VALIDATOR_ID</b>: Unique number for your node</li>
                <li><b>PEERS</b>: Comma-separated list of peer node addresses</li>
                <li><b>DATABASE_URL</b>: PostgreSQL connection string</li>
                <li><b>REDIS_URL</b>: Redis connection string</li>
                <li><b>KAFKA_BOOTSTRAP_SERVERS</b>: Kafka broker addresses</li>
                <li><b>JWT_SECRET</b>: Secret for authentication tokens</li>
              </ul>
            </section>

            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="running" className="text-xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Server)} Running a Validator</h2>
              <p className="mb-2 text-foreground/90">Start your node in development or production mode:</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`# Development
npm run dev

# Production
npm run build
npm start`}</code></pre>
              <p className="text-foreground/80">Monitor logs and check your node's health in the dashboard.</p>
            </section>

            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="maintenance" className="text-xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Server)} Maintenance</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Keep dependencies up to date</li>
                <li>Monitor validator weight and accuracy</li>
                <li>Backup your database regularly</li>
                <li>Check logs for errors or warnings</li>
              </ul>
            </section>

            {/* --- Website Monitoring --- */}
            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="add-website" className="text-2xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Globe)} Adding Websites</h2>
              <p className="mb-2 text-foreground/90">Add a website from the dashboard or via API:</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`POST /api/websites
{
  "url": "https://yourwebsite.com",
  "description": "My main site"
}`}</code></pre>
            </section>

            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="options" className="text-xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Globe)} Monitoring Options</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Set custom check intervals</li>
                <li>Pause/resume monitoring</li>
                <li>View uptime, latency, and region-specific results</li>
              </ul>
            </section>

            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="alerts" className="text-xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Globe)} Alerts & Notifications</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Get instant alerts for downtime or slow response</li>
                <li>Receive notifications via email or dashboard</li>
                <li>Configure alert thresholds per website</li>
              </ul>
            </section>

            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="reports" className="text-xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Globe)} Reports</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Download uptime and latency reports</li>
                <li>View historical trends and analytics</li>
                <li>Export data as CSV or JSON</li>
              </ul>
            </section>

            {/* --- API Reference --- */}
            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="auth" className="text-2xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Code)} Authentication</h2>
              <p className="mb-2 text-foreground/90">All API endpoints require a JWT token in the <span className="font-mono">Authorization</span> header after login.</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-2"><code>{`Authorization: Bearer <your-token>`}</code></pre>
            </section>

            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="endpoints" className="text-xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Code)} Endpoints</h2>
              <ul className="mb-2 text-foreground/90">
                <li><b>POST /api/auth/signup</b> – Register a new user</li>
                <li><b>POST /api/auth/verify-otp</b> – Verify email with OTP</li>
                <li><b>POST /api/auth/signin</b> – Login and get JWT</li>
                <li><b>POST /api/websites</b> – Add a website</li>
                <li><b>GET /api/websites</b> – List your websites</li>
                <li><b>PUT /api/websites/:id</b> – Update a website</li>
                <li><b>DELETE /api/websites/:id</b> – Remove a website</li>
                <li><b>GET /api/status</b> – Get current status from all validators</li>
                <li><b>GET /api/logs</b> – Get all validator logs</li>
              </ul>
            </section>

            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="rate-limits" className="text-xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Code)} Rate Limits</h2>
              <ul className="mb-2 text-foreground/90">
                <li>Auth endpoints: <b>5 requests per 15 minutes</b></li>
                <li>Other endpoints: <b>100 requests per 15 minutes</b></li>
              </ul>
            </section>

            <section className="bg-card/80 border-l-4 border-primary/60 rounded-xl shadow p-6">
              <h2 id="examples" className="text-xl font-bold mb-2 flex items-center gap-2">{getSectionIcon(Code)} Examples</h2>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mb-4"><code>{`# Signup
POST /api/auth/signup
{
  "email": "user@email.com",
  "password": "yourpass",
  "confirmPassword": "yourpass"
}

# Add Website
POST /api/websites
{
  "url": "https://mysite.com",
  "description": "Main site"
}`}</code></pre>
              <p className="text-muted-foreground">See the API Reference tab for more details and advanced usage.</p>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DocsPage;