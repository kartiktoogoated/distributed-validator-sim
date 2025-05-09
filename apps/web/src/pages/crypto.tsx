import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Coins, Wallet, Lock, Blocks, Activity, ArrowRight, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import NetworkAnimation from '@/components/animations/network-animation';
import CryptoCard from '@/components/web3/crypto-card';

const CryptoPage = () => {
  const [, setAnimatedValue] = useState(0);
  const targetValue = 1000000;

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = targetValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        setAnimatedValue(targetValue);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Decentralized Validation Network
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Earn rewards by participating in our distributed validator network while ensuring website reliability
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg" asChild>
                  <Link to="/signup">
                    Start Earning <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/docs">Learn More</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">Coming Soon</div>
                  <p className="text-muted-foreground">Total Value Locked</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">Coming Soon</div>
                  <p className="text-muted-foreground">Active Validators</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">Coming Soon</div>
                  <p className="text-muted-foreground">DEPIN Tokens</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold mb-2">Coming Soon</div>
                  <p className="text-muted-foreground">Network Uptime</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Web3 Features</h2>
              <p className="text-lg text-muted-foreground">
                Powered by blockchain technology and decentralized consensus
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <CryptoCard
                title="Token Rewards"
                description="Earn DEPIN tokens for running validator nodes and participating in consensus"
                icon={<Coins className="h-8 w-8 text-primary" />}
                backContent="Validators earn rewards based on uptime, performance, and consensus participation"
                className="transform hover:scale-105 transition-transform"
              />
              
              <CryptoCard
                title="Web3 Wallet"
                description="Connect your wallet to receive validator rewards"
                icon={<Wallet className="h-8 w-8 text-primary" />}
                backContent="Compatible with major Web3 wallets including MetaMask and WalletConnect"
                className="transform hover:scale-105 transition-transform"
              />
              
              <CryptoCard
                title="Secure Staking"
                description="Stake DEPIN tokens to become a validator"
                icon={<Lock className="h-8 w-8 text-primary" />}
                backContent="Staking mechanisms ensure validator reliability and network security"
                className="transform hover:scale-105 transition-transform"
              />
              
              <CryptoCard
                title="On-chain Proofs"
                description="Consensus results stored on blockchain"
                icon={<Blocks className="h-8 w-8 text-primary" />}
                backContent="Immutable record of website monitoring results and validator performance"
                className="transform hover:scale-105 transition-transform"
              />
              
              <CryptoCard
                title="Network Stats"
                description="Real-time network performance metrics"
                icon={<Activity className="h-8 w-8 text-primary" />}
                backContent="Monitor network health, validator performance, and token metrics"
                className="transform hover:scale-105 transition-transform"
              />
              
              <div className="relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="absolute -right-4 -top-4 bg-primary text-white py-1 px-3 rotate-45 text-xs font-semibold">
                  Coming Soon
                </div>
                <CardContent className="flex flex-col items-center justify-center h-[300px] p-6 text-center opacity-75">
                  <svg className="h-12 w-12 text-muted-foreground mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 8L12 12L20 8L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">More Features</h3>
                  <p className="text-muted-foreground">
                    Additional Web3 features coming soon
                  </p>
                </CardContent>
              </div>
            </div>
          </div>
        </section>

        {/* Network Visualization */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Network Activity</h2>
              <p className="text-lg text-muted-foreground">
                Watch our decentralized validator network in action
              </p>
            </div>
            <div className="rounded-lg border bg-card p-8">
              <NetworkAnimation />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Start Earning Today
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join our network of validators and earn rewards while contributing to a more reliable web
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/signup">
                Become a Validator <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CryptoPage