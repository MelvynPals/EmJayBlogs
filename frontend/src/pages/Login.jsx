import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/authContext';

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validEmail = /.+@.+/.test(email);
  const validPassword = password.length >= 6;
  const formValid = validEmail && validPassword;

  const submit = async (e) => {
    e.preventDefault();
    if (!formValid || loading) return;
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate('/feature');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed';
      if (err?.response?.status === 403 && /banned/i.test(msg)) { setLoading(false); return; }
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-30 bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      <div className="absolute inset-0 pointer-events-none opacity-60 [background:radial-gradient(circle_at_30%_20%,rgba(59,130,246,.18),transparent_60%),radial-gradient(circle_at_75%_65%,rgba(129,140,248,.15),transparent_55%)]" />
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center relative">
        <div className="hidden md:block pl-2 py-9">
          <h1 className="text-4xl font-bold tracking-tight mb-6 text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 leading-relaxed text-lg max-w-md">Sign in to continue exploring engaging stories, react, and connect with other creators in the community.</p>
          <div className="mt-10 flex gap-8">
            <Stat label="Stories" value="5k+" />
            <Stat label="Creators" value="1.2k" />
            <Stat label="Reactions" value="42k" />
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-blue-200/40 via-indigo-200/40 to-white/10 blur-xl" />
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl ring-1 ring-black/5 p-8">
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">Log in</h2>
            <p className="text-sm text-gray-500 mb-6">Access your account</p>
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  className={`w-full rounded-md border px-3 py-2 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${email && !validEmail ? 'border-red-400' : 'border-gray-300'}`}
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
                <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="login-password">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    className={`w-full rounded-md border px-3 py-2 pr-10 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${password && !validPassword ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="••••••••"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute inset-y-0 right-2 flex items-center text-xs text-blue-600 hover:text-blue-500">
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                {password && !validPassword && <p className="mt-1 text-xs text-red-600">At least 6 characters.</p>}
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
              <button
                type="submit"
                disabled={!formValid || loading}
                className="w-full relative inline-flex justify-center items-center gap-2 font-medium rounded-lg px-4 py-2.5 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
              >
                {loading && <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />}
                <span>{loading ? 'Logging in...' : 'Log in'}</span>
              </button>
            </form>
            <p className="mt-6 text-sm text-gray-600">No account? <Link to="/signup" className="font-medium text-blue-600 hover:underline">Sign up</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      <div className="text-xs tracking-wide uppercase text-gray-500 mt-1">{label}</div>
    </div>
  );
}
