import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/authContext';
import PostCardFeed from '../components/PostCardFeed';

export default function Favorites() {
    const { user } = useContext(AuthContext);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true); setError('');
            try {
                const res = await api.get('/posts/favorites');
                if (mounted) setPosts(res.data.posts || []);
            } catch (err) {
                setError(err?.response?.data?.message || 'Failed to load favorites');
            } finally { if (mounted) setLoading(false); }
        })();
        return () => { mounted = false; };
    }, [user?.id]);

    if (!user) return <div className="p-6">Login required.</div>;
    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold g-heading-gradient mb-1">Favorites Posts</h1>
                <p className="text-sm text-slate-600">Your favorites reads are saved here. Always an ease to revisit them.</p>
            </div>
            {loading && <div>Loading…</div>}
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {!loading && posts.length === 0 && <div className="text-gray-600">No favorites yet.</div>}
            <div className="grid gap-4">
                {posts.map(p => <PostCardFeed key={p._id} post={p} onUnfavorite={(id) => setPosts(ps => ps.filter(x => x._id !== id))} />)}
            </div>
        </div>
    );
}
