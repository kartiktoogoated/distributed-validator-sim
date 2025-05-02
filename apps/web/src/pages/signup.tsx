/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/signup.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { Activity } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Error', description: 'Please enter your email', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'default123', confirmPassword: 'default123' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'OTP Sent', description: 'Check your email for the verification code' });
        setStep('otp');
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to send OTP', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send OTP', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Error', description: 'Enter a valid 6-digit OTP', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) {
        const { message } = await res.json();
        throw new Error(message || 'Invalid or expired OTP');
      }
      toast({ title: 'Success!', description: 'Your account has been created.' });
      navigate('/login');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Top nav */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button variant="ghost" asChild><Link to="/">Home</Link></Button>
        <ThemeToggle />
      </div>

      {/* Branding */}
      <div className="mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold">
          <Activity className="h-6 w-6 text-primary" /> DePin
        </Link>
        <p className="text-muted-foreground mt-2">Distributed Validator Network</p>
      </div>

      {/* Signup Card */}
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            {step === 'email'
              ? 'Enter your email to start signup'
              : 'Enter the 6-digit verification code'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </form>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Verification Code</Label>
                {/* added flex wrapper to center the OTP inputs */}
                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={(value: string) => setOtp(value)}  // Ensure OTP state is updated
                    maxLength={6}
                    render={({ slots }) => (
                      <InputOTPGroup>
                        {slots.map((slot, i) => (
                          <InputOTPSlot key={i} {...slot} />
                        ))}
                      </InputOTPGroup>
                    )}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Didn’t get the code?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={handleSendOTP} // Resend OTP
                  >
                    Resend OTP
                  </Button>
                </p>
              </div>
              <Button
                onClick={handleVerifyOTP}
                className="w-full"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify & Create Account'}
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Already have an account?{' '}
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignupPage;
