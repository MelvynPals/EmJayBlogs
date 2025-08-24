import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/authContext';

export default function Signup() {
  const { signup } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validName = name.trim().length >= 2;
  const validEmail = /.+@.+/.test(email);
  const validPassword = password.length >= 6;
  const formValid = validName && validEmail && validPassword;

  const submit = async (e) => {
    e.preventDefault();
    if (!formValid || loading) return;
    setLoading(true); setError('');
    try {
      await signup(name.trim(), email.trim(), password);
      navigate('/feature');
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-white via-emerald-50 to-teal-50">
      <div className="absolute inset-0 pointer-events-none opacity-60 [background:radial-gradient(circle_at_30%_25%,rgba(16,185,129,.22),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(45,212,191,.18),transparent_55%)]" />
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center relative py-9">
        <div className="hidden md:block pr-2">
          <h1 className="text-4xl font-bold tracking-tight mb-6 text-gray-900">Join the Community</h1>
          <p className="text-gray-600 leading-relaxed text-lg max-w-md">Create an account to publish your own stories, follow other writers, and build your audience.</p>
          <ul className="mt-8 space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">✔</span><span>Share long-form essays or quick updates.</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">✔</span><span>Engage with reactions & threaded comments.</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">✔</span><span>Grow through favorites and follows.</span></li>
          </ul>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-emerald-200/40 via-teal-200/40 to-white/10 blur-xl" />
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl ring-1 ring-black/5 p-8">
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">Create account</h2>
            <p className="text-sm text-gray-500 mb-6">Start writing today</p>
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="signup-name">Full name</label>
                <input
                  id="signup-name"
                  className={`w-full rounded-md border px-3 py-2 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${name && !validName ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Jane Writer"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
                {name && !validName && <p className="mt-1 text-xs text-red-600">Name too short.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  className={`w-full rounded-md border px-3 py-2 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${email && !validEmail ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                {email && !validEmail && <p className="mt-1 text-xs text-red-600">Enter a valid email.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="signup-password">Password</label>
                <div className="relative">
                  <input
                    id="signup-password"
                    className={`w-full rounded-md border px-3 py-2 pr-10 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${password && !validPassword ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="••••••••"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute inset-y-0 right-2 flex items-center text-xs text-emerald-600 hover:text-emerald-500">
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                {password && !validPassword && <p className="mt-1 text-xs text-red-600">At least 6 characters.</p>}
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
              <button
                type="submit"
                disabled={!formValid || loading}
                className="w-full relative inline-flex justify-center items-center gap-2 font-medium rounded-lg px-4 py-2.5 text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 shadow focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 focus:ring-offset-white"
              >
                {loading && <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
                <span>{loading ? 'Creating account...' : 'Sign up'}</span>
              </button>
            </form>
            <p className="mt-6 text-sm text-gray-600">Already have an account? <Link to="/login" className="font-medium text-emerald-600 hover:underline">Log in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
