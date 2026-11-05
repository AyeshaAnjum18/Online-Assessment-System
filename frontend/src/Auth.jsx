import { useState } from 'react';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }

      if (password.length < 6) {
        setError('Password must contain at least 6 characters.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    onLogin({
      name: name.trim() || email.split('@')[0],
      email: email.trim(),
      role: 'Student',
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-4 py-8 font-sans">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-2">
        <div className="flex flex-col justify-center bg-gradient-to-br from-[#edf2f8] to-[#e5edf6] p-10 text-[#7186a1] md:p-12">
          <div className="mb-10 flex items-center gap-3">
            <div className="rounded-xl bg-white/70 p-3 text-xl font-bold text-[#7d91ad]">
              Q
            </div>
            <span className="text-2xl font-bold text-[#7186a1]">QuizMaster</span>
          </div>

          <h1 className="text-3xl font-bold leading-tight text-[#7186a1] md:text-4xl">
            Learn. Attempt. Achieve.
          </h1>

          <p className="mt-5 leading-7 text-[#8999ae]">
            Your online assessment and quiz management platform. Take
            assessments, track your progress, and celebrate your achievements.
          </p>

          <div className="mt-10 space-y-4 text-sm text-[#7d91a9]">
            <p>✓ Easy online assessments</p>
            <p>✓ Instant score evaluation</p>
            <p>✓ Review your results</p>
          </div>
        </div>

        <div className="flex items-center justify-center p-7 sm:p-10 md:p-12">
          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <h2 className="text-2xl font-bold text-[#657b97]">
              {mode === 'login' ? 'Welcome back!' : 'Create an account'}
            </h2>

            <p className="mt-2 text-sm text-[#9aa8b9]">
              {mode === 'login'
                ? 'Sign in to continue to QuizMaster.'
                : 'Sign up to get started with QuizMaster.'}
            </p>

            <div className="mt-7 flex rounded-lg bg-[#f1f4f8] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 rounded-md py-2 text-sm font-medium ${
                  mode === 'login'
                    ? 'bg-white text-[#657b97] shadow-sm'
                    : 'text-[#9aa8b9]'
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`flex-1 rounded-md py-2 text-sm font-medium ${
                  mode === 'signup'
                    ? 'bg-white text-[#657b97] shadow-sm'
                    : 'text-[#9aa8b9]'
                }`}
              >
                Sign Up
              </button>
            </div>

            {mode === 'signup' && (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-[#8292a7]">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-lg border border-[#e1e7ef] px-4 py-3 text-[#657b97] outline-none focus:border-[#a9bad0] focus:ring-2 focus:ring-[#edf2f8]"
                />
              </div>
            )}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-[#8292a7]">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#e1e7ef] px-4 py-3 text-[#657b97] outline-none focus:border-[#a9bad0] focus:ring-2 focus:ring-[#edf2f8]"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-[#8292a7]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-[#e1e7ef] px-4 py-3 text-[#657b97] outline-none focus:border-[#a9bad0] focus:ring-2 focus:ring-[#edf2f8]"
              />
            </div>

            {mode === 'signup' && (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-[#8292a7]">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Confirm your password"
                  className="w-full rounded-lg border border-[#e1e7ef] px-4 py-3 text-[#657b97] outline-none focus:border-[#a9bad0] focus:ring-2 focus:ring-[#edf2f8]"
                />
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-lg bg-[#e4ecf7] py-3 font-semibold text-[#7186a1] transition hover:bg-[#d5e1f0]"
            >
              {mode === 'login' ? 'Login' : 'Create Account'}
            </button>

            <p className="mt-5 text-center text-xs leading-5 text-[#a0adbd]">
              Online Assessment and Quiz Management System
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}