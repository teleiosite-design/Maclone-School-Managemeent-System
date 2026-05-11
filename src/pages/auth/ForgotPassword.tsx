import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);

    if (error) {
      toast.error('Failed to send reset email', { description: error.message });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-navy mb-8 transition"
        >
          <ArrowLeft size={16} /> Back to sign in
        </button>

        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-navy flex items-center justify-center text-gold font-black">M</div>
          <span className="font-bold tracking-wide text-navy">MECLONES ACADEMY</span>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
            <h2 className="font-display text-3xl font-black text-navy mb-2">Check your inbox</h2>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <strong>{email}</strong>.
              It may take a few minutes.
            </p>
            <Link
              to="/login"
              className="inline-block bg-navy text-gold px-8 py-3 font-bold tracking-wider text-sm hover:bg-navy/90 transition"
            >
              BACK TO SIGN IN
            </Link>
          </div>
        ) : (
          <>
            <p className="eyebrow mb-3">Password recovery</p>
            <h2 className="font-display text-4xl font-black text-navy mb-2">Reset your password</h2>
            <p className="text-muted-foreground mb-8">
              Enter your email address and we'll send you a secure reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold tracking-wider text-navy mb-2">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@meclones.edu.ng"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-border focus:border-navy focus:outline-none text-navy"
                  />
                </div>
              </div>

              <button
                id="forgot-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-gold py-4 font-bold tracking-wider text-sm hover:bg-navy/90 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    SENDING…
                  </>
                ) : (
                  'SEND RESET LINK →'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
