import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import resolveMediaUrl from '../utils/resolveMediaUrl';
import defaultAvatar from '../assets/user-profile-default.png';

export default function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ posts: [], users: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const abortRef = useRef(null);
    const [touched, setTouched] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // all | users | posts

    useEffect(() => {
        if (!touched) return; // wait for user interaction
        if (query.trim().length < 2) {
            setResults({ posts: [], users: [] });
            setLoading(false);
            setError('');
            return;
        }
        setLoading(true);
        setError('');
        const controller = new AbortController();
        abortRef.current?.abort();
        abortRef.current = controller;
        const id = setTimeout(async () => {
            try {
                const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
                setResults({ posts: res.data.posts || [], users: res.data.users || [] });
            } catch (err) {
                if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
                    setError('Failed to search');
                }
            } finally { setLoading(false); }
        }, 350); // debounce
        return () => { clearTimeout(id); controller.abort(); };
    }, [query, touched]);

    const showUsers = activeTab === 'all' || activeTab === 'users';
    const showPosts = activeTab === 'all' || activeTab === 'posts';

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="mb-6 flex flex-col gap-6">
                <div className="flex flex-col gap-3 bg-white/70 backdrop-blur rounded-2xl p-5 shadow-sm border border-white/60">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative group">
                            <input
                                type="text"
                                placeholder="Search posts or users..."
                                className="w-full rounded-xl bg-white/80 border border-gray-200 px-4 py-3 pr-10 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition"
                                value={query}
                                onChange={e => { setQuery(e.target.value); if (!touched) setTouched(true); }}
                                autoFocus
                            />
                            {query && (
                                <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">✕</button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 rounded-full bg-gray-100">Min 2 chars</span>
                        <span className="px-2 py-1 rounded-full bg-gray-100">Titles</span>
                        <span className="px-2 py-1 rounded-full bg-gray-100">Content</span>
                        <span className="px-2 py-1 rounded-full bg-gray-100">Usernames</span>
                        <span className="px-2 py-1 rounded-full bg-gray-100">Emails</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                        {['all', 'users', 'posts'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'bg-gray-200/70 hover:bg-gray-300 text-gray-700'}`}>{tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                        ))}
                    </div>
                </div>
                {loading && (
                    <div className="grid gap-4 md:grid-cols-2 animate-pulse">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="rounded-xl bg-white/60 backdrop-blur p-4 border border-white/50">
                                <div className="h-4 w-28 bg-gray-200 rounded mb-4" />
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-gray-200 rounded" />
                                    <div className="h-3 w-5/6 bg-gray-200 rounded" />
                                    <div className="h-3 w-2/3 bg-gray-200 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && touched && query.trim().length >= 2 && results.users.length === 0 && results.posts.length === 0 && (
                    <div className="text-sm text-gray-500 flex flex-col items-center gap-2 py-10 bg-white/60 rounded-xl border border-dashed">
                        <span>No matches for "{query}".</span>
                        <span className="text-xs">Try broader keywords or check spelling.</span>
                    </div>
                )}
            </div>
            <div className="space-y-12">
                {showUsers && results.users.length > 0 && (
                    <section>
                        <header className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold tracking-tight">Users <span className="text-sm font-normal text-gray-400">({results.users.length})</span></h2>
                        </header>
                        <ul className="grid md:grid-cols-2 gap-4">
                            {results.users.map(u => (
                                <li key={u.id} className="group flex items-center gap-4 p-4 rounded-2xl bg-white/70 backdrop-blur border border-white/60 hover:shadow-md transition shadow-sm">
                                    <Link to={`/users/${u.id}`} className="shrink-0">
                                        <img src={u.avatarUrl ? resolveMediaUrl(u.avatarUrl) : defaultAvatar} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-white group-hover:scale-[1.03] transition" />
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/users/${u.id}`} className="font-medium hover:underline block truncate" title={u.name}>{highlight(u.name, query)}</Link>
                                        {u.title && <div className="text-xs text-gray-500 truncate" title={u.title}>{highlight(u.title, query)}</div>}
                                        <div className="mt-1 flex gap-3 text-[11px] text-gray-500">
                                            {typeof u.followersCount === 'number' && <span>{u.followersCount} followers</span>}
                                            {typeof u.mutualCount === 'number' && u.mutualCount > 0 && <span className="text-indigo-600 font-medium">{u.mutualCount} mutual</span>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                {showPosts && results.posts.length > 0 && (
                    <section>
                        <header className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold tracking-tight">Posts <span className="text-sm font-normal text-gray-400">({results.posts.length})</span></h2>
                        </header>
                        <ul className="space-y-5">
                            {results.posts.map(p => (
                                <li key={p.id} className="group rounded-2xl bg-white/70 backdrop-blur border border-white/60 p-5 hover:shadow-md transition shadow-sm">
                                    <Link to={`/posts/${p.id}`} className="block">
                                        <h3 className="font-semibold text-base mb-1.5 group-hover:underline line-clamp-2 leading-snug">{highlight(p.title, query)}</h3>
                                        {p.author && (
                                            <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-2 flex-wrap">
                                                <img src={p.author.avatarUrl ? resolveMediaUrl(p.author.avatarUrl) : defaultAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                                                <span className="truncate max-w-[120px]" title={p.author.name}>{highlight(p.author.name, query)}</span>
                                                <span>• {new Date(p.createdAt).toLocaleDateString()}</span>
                                                <span>• {p.favoritesCount} fav</span>
                                                <span>• {p.reactionsCount} reacts</span>
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{highlight(p.snippet, query)}</p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </div>
    );
}

// simple highlight function
function highlight(text, q) {
    if (!q) return text;
    try {
        const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(safe, 'ig');
        const parts = String(text).split(re);
        const matches = String(text).match(re) || [];
        return parts.reduce((acc, part, i) => {
            acc.push(part);
            if (i < matches.length) acc.push(<mark key={i} className="bg-yellow-200 px-0.5 rounded">{matches[i]}</mark>);
            return acc;
        }, []);
    } catch {
        return text;
    }
}
