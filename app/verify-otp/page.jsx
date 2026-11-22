'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import createClientForBrowser from '../../utils/supabase/client';

function VerifyOtpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const purpose = searchParams.get('purpose');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const supabase = createClientForBrowser();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    const pending = JSON.parse(sessionStorage.getItem('signupPending') || 'null');
    if (pending?.email === email) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: pending.password,
        data: pending.metadata,
      });

      if (passwordError) {
        setError(passwordError.message);
        setIsLoading(false);
        return;
      }

      sessionStorage.removeItem('signupPending');
    }

    const { data: userData } = await supabase.auth.getUser();
    const onboarded = userData?.user?.user_metadata?.onboarded === true;
    setIsLoading(false);
    router.push(onboarded ? '/dashboard' : '/onboarding');
  };

  const handleResend = async () => {
    setError('');
    setIsResending(true);

    const supabase = createClientForBrowser();
    const pending = JSON.parse(sessionStorage.getItem('signupPending') || 'null');
    const metadata = pending?.email === email ? pending.metadata : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: metadata,
      },
    });

    if (error) setError(error.message);
    else setError('A new OTP has been sent to your email.');
    setIsResending(false);
  };

  if (purpose === 'confirm-link') {
    return (
      <div className="min-h-screen bg-[#101113] flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full space-y-6 bg-[#18191b] rounded-2xl shadow-xl p-8 border border-gray-700 text-center">
          <h1 className="text-3xl font-bold text-white">Check your email</h1>
          <p className="text-gray-300">
            We sent a confirmation link to{' '}
            <span className="font-semibold text-cyan-400">{email}</span>.
          </p>
          <p className="text-sm text-gray-400">
            Open the link in the email to confirm your account. After confirmation, you will return to the onboarding page.
          </p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-all duration-200"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101113] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Verify OTP</h1>
          <h2 className="text-lg text-gray-300 mb-4">Enter the OTP sent to <span className="font-semibold text-cyan-400">{email}</span></h2>
        </div>
        <div className="bg-[#18191b] rounded-2xl shadow-xl p-8 border border-gray-700">
          <form onSubmit={handleVerify} className="space-y-6">
            <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="otp">OTP</label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              placeholder="Enter OTP"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 bg-[#101113] text-white placeholder-gray-400 border-gray-600"
            />
            <button
              type="submit"
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || isLoading}
              className="w-full text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend OTP'}
            </button>
            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-2">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-white">Loading...</span></div>}>
      <VerifyOtpInner />
    </Suspense>
  );
}
