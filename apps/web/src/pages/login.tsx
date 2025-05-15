/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { Activity } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { publicKey, signMessage, connected } = useWallet();

  // Email/password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem('token', data.token);
      toast({ title: 'Success!', description: 'You are now logged in.' });
      navigate('/client-dashboard');
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: err.message || 'Internal error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign & verify Phantom wallet
  const handlePhantomSign = async () => {
    try {
      if (!publicKey || !signMessage) {
        toast({ title: 'Error', description: 'Wallet not ready', variant: 'destructive' });
        return;
      }

      const message = 'deepfry-validator-auth';
      const encoded = new TextEncoder().encode(message);
      const signature = await signMessage(encoded);

      const res = await fetch('/api/auth/verify-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          message,
          signature: Array.from(signature),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Wallet login failed');

      localStorage.setItem('token', data.token ?? '');
      toast({ title: 'Success!', description: 'Logged in with Phantom.' });
      navigate('/client-dashboard');
    } catch (err: any) {
      toast({ title: 'Phantom Login failed', description: err.message || String(err), variant: 'destructive' });
    }
  };

  // Handle Google OAuth
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link to="/">Home</Link>
        </Button>
        <ThemeToggle />
      </div>

      <div className="mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold">
          <Activity className="h-6 w-6 text-primary" />
          DeepFry
        </Link>
        <p className="text-muted-foreground mt-2">Distributed Validator Network</p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <Button 
            variant="outline" 
            onClick={handleGoogleLogin} 
            className="w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
          <WalletMultiButton className="w-full justify-center" />
          {connected && (
            <Button variant="default" onClick={handlePhantomSign} className="w-full">
              Sign & Login with Phantom
            </Button>
          )}
          <p className="text-sm text-center">
            Don't have an account?{' '}
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link to="/signup">Sign up with OTP</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
