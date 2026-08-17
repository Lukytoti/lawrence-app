'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('oluwatobi@lawrenceapp.internal');
  const [password, setPassword] = useState('AdminPassword123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: '/overview',
      });

      if (res?.error) {
        setError(res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error);
      } else {
        window.location.href = '/overview';
      }
    } catch (err: any) {
      setError('An unexpected login error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-root flex items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md bg-bg-surface border border-border-strong rounded-2xl shadow-2xl overflow-hidden p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-wine-deep border border-wine-primary/80 flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-lg">
            L
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Lawrence Operating System</h1>
          <p className="text-xs text-txt-muted">
            Private Executive Business Productivity & Leadership OS
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="w-4 h-4 text-txt-muted" />}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            leftIcon={<Lock className="w-4 h-4 text-txt-muted" />}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In to OS
          </Button>
        </form>

        {/* Security Footer */}
        <div className="pt-4 border-t border-border-subtle text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-txt-muted">
            <Shield className="w-3.5 h-3.5 text-wine-text" />
            <span>Protected by Dynamic RBAC & Audit Logging</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            System Owner: Oluwatobi (Super Admin)
          </div>
        </div>
      </div>
    </div>
  );
}
