import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { Navigate } from 'react-router-dom';
import api from '../api/axios';

export default function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const [tab, setTab] = useState('users');
    if (!user) return <Navigate to="/login" />;
    if (user.role !== 'admin') return <Navigate to="/feature" />;
    return (
        <div className="pt-12 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-3xl font-bold g-heading-gradient">Admin Dashboard</h1>
                <div className="g-tab-bar">
                    <button className={`g-tab-btn ${tab === 'users' ? 'is-active' : ''}`} onClick={() => setTab('users')}>Users</button>
                    <button className={`g-tab-btn ${tab === 'posts' ? 'is-active' : ''}`} onClick={() => setTab('posts')}>Posts</button>
                </div>
            </div>
            {tab === 'users' ? <UsersAdmin /> : <PostsAdmin />}
        </div>
    );
}

function UsersAdmin() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const load = async (p = page, q = search) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users', { params: { page: p, search: q } });
            const list = res.data.users;
            if (list.length === 0 && p > 1) {
                // fallback to previous page if current became empty
                return load(p - 1, q);
            }
            setRows(list); setPage(res.data.page); setTotalPages(res.data.totalPages);
        } catch { /* ignore */ } finally { setLoading(false); }
    };
    useEffect(() => {
        load(1, search); // eslint-disable-next-line
    }, []);

    const toggleBan = async (id, banned) => {
        if (!window.confirm(`${banned ? 'Unban' : 'Ban'} this user?`)) return;
        try {
            await api.patch(`/admin/users/${id}/ban`, { banned: !banned });
            await load(page, search);
        } catch (err) { alert(err?.response?.data?.message || 'Action failed'); }
    };

    return (
        <div>
            <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center">
                <div className="flex-1 flex gap-2">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name/email" className="flex-1 p-2 rounded border shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    <button onClick={() => load(1, search)} className="px-5 py-2 rounded g-btn-primary text-sm font-medium">Search</button>
                </div>
            </div>
            <div className="g-table-wrapper">
                {loading ? <div className="p-6 text-sm text-gray-600">Loading…</div> : (
                    <div className="overflow-x-auto">
                        <table className="g-table text-sm">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Followers</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td>
                                        <td className="font-mono text-xs">{u.email}</td>
                                        <td className='text-center'><span className="g-badge g-badge-neutral">{u.role}</span></td>
                                        <td className='text-center'>{u.followersCount}</td>
                                        <td className='text-center'>{u.banned ? <span className="g-badge g-badge-danger">Banned</span> : <span className="g-badge g-badge-success">Active</span>}</td>
                                        <td className='text-center'>
                                            <button onClick={() => toggleBan(u.id, u.banned)} className={`px-3 py-1 rounded text-xs font-medium text-white ${u.banned ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} transition`}>{u.banned ? 'Unban' : 'Ban'}</button>
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr><td colSpan={6} className="p-6 text-center text-gray-500">No users</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="flex gap-2 mt-4">
                <button disabled={page <= 1} onClick={() => { load(page - 1, search); }} className="px-3 py-1 border rounded">Prev</button>
                <div className="px-3 py-1">Page {page} / {totalPages}</div>
                <button disabled={page >= totalPages} onClick={() => { load(page + 1, search); }} className="px-3 py-1 border rounded">Next</button>
            </div>
        </div>
    );
}

function PostsAdmin() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [author, setAuthor] = useState('');

    const load = async (p = page, a = author) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/posts', { params: { page: p, author: a || undefined } });
            const list = res.data.posts;
            if (list.length === 0 && p > 1) {
                return load(p - 1, a);
            }
            setRows(list); setPage(res.data.page); setTotalPages(res.data.totalPages);
        } catch { /* ignore */ } finally { setLoading(false); }
    };
    useEffect(() => {
        load(1, author); // eslint-disable-next-line
    }, []);

    const del = async (id) => {
        if (!window.confirm('Delete this post?')) return;
        try {
            await api.delete(`/admin/posts/${id}`);
            await load(page, author);
        } catch { alert('Delete failed'); }
    };

    return (
        <div>
            <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center">
                <div className="flex-1 flex gap-2">
                    <input value={author} onChange={e => setAuthor(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') load(1, author); }} placeholder="Filter by author id, name or email" className="flex-1 p-2 rounded border shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    <button onClick={() => load(1, author)} className="px-5 py-2 rounded g-btn-primary text-sm font-medium">Filter</button>
                    {author && <button onClick={() => { setAuthor(''); load(1, ''); }} className="px-4 py-2 rounded g-btn-white text-sm font-medium">Clear</button>}
                </div>
            </div>
            <div className="g-table-wrapper">
                {loading ? <div className="p-6 text-sm text-gray-600">Loading…</div> : (
                    <div className="overflow-x-auto">
                        <table className="g-table text-sm">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Author</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(p => (
                                    <tr key={p.id}>
                                        <td className="max-w-[260px] truncate" title={p.title}>{p.title}</td>
                                        <td>{p.author?.name}</td>
                                        <td className='text-center'>{new Date(p.createdAt).toLocaleDateString()}</td>
                                        <td className='text-center'><button onClick={() => del(p.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition">Delete</button></td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr><td colSpan={4} className="p-6 text-center text-gray-500">No posts</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="flex gap-2 mt-4">
                <button disabled={page <= 1} onClick={() => { load(page - 1, author); }} className="px-3 py-1 border rounded">Prev</button>
                <div className="px-3 py-1">Page {page} / {totalPages}</div>
                <button disabled={page >= totalPages} onClick={() => { load(page + 1, author); }} className="px-3 py-1 border rounded">Next</button>
            </div>
        </div>
    );
}