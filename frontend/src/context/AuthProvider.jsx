import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { AuthContext } from './authContext';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bannedMessage, setBannedMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    // Axios interceptor for banned/account issues
    const interceptor = api.interceptors.response.use(
      r => r,
      err => {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || '';
        if (status === 403 && /banned/i.test(msg)) {
          setUser(null);
          setBannedMessage(msg || 'Your account has been banned.');
        } else if (status === 401 && /banned/i.test(msg)) {
          setUser(null);
          setBannedMessage(msg || 'Your account has been banned.');
        }
        return Promise.reject(err);
      }
    );
    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (mounted && res.data?.user) {
          const u = res.data.user;
          const normalized = {
            ...u,
            id: String(u.id || u._id),
            avatarUrl: u.avatarUrl || '',
            coverUrl: u.coverUrl || '',
            followersCount: u.followersCount ?? (Array.isArray(u.followers) ? u.followers.length : 0),
            following: u.following || []
          };
          setUser(normalized);
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; api.interceptors.response.eject(interceptor); };
  }, []);

  // login/signup/logout remain the same but ensure they set normalized user:
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const u = res.data.user;
    const normalized = {
      ...u,
      id: String(u.id || u._id),
      avatarUrl: u.avatarUrl || '',
      coverUrl: u.coverUrl || '',
      followersCount: u.followersCount ?? (Array.isArray(u.followers) ? u.followers.length : 0),
      following: u.following || []
    };
    setUser(normalized);
    return res;
  };

  const signup = async (name, email, password) => {
    const res = await api.post('/auth/signup', { name, email, password });
    const u = res.data.user;
    const normalized = {
      ...u,
      id: String(u.id || u._id),
      avatarUrl: u.avatarUrl || '',
      coverUrl: u.coverUrl || '',
      followersCount: u.followersCount ?? (Array.isArray(u.followers) ? u.followers.length : 0),
      following: u.following || []
    };
    setUser(normalized);
    return res;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout }}>
      {children}
      {bannedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full text-center space-y-4">
            <h2 className="text-xl font-semibold">Account Banned</h2>
            <p className="text-sm text-gray-600">{bannedMessage}</p>
            <button onClick={() => { setBannedMessage(''); window.location.href = '/login'; }} className="px-4 py-2 rounded g-btn-primary">OK</button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
