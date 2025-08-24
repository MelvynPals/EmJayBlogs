import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import resolveMediaUrl from '../utils/resolveMediaUrl';
import api from '../api/axios';
import { AuthContext } from '../context/authContext';
import defaultAvatar from '../assets/user-profile-default.png';
import { REACTION_TYPES, FAVORITE_TYPE } from './icons/reactionConstants';
import { LikeIcon, DislikeIcon, LoveIcon, FavoriteIcon, CommentIcon } from './icons/ReactionIcons';

export default function PostCardProfile({ post: initialPost, onDelete, canEdit = true }) {
    const { user } = useContext(AuthContext);
    const myUserId = String(user?.id || user?._id || '');
    const [post, setPost] = useState(initialPost);

    const refresh = async () => {
        try {
            const res = await api.get(`/posts/${post._id}`);
            setPost(res.data.post);
        } catch { /* ignore */ }
    };

    const [hovering, setHovering] = useState(null);
    const [justClicked, setJustClicked] = useState(null);
    const [busy, setBusy] = useState(false);

    const react = async (type) => {
        if (!user) return alert('Login to react');
        setBusy(true);
        try { await api.post(`/posts/${post._id}/reaction`, { type }); await refresh(); setJustClicked(type); setTimeout(() => setJustClicked(null), 380); } catch { /* ignore */ }
        setBusy(false);
    };
    const toggleFav = async () => {
        if (!user) return alert('Login to favorite');
        setBusy(true);
        try { await api.post(`/posts/${post._id}/favorite`); await refresh(); setJustClicked(FAVORITE_TYPE.key); setTimeout(() => setJustClicked(null), 380); } catch { /* ignore */ }
        setBusy(false);
    };

    const counts = { like: 0, dislike: 0, love: 0 };
    (post.reactions || []).forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
    const iDidReact = (type) => (post.reactions || []).some(r => String(r.user) === myUserId && r.type === type);
    const iFavorited = (post.favorites || []).some(f => String(f) === myUserId);
    const favoritesCount = (post.favorites || []).length;
    const commentsCount = post.commentsCount || 0;

    // Robust truncation (avoid relying on tailwind line-clamp plugin availability)
    const normalize = (txt = '') => txt.replace(/\s+/g, ' ').trim();
    const TITLE_MAX_CHARS = 120;
    const BODY_MAX_CHARS = 320; // fallback hard limit
    const fullTitle = normalize(post.title || '');
    const fullBody = normalize(post.content || '');
    const truncatedTitle = fullTitle.length > TITLE_MAX_CHARS ? fullTitle.slice(0, TITLE_MAX_CHARS) + '…' : fullTitle;
    const truncatedBody = fullBody.length > BODY_MAX_CHARS ? fullBody.slice(0, BODY_MAX_CHARS) + '…' : fullBody;

    return (
        <article className="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-shadow flex flex-col h-full">
            {post.coverUrl && <img src={resolveMediaUrl(post.coverUrl)} alt="" className="w-full h-44 object-cover rounded mb-3" />}
            <div className="flex justify-between gap-3">
                <Link to={`/posts/${post._id}`} className="text-xl font-semibold hover:underline flex-1 leading-snug" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{truncatedTitle}</Link>
                <div className="text-xs text-gray-500 whitespace-nowrap">{new Date(post.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="text-sm text-gray-700 mt-2 flex-1" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{truncatedBody}</div>

            {/* footer pinned bottom */}
            <div className="mt-4 w-full flex flex-col text-sm text-gray-600">
                <div className="flex items-center w-full">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Author section updated (remove bold, slightly larger, keep neutral gray) */}
                        <span className="flex items-center gap-2 text-[0.9rem] text-gray-600">
                            <img src={post.author?.avatarUrl ? resolveMediaUrl(post.author.avatarUrl) : defaultAvatar} alt="" className="w-6 h-6 rounded-full object-cover shadow-sm" />
                            <Link to={`/users/${post.author?._id || post.author}`} className="hover:underline text-gray-600 tracking-tight">{post.author?.name || 'Author'}</Link>
                        </span>
                    </div>
                </div>
                <div className="flex items-center w-full mt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        {REACTION_TYPES.map((item) => {
                            const { key, Icon } = item;
                            const active = iDidReact(key);
                            const preview = hovering === key && !active;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    aria-label={`${key} (${counts[key]})`}
                                    disabled={busy}
                                    onMouseEnter={() => setHovering(key)}
                                    onMouseLeave={() => setHovering(null)}
                                    onClick={() => react(key)}
                                    className={`relative flex items-center gap-1 px-2 py-1 rounded-md transition-all bg-white/70 hover:bg-indigo-50 focus:outline-none focus:ring focus:ring-indigo-300 ${active ? 'ring-1 ring-indigo-300' : ''} ${(preview) ? 'scale-[1.07]' : 'scale-100'} ${busy ? 'opacity-60' : ''} ${justClicked === key ? 'animate-reaction-pop' : ''}`}
                                    style={{ transformOrigin: 'center' }}
                                >
                                    <Icon active={active} preview={preview} />
                                    <span className={`min-w-[1.1rem] text-[11px] font-medium ${active ? 'text-indigo-600' : 'text-gray-600'}`}>{counts[key]}</span>
                                </button>
                            );
                        })}
                        <Link to={`/posts/${post._id}`} aria-label={`comments (${commentsCount})`} className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/70 hover:bg-indigo-50 focus:outline-none focus:ring focus:ring-indigo-300">
                            <CommentIcon />
                            <span className="min-w-[1.1rem] text-[11px] font-medium text-indigo-600">{commentsCount}</span>
                        </Link>
                    </div>
                    <div className="ml-auto">
                        <button
                            type="button"
                            aria-label={`favorite (${favoritesCount})`}
                            disabled={busy}
                            onMouseEnter={() => setHovering(FAVORITE_TYPE.key)}
                            onMouseLeave={() => setHovering(null)}
                            onClick={toggleFav}
                            className={`relative flex items-center gap-1 px-2 py-1 rounded-md transition-all bg-white/70 hover:bg-yellow-50 focus:outline-none focus:ring focus:ring-yellow-300 ${iFavorited ? 'ring-1 ring-yellow-300' : ''} ${(hovering === FAVORITE_TYPE.key && !iFavorited) ? 'scale-[1.07]' : 'scale-100'} ${busy ? 'opacity-60' : ''} ${justClicked === FAVORITE_TYPE.key ? 'animate-reaction-pop' : ''}`}
                        >
                            <FavoriteIcon active={iFavorited} preview={hovering === FAVORITE_TYPE.key && !iFavorited} />
                            <span className={`min-w-[1.1rem] text-[11px] font-medium ${iFavorited ? 'text-yellow-600' : 'text-gray-600'}`}>{favoritesCount}</span>
                        </button>
                    </div>
                </div>
                {canEdit && (
                    <div className="mt-2 pt-2 border-t flex gap-4">
                        <Link className="text-xs text-blue-600 cursor-pointer" to={`/posts/edit/${post._id}`}>Edit</Link>
                        <button className="text-xs text-red-600 cursor-pointer" onClick={() => onDelete?.(post._id)}>Delete</button>
                    </div>
                )}
            </div>
        </article>
    );
}
