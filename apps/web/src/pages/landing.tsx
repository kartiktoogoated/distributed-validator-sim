import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Globe,
  Shield,
  Zap,
  Server,
  Activity,
  Network,
  GitMerge,
  Share2,
} from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import HeroAnimation from '@/components/animations/hero-animation';
import NetworkAnimation from '@/components/animations/network-animation';
import Stats from '@/components/landing/stats';

const LandingPage = () => {
  useEffect(() => {
    document.title = 'DePin - Distributed Validator Network';
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="min-h-screen py-20 px-4 md:px-6 lg:px-8 flex items-center">
        <div className="container max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors focus:outline-none bg-muted">
              <span className="text-primary">Coming Soon</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Decentralized Website Monitoring Network
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Join our consensus-driven network of distributed validators to monitor websites and earn crypto rewards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link to="/login">
                  Get Started <ChevronRight size={16} className="ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="#learn-more">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="order-first lg:order-last flex items-center justify-center">
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6">
          <Stats />
        </div>
      </section>

      {/* Consensus Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-6xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Powered by Advanced Consensus</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our network utilizes state-of-the-art consensus mechanisms to ensure reliable and accurate website monitoring.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 container max-w-6xl mx-auto">
          {/* Raft Consensus Card */}
          <div className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <GitMerge className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Raft Consensus</h3>
            <p className="text-muted-foreground">
              Leader-based consensus protocol ensuring strong consistency across validator nodes.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Leader Election</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Log Replication</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Safety Guarantees</span>
              </li>
            </ul>
          </div>
          {/* Gossip Protocol Card */}
          <div className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gossip Protocol</h3>
            <p className="text-muted-foreground">
              Efficient peer-to-peer communication for rapid information dissemination.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Epidemic Broadcast</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Network Resilience</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Eventual Consistency</span>
              </li>
            </ul>
          </div>
          {/* P2P Network Card */}
          <div className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">P2P Network</h3>
            <p className="text-muted-foreground">
              Decentralized architecture enabling direct validator communication.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Node Discovery</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Mesh Networking</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>Fault Tolerance</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="learn-more" className="py-20 px-4 md:px-6 lg:px-8">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Our distributed validator network provides reliable website monitoring through consensus-driven validation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards... */}
          </div>
        </div>
      </section>

      {/* Network Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 bg-muted/30">
        <div className="container max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <NetworkAnimation />
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Consensus-Driven Network</h2>
            <p className="text-lg text-muted-foreground">
              Our network of validators uses Raft consensus and gossip protocols to ensure accurate, decentralized website monitoring.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Raft-based leader election and log replication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Gossip protocol for efficient data propagation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>P2P mesh network architecture</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Byzantine fault tolerance</span>
              </li>
            </ul>
            <Button size="lg" asChild>
              <Link to="/login?type=client">Monitor Your Website</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="container max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join our consensus network</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Become part of our distributed validator network and help build a more reliable web monitoring system.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/login?type=validator">Become a Validator</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent" asChild>
              <Link to="/login?type=client">Monitor Your Website</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
