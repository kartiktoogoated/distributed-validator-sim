import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Activity, Users, Globe, Shield, Award, Code } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto max-w-6xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About DeepFry</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              We're building the future of decentralized website monitoring through consensus-driven validation and blockchain technology.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 px-4 md:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  To create a more reliable and transparent web by leveraging decentralized technology and community-driven validation.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <span>Ensuring website reliability through decentralization</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span>Building a community of trusted validators</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <span>Creating a global network of monitoring nodes</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl transform -rotate-6"></div>
                <Card className="relative">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Activity className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold">Real-time Monitoring</h3>
                          <p className="text-sm text-muted-foreground">Instant website status updates</p>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-4/5 bg-primary rounded-full animate-pulse"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <div className="font-semibold">99.9%</div>
                          <div className="text-muted-foreground">Uptime</div>
                        </div>
                        <div>
                          <div className="font-semibold">85ms</div>
                          <div className="text-muted-foreground">Latency</div>
                        </div>
                        <div>
                          <div className="font-semibold">24/7</div>
                          <div className="text-muted-foreground">Monitoring</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 px-4 md:px-6 lg:px-8 bg-muted/30">
          <div className="container mx-auto max-w-6xl text-center">
            <h2 className="text-3xl font-bold mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Security First</h3>
                  <p className="text-muted-foreground">
                    We prioritize the security and reliability of our network above all else.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                  <p className="text-muted-foreground">
                    Constantly pushing the boundaries of what's possible with decentralized technology.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Excellence</h3>
                  <p className="text-muted-foreground">
                    Committed to delivering the highest quality monitoring service.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 md:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl text-center">
            <h2 className="text-3xl font-bold mb-6">Join Our Network</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Be part of the future of website monitoring. Join our network as a validator or start monitoring your websites today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;