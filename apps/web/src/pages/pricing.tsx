import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const PricingPage = () => {
  const [userType, setUserType] = useState<'client' | 'validator'>('client');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTypeChange = (type: 'client' | 'validator') => {
    if (type === userType) return;
    setIsAnimating(true);
    setUserType(type);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const clientPlans = [
    {
      name: 'Free',
      price: 0,
      description: 'Perfect for trying out our platform',
      features: [
        'Monitor 1 website',
        'Basic uptime monitoring',
        'Email notifications',
        '5 validator nodes',
        'Daily reports',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: 29,
      description: 'Best for growing businesses',
      features: [
        'Monitor 10 websites',
        'Advanced monitoring',
        'SMS & Slack notifications',
        '25 validator nodes',
        'Real-time alerts',
        'Custom reporting',
        'API access',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 99,
      description: 'For large-scale operations',
      features: [
        'Unlimited websites',
        'Premium monitoring',
        'All notification channels',
        'Unlimited validators',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantee',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const validatorPlans = [
    {
      name: 'Basic',
      price: 100,
      description: 'Start earning as a validator',
      features: [
        'Run 1 validator node',
        'Basic rewards',
        'Community support',
        'Standard SLA',
        'Basic analytics',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Professional',
      price: 500,
      description: 'For serious validators',
      features: [
        'Run 5 validator nodes',
        'Enhanced rewards',
        'Priority support',
        'Advanced analytics',
        'Performance bonuses',
        'Early access features',
      ],
      cta: 'Start Validating',
      popular: true,
    },
    {
      name: 'Institutional',
      price: 2000,
      description: 'Enterprise-grade validation',
      features: [
        'Run unlimited nodes',
        'Maximum rewards',
        'Dedicated support',
        'Custom analytics',
        'Network governance',
        'Private endpoints',
        'Custom development',
      ],
      cta: 'Contact Us',
      popular: false,
    },
  ];

  const activePlans = userType === 'client' ? clientPlans : validatorPlans;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-20 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Choose the perfect plan for your needs. All plans include our core features.
            </p>
            
            <div className="inline-flex items-center p-1 bg-muted rounded-lg mb-8">
              <Button
                variant={userType === 'client' ? 'default' : 'ghost'}
                onClick={() => handleTypeChange('client')}
                className={`relative pricing-toggle ${userType === 'client' ? 'hover-glow' : ''}`}
              >
                Website Monitoring
                {userType === 'client' && (
                  <span className="absolute -top-2 -right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </Button>
              <Button
                variant={userType === 'validator' ? 'default' : 'ghost'}
                onClick={() => handleTypeChange('validator')}
                className={`relative pricing-toggle ${userType === 'validator' ? 'hover-glow' : ''}`}
              >
                Validator Node
                {userType === 'validator' && (
                  <span className="absolute -top-2 -right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </Button>
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${isAnimating ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
            {activePlans.map((plan, index) => (
              <Card 
                key={plan.name} 
                className={`pricing-card relative hover-glow ${plan.popular ? 'border-primary shadow-lg' : ''}`}
                style={{ '--animation-order': index } as React.CSSProperties}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 -right-2 bg-primary">Popular</Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full hover:scale-105 transition-transform" asChild>
                    <Link to="/signup">{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold mb-4">Enterprise Solutions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Need a custom solution? Contact our sales team for a tailored package.
            </p>
            <Button size="lg" variant="outline" className="hover:scale-105 transition-transform" asChild>
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;