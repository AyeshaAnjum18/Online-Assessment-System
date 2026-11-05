
import { useState } from 'react';
import {
  ClipboardCheck,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('Student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (onLogin) {
      onLogin({ email: email.trim(), role, mode });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F8F2] px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[#E1E9DD] bg-white shadow-lg md:grid-cols-2">

        <div className="flex flex-col justify-center bg-[#EAF1E7] p-8 text-[#718071] sm:p-12">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E1E9DD] bg-white text-[#718F6D]">
            <ClipboardCheck size={30} />
          </div>

          <h1 className="text-3xl font-bold text-[#718F6D] sm:text-4xl">
            QuizMaster
          </h1>

          <p className="mt-4 text-lg text-[#718071]">
            Online Assessment and Quiz Management System
          </p>

          <div className="mt-10 space-y-5">
            <div className="flex items-start gap-3">
              <GraduationCap className="mt-1 text-[#718F6D]" size={22} />
              <div>
                <h3 className="font-semibold text-[#718F6D]">
                  Student Portal
                </h3>
                <p className="text-sm text-[#718071]">
                  Access assessments and track your performance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 text-[#718F6D]" size={22} />
              <div>
                <h3 className="font-semibold text-[#718F6D]">
                  Admin Portal
                </h3>
                <p className="text-sm text-[#718071]">
                  Create and manage online assessments.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-white p-8 sm:p-12">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-bold text-[#718F6D]">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>

            <p className="mt-2 text-sm text-[#718071]">
              {mode === 'login'
                ? 'Sign in to continue to QuizMaster.'
                : 'Enter your details to get started.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#718071]">
                  Login as
                </label>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="w-full rounded-lg border border-[#E1E9DD] bg-white px-4 py-3 text-[#718071] outline-none focus:border-[#718F6D] focus:ring-2 focus:ring-[#EAF1E7]"
                >
                  <option value="Student">Student</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#718071]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[#E1E9DD] px-4 py-3 text-[#718071] outline-none placeholder:text-[#AAB8A5] focus:border-[#718F6D] focus:ring-2 focus:ring-[#EAF1E7]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#718071]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-[#E1E9DD] px-4 py-3 pr-12 text-[#718071] outline-none placeholder:text-[#AAB8A5] focus:border-[#718F6D] focus:ring-2 focus:ring-[#EAF1E7]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718F6D] hover:text-[#5E795A]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-[#E1E9DD] bg-[#F5F8F2] p-3 text-sm text-[#718071]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-lg border border-[#718F6D] bg-[#718F6D] px-4 py-3 font-semibold text-white transition hover:bg-[#5E795A]"
              >
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#718071]">
              {mode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="font-semibold text-[#718F6D] underline underline-offset-4 hover:text-[#5E795A]"
              >
                {mode === 'login' ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
