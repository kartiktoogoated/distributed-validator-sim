import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronRight, Globe, Shield, Zap, Server, Activity, Network, GitMerge, Share2, Coins, Wallet, Lock, Blocks as Blockchain, Plus, Minus } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import HeroAnimation from '@/components/animations/hero-animation';
import NetworkAnimation from '@/components/animations/network-animation';
import Stats from '@/components/landing/stats';
import CryptoCard from '@/components/web3/crypto-card';

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  useEffect(() => {
    document.title = 'DeepFry - Distributed Validator Network';
  }, []);

  const faqs = [
    {
      question: "What is a distributed validator network?",
      answer: "A distributed validator network is a decentralized system where multiple nodes work together to monitor website uptime and performance. Our network uses consensus mechanisms to ensure reliable and accurate monitoring results."
    },
    {
      question: "How do I become a validator?",
      answer: "To become a validator, you'll need to meet our minimum system requirements and stake tokens. The process involves setting up a validator node, completing verification, and joining our consensus network. Full details will be available when our validator program launches."
    },
    {
      question: "What are the rewards for validators?",
      answer: "Validators earn rewards in DeepFry tokens based on their performance, uptime, and participation in consensus. The exact reward structure will be announced with our tokenomics release."
    },
    {
      question: "How does website monitoring work?",
      answer: "Our network uses distributed validators to monitor websites from multiple geographic locations. Validators check uptime, response time, and other metrics, reaching consensus to provide accurate, tamper-proof monitoring data."
    },
    {
      question: "What makes DeepFry different from traditional monitoring?",
      answer: "Unlike centralized monitoring services, DeepFry uses a decentralized network of validators to provide trustless, consensus-based monitoring. This ensures higher reliability, transparency, and resistance to single points of failure."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 flex flex-col items-center">
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
                <Link to="/login">Get Started <ChevronRight size={16} className="ml-2" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="#learn-more">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="order-first lg:order-last">
            <HeroAnimation />
          </div>
        </div>

        {/* Web3 Cards */}
        <div className="container max-w-6xl mx-auto mt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <CryptoCard
              title="Token Rewards"
              description="Earn tokens for running validator nodes and participating in consensus"
              icon={<Coins className="h-8 w-8 text-primary" />}
              backContent="Validators earn rewards based on uptime, performance, and consensus participation"
            />
            
            <CryptoCard
              title="Web3 Wallet"
              description="Connect your wallet to receive validator rewards"
              icon={<Wallet className="h-8 w-8 text-primary" />}
              backContent="Compatible with major Web3 wallets including MetaMask and WalletConnect"
            />
            
            <CryptoCard
              title="Secure Staking"
              description="Stake tokens to become a validator"
              icon={<Lock className="h-8 w-8 text-primary" />}
              backContent="Staking mechanisms ensure validator reliability and network security"
            />
            
            <CryptoCard
              title="On-chain Proofs"
              description="Consensus results stored on blockchain"
              icon={<Blockchain className="h-8 w-8 text-primary" />}
              backContent="Immutable record of website monitoring results and validator performance"
            />
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
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>Leader Election</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>Log Replication</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>Safety Guarantees</span>
              </li>
            </ul>
          </div>

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
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>Epidemic Broadcast</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>Network Resilience</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>Eventual Consistency</span>
              </li>
            </ul>
          </div>

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
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>Node Discovery</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>Mesh Networking</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
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
            <div className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Network</h3>
              <p className="text-muted-foreground">
                Access validators from multiple geographic locations with consensus-based reporting
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Decentralized Infrastructure</h3>
              <p className="text-muted-foreground">
                Trustless monitoring with Raft consensus and gossip protocols
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn Crypto</h3>
              <p className="text-muted-foreground">
                Validators earn tokens by participating in the consensus network
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Run a Validator</h3>
              <p className="text-muted-foreground">
                Join the P2P network as a consensus participant
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
              <p className="text-muted-foreground">
                Consensus-validated status updates and analytics
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 bg-primary text-white py-1 px-3 rotate-45 text-xs font-semibold">
                Coming Soon
              </div>
              <div className="p-3 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 8L12 12L20 8L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Blockchain Integration</h3>
              <p className="text-muted-foreground">
                On-chain consensus proofs and validator rewards
              </p>
            </div>
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
              Our network of validators uses Raft consensus and gossip protocols to ensure accurate, decentralized website monitoring. Validators work together through peer-to-peer communication to maintain network consistency and reliability.
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

      {/* FAQ Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 bg-muted/30">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about our distributed validator network
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border rounded-lg bg-card transition-all duration-200 hover:shadow-md"
              >
                <button
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-medium">{faq.question}</span>
                  {openFaq === index ? (
                    <Minus className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
                <div
                  className={`px-6 overflow-hidden transition-all duration-200 ease-in-out ${
                    openFaq === index ? 'max-h-48 pb-4' : 'max-h-0'
                  }`}
                >
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6">
              Still have questions? We're here to help.
            </p>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Contact Support</Link>
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