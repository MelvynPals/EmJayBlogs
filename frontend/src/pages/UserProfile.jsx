import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/authContext';
import CreateStory from '../components/CreateStory';
import PostCardProfile from '../components/PostCardProfile';
import resolveMediaUrl from '../utils/resolveMediaUrl';
import defaultAvatar from '../assets/user-profile-default.png';

export default function UserProfile({ isSelfRoute = false }) {
    // If route is /users/:id then use useParams().id
    // If route is /profile (own profile) you can pass isSelfRoute=true to fetch current user id
    const params = useParams();
    const { user: me, setUser } = useContext(AuthContext);

    const viewingUserId = params.id || (isSelfRoute ? (me?.id || me?._id) : null);

    const [profile, setProfile] = useState(null); // { name, title, avatarUrl, coverUrl, followersCount, _id }
    const [posts, setPosts] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);

    // fetch profile info (public)
    useEffect(() => {
        if (!viewingUserId) return;
        let mounted = true;
        (async () => {
            setLoadingProfile(true);
            try {
                // If viewing self and you already have `me` data from context, use it to avoid extra call
                if (me && (String(me.id || me._id) === String(viewingUserId))) {
                    if (mounted) setProfile(me);
                } else {
                    const res = await api.get(`/users/${viewingUserId}`);
                    if (mounted) setProfile(res.data.user);
                }
            } catch (err) {
                console.error('Failed to load user profile', err);
            } finally {
                if (mounted) setLoadingProfile(false);
            }
        })();
        return () => { mounted = false; };
    }, [viewingUserId, me]);

    // fetch posts by this user
    useEffect(() => {
        if (!viewingUserId) return;
        let mounted = true;
        (async () => {
            setLoadingPosts(true);
            try {
                const res = await api.get(`/posts/user/${viewingUserId}`);
                if (mounted) setPosts(res.data.posts || []);
            } catch (err) {
                console.error('Failed to load user posts', err);
                if (mounted) setPosts([]);
            } finally {
                if (mounted) setLoadingPosts(false);
            }
        })();
        return () => { mounted = false; };
    }, [viewingUserId]);


    // create handler passed into CreateStory when viewing own profile
    const handleNewPost = (post) => {
        // prepend new post so profile shows it immediately
        setPosts(prev => [post, ...prev]);
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Delete this post?')) return;
        const prev = posts;
        setPosts(p => p.filter(x => x._id !== postId)); // optimistic
        try {
            await api.delete(`/posts/${postId}`);
        } catch {
            alert('Delete failed');
            setPosts(prev); // rollback
        }
    };

    // avatar/cover upload logic
    const avatarInputRef = useRef();
    const coverInputRef = useRef();

    const handleAvatarPick = () => avatarInputRef.current?.click();
    const handleCoverPick = () => coverInputRef.current?.click();

    const uploadFiles = async (files) => {
        try {
            const form = new FormData();
            if (files.avatar) form.append('avatar', files.avatar);
            if (files.cover) form.append('cover', files.cover);
            const res = await api.put('/users/me/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            // Update local profile and Auth Context with all fields
            setProfile({ ...profile, ...res.data.user });
            setUser(prev => ({
                ...prev,
                ...res.data.user,
                id: String(res.data.user.id || res.data.user._id),
                avatarUrl: res.data.user.avatarUrl,
                coverUrl: res.data.user.coverUrl,
                followersCount: res.data.user.followersCount
            }));
        } catch {
            alert('Upload failed');
        }
    };


    // render
    if (loadingProfile) return <div className="p-6">Loading profile…</div>;
    if (!profile) return <div className="p-6">User not found</div>;

    const isOwner = Boolean(me && String(me.id || me._id) === String(profile._id || profile.id));

    return (
        <div className="space-y-10 pt-12">
            {/* Cover area */}
            <div className={`relative group rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5 ${isOwner ? 'cursor-pointer' : ''}`} style={{ height: 240 }} onClick={(e) => {
                if (!isOwner) return; // ignore clicks from internal controls
                const target = e.target; if (target.closest && target.closest('[data-no-cover-click]')) return; handleCoverPick();
            }}>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-slate-900/60 pointer-events-none" />
                {profile.coverUrl ? (
                    <img src={resolveMediaUrl(profile.coverUrl)} alt="cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full g-bg-section flex items-center justify-center text-slate-400 text-sm">No cover image</div>
                )}
                {isOwner && <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { uploadFiles({ cover: e.target.files[0] }) }} />}
                {isOwner && (
                    <div data-no-cover-click className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition bg-white/80 backdrop-blur px-3 py-1.5 rounded-md text-[11px] font-medium text-slate-700 shadow" onClick={(e) => { e.stopPropagation(); handleCoverPick(); }}>
                        Change cover
                    </div>
                )}
                {/* Avatar overlay placement */}
                <div className="absolute -bottom-8 left-8 flex items-end gap-4">
                    <div className="relative" onClick={(e) => { e.stopPropagation(); if (isOwner) handleAvatarPick(); }}>
                        <div className="rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-sky-400 to-emerald-400">
                            <img src={profile.avatarUrl ? resolveMediaUrl(profile.avatarUrl) : defaultAvatar} alt="avatar" className="rounded-full w-36 h-36 object-cover bg-white" />
                        </div>
                        {isOwner && <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { uploadFiles({ avatar: e.target.files[0] }) }} />}
                        {isOwner && (
                            <div data-no-cover-click className="absolute bottom-1 right-1 bg-white/90 text-[10px] px-1.5 py-0.5 rounded shadow-sm border border-slate-200" onClick={(e) => { e.stopPropagation(); handleAvatarPick(); }}>Edit</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Header content below cover */}
            <div className="pt-2 flex flex-col lg:flex-row lg:items-end gap-6 justify-between">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold g-heading-gradient leading-tight">{profile.name}</h1>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                        <div className="px-3 py-1 rounded-full bg-white/70 shadow-sm border border-slate-200 flex items-center gap-1">
                            <span className="font-semibold text-slate-700">{profile.followers?.length ?? profile.followersCount ?? 0}</span>
                            <span className="tracking-wide text-slate-500 uppercase">Followers</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white/70 shadow-sm border border-slate-200 flex items-center gap-1">
                            <span className="font-semibold text-slate-700">{posts.length}</span>
                            <span className="tracking-wide text-slate-500 uppercase">Stories</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!isOwner && me && <FollowUnfollowButton targetId={profile._id || profile.id} />}
                </div>
            </div>

            {isOwner && (
                <div className="mt-4">
                    <CreateStory onNewPost={handleNewPost} />
                </div>
            )}

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold g-heading-gradient">Stories</h1>
                    <div className="h-px flex-1 ml-6 bg-gradient-to-r from-slate-300/40 to-transparent" />
                </div>
                {loadingPosts ? (
                    <div className="text-sm text-slate-500 animate-pulse">Loading posts…</div>
                ) : posts.length === 0 ? (
                    <div className="text-sm text-slate-500">No stories yet.</div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {posts.map(p => (
                            <PostCardProfile key={p._id} post={p} onDelete={isOwner ? handleDelete : undefined} canEdit={isOwner} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function FollowUnfollowButton({ targetId }) {
    const { user, setUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        if (user && Array.isArray(user.following)) {
            setFollowing(user.following.some(f => String(f) === String(targetId) || (f?._id && String(f._id) === String(targetId))));
        } else {
            setFollowing(false);
        }
    }, [user, user?.following, targetId]);

    const toggle = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.post(`/users/${targetId}/follow`);
            setFollowing(f => !f);
            if (res.data?.currentUser) {
                setUser(prev => ({ ...prev, following: res.data.currentUser.following }));
            }
        } catch {
            alert('Failed');
        } finally { setLoading(false); }
    };

    if (!user) return null;
    const LABEL_FOLLOW = 'Follow';
    const LABEL_FOLLOWING = 'Unfollow';
    const LABEL_LOADING = '...';
    return (
        <button
            onClick={toggle}
            disabled={loading}
            className={`text-xs tracking-wide inline-flex justify-center items-center px-4 py-2 rounded-md font-medium transition whitespace-nowrap shadow-sm ${following ? 'bg-white/80 border border-slate-300 text-slate-700 hover:bg-slate-100' : 'g-btn-primary'} disabled:opacity-60`}
        >
            {loading ? LABEL_LOADING : following ? LABEL_FOLLOWING : LABEL_FOLLOW}
        </button>
    );
}
