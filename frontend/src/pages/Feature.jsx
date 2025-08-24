// frontend/src/pages/Feature.jsx
import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import PostCard from '../components/PostCardFeed';

export default function Feature() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                // we'll reuse GET /api/posts to list latest posts.
                const res = await api.get('/posts');
                if (mounted) setPosts(res.data.posts || []);
            } catch (err) {
                console.error(err);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold g-heading-gradient">Most Recent Stories</h1>
            {loading ? (
                <div>Loading…</div>
            ) : posts.length === 0 ? (
                <div className="text-gray-600">No posts yet.</div>
            ) : (
                <div className="space-y-4">
                    {posts.map((p) => (
                        <PostCard key={p._id} post={p} />
                    ))}
                </div>
            )}
        </div>
    );
}
