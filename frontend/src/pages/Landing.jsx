import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import HeroBG from '../assets/hero-bg.png';
import api from '../api/axios';
import FeaturedPostCard from '../components/FeaturedPostCard';

export default function Landing() {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                const res = await api.get('/posts');
                let posts = res.data?.posts || [];
                // derive favoritesCount then sort desc; fallback to recent if tie
                posts = posts
                    .map(p => ({ ...p, favoritesCount: (p.favorites || []).length }))
                    .sort((a, b) => {
                        if (b.favoritesCount === a.favoritesCount) {
                            return new Date(b.createdAt) - new Date(a.createdAt);
                        }
                        return b.favoritesCount - a.favoritesCount;
                    })
                    .slice(0, 9); // top 9 featured
                if (mounted) setFeatured(posts);
            } catch (err) {
                console.error('Failed to load featured posts', err);
                if (mounted) setError(err?.response?.data?.message || 'Failed to load featured posts');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    const scrollToFeatured = useCallback((e) => {
        e.preventDefault();
        const el = document.getElementById('featuredPost');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // fallback just navigate to root hash
            window.location.hash = '#featuredPost';
        }
    }, []);

    return (
        <>
            <div className="h-screen relative bg-cover bg-center flex items-center justify-center after:content-[''] after:absolute after:inset-0 after:h-full after:bg-black/40"
                style={{ backgroundImage: `url(${HeroBG})` }}>
                <div className="max-w-2xl p-8 flex justify-center flex-col items-center z-10 g-surface-glass rounded-xl shadow-lg">
                    <h1 className="text-7xl font-bold mb-6 g-heading-gradient">STAY CURIOUS</h1>
                    <p className="mb-6 text-lg text-gray-700 text-center">Discover stories, thinking, and expertise from writers on any topic.</p>
                    <div className="flex gap-4 flex-wrap justify-center">
                        <a href="#featuredPost" onClick={scrollToFeatured} className="px-6 py-3 rounded-full g-btn-primary text-sm font-medium">Explore our Stories</a>
                        <Link to="/signup" className="px-6 py-3 rounded-full g-btn-emerald text-sm font-medium">Get Started</Link>
                    </div>
                </div>
            </div>
            <div className='w-full flex justify-center pt-12 g-bg-page' id='featuredPost'>
                <div className="container p-6 flex flex-col items-center">
                    <div className="mb-10 text-center max-w-3xl">
                        <h2 className="text-4xl font-bold mb-4 g-heading-gradient">Welcome to EmJayBlogs</h2>
                        <p className="mb-4 text-gray-700 text-lg">Join the community of writers and readers to inspire others with your story.</p>
                    </div>
                    <section className='mb-12 w-full'>
                        <h3 className="text-2xl font-semibold mb-6 g-heading-gradient">Featured Posts</h3>
                        {loading && <div className="text-gray-500">Loading featured posts...</div>}
                        {error && !loading && <div className="text-red-600 mb-4">{error}</div>}
                        {!loading && !error && featured.length === 0 && (
                            <div className="text-gray-600">No posts yet. Be the first to create one!</div>
                        )}
                        <div className="grid gap-6 md:grid-cols-3">
                            {featured.map(p => (
                                <FeaturedPostCard key={p._id} post={p} />
                            ))}
                        </div>
                    </section>
                    <Link to="/feature" className="mb-12 px-6 py-3 rounded-full g-btn-primary text-sm font-medium">Explore More</Link>
                </div>
            </div>
        </>
    );
}
// This code defines a simple landing page for a Medium-like blog application using React and React Router. It includes links to the login and signup pages.