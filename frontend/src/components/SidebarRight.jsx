import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/authContext';
import api from '../api/axios';
import resolveMediaUrl from '../utils/resolveMediaUrl';
import defaultAvatar from '../assets/user-profile-default.png';

export default function SidebarRight() {
    const { user } = useContext(AuthContext);
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api.get('/users/suggestions');
                if (mounted) setSuggestions(res.data.suggestions || []);
            } catch {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, [user?.id]);

    if (!user) return null;

    return (
        <div className="sticky top-20 space-y-4">
            <div className="bg-white shadow-sm g-surface-card p-4 ">
                <div className="flex items-center gap-3">
                    <img src={user.avatarUrl ? resolveMediaUrl(user.avatarUrl) : defaultAvatar} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                    <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-gray-500">@{(user.email || '').split('@')[0]}</div>
                        {/* Removed title */}
                    </div>
                </div>
                <div className="mt-3 text-sm">
                    Followers: <strong>{user.followersCount ?? (user.followers ? user.followers.length : 0)}</strong>
                </div>
                <Link to={`/profile`} className="block mt-3 text-sm text-blue-600 hover:underline">View profile</Link>
                <Link to="/settings" className="block mt-1 text-sm text-gray-600 hover:underline">Settings</Link>
            </div>

            <div className="bg-white shadow-sm g-surface-card p-4">
                <h3 className="font-semibold mb-2">Who to follow</h3>
                {suggestions.length === 0 ? (
                    <div className="text-sm text-gray-500">No suggestions</div>
                ) : (
                    <ul className="space-y-3">
                        {suggestions.map(s => {
                            const rawName = s.name || 'Unknown';
                            const MAX_CHARS = 18; // adjust as needed
                            const truncated = rawName.length > MAX_CHARS ? rawName.slice(0, MAX_CHARS - 1) + '…' : rawName;
                            return (
                                <li key={s._id} className="flex items-center justify-between max-[1280px]:flex-col max-[1280px]:gap-4 max-[1280px]:mb-8 max-[1280px]:items-start">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img src={s.avatarUrl ? resolveMediaUrl(s.avatarUrl) : defaultAvatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                                        <div className="min-w-0">
                                            <Link
                                                to={`/users/${s._id}`}
                                                title={rawName}
                                                className="font-medium hover:underline block max-w-[100px] max-[1200px]:max-w-[150px] truncate"
                                            >
                                                {truncated}
                                            </Link>
                                            {(typeof s.mutualCount === 'number' && s.mutualCount > 0) ? (
                                                <div className="text-[11px] text-gray-500 mt-0.5">
                                                    {s.mutualCount} mutual{s.mutualCount !== 1 ? 's' : ''}
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-gray-400 mt-0.5">{s.followersCount ?? 0} followers</div>
                                            )}
                                        </div>
                                    </div>
                                    <FollowButton userId={s._id} />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

// Minimal inline FollowButton
function FollowButton({ userId }) {
    const { user, setUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        if (user && Array.isArray(user.following)) {
            setFollowing(user.following.some(f => String(f) === String(userId) || (f?._id && String(f._id) === String(userId))));
        } else {
            setFollowing(false);
        }
    }, [user, user?.following, userId]);

    const toggle = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.post(`/users/${userId}/follow`);
            setFollowing(f => !f);
            // update current user following list from response
            if (res.data?.currentUser) {
                setUser(prev => ({ ...prev, following: res.data.currentUser.following }));
            }
        } catch {
            alert('Failed');
        } finally { setLoading(false); }
    };

    if (!user || String(user.id || user._id) === String(userId)) return null;

    // fixed width so label swap doesn't shift layout
    const LABEL_FOLLOW = 'Follow';
    const LABEL_FOLLOWING = 'Unfollow';
    const LABEL_LOADING = '...';
    // determine widest label (use following) to set width via ch units
    const fixedWidthClass = 'w-24'; // ~ fits "Following" comfortably
    return (
        <button
            onClick={toggle}
            disabled={loading}
            className={`text-sm ${fixedWidthClass} justify-center inline-flex items-center px-3 py-1 rounded border transition-colors whitespace-nowrap ${following ? 'bg-gray-200 text-gray-800' : 'g-btn-primary'} disabled:opacity-60`}
        >
            {loading ? LABEL_LOADING : following ? LABEL_FOLLOWING : LABEL_FOLLOW}
        </button>
    );
}
