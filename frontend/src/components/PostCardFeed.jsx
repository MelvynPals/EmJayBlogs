// src/components/PostCardFeed.jsx
import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/authContext';
import resolveMediaUrl from '../utils/resolveMediaUrl';
import { REACTION_TYPES, FAVORITE_TYPE } from './icons/reactionConstants';
import defaultAvatar from '../assets/user-profile-default.png';
import { LikeIcon, DislikeIcon, LoveIcon, FavoriteIcon, CommentIcon } from './icons/ReactionIcons';

export default function PostCardFeed({ post: initialPost, onUnfavorite }) {
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState(initialPost);
  const myUserId = String(user?.id || user?._id || '');

  const refresh = async () => {
    try {
      const res = await api.get(`/posts/${post._id}`);
      setPost(res.data.post);
    } catch (err) {
      console.error('Failed to refresh post', err);
    }
  };

  const [hovering, setHovering] = useState(null);
  const [justClicked, setJustClicked] = useState(null);
  const [busy, setBusy] = useState(false);

  // toggle/add/replace reaction (backend handles toggle semantics)
  const react = async (type) => {
    if (!user) return alert('Login to react');
    setBusy(true);
    try {
      await api.post(`/posts/${post._id}/reaction`, { type });
      await refresh();
      setJustClicked(type);
      setTimeout(() => setJustClicked(null), 380);
    } catch (err) {
      console.error('Reaction failed', err);
      alert(err?.response?.data?.message || 'Reaction failed');
    }
    setBusy(false);
  };

  const toggleFav = async () => {
    if (!user) return alert('Login to favorite');
    setBusy(true);
    try {
      await api.post(`/posts/${post._id}/favorite`);
      await refresh();
      setJustClicked(FAVORITE_TYPE.key);
      setTimeout(() => setJustClicked(null), 380);
      if (onUnfavorite && iFavorited) onUnfavorite(post._id);
    } catch (err) {
      console.error('Favorite failed', err);
      alert('Favorite failed');
    }
    setBusy(false);
  };

  // compute counts
  const counts = { like: 0, dislike: 0, love: 0 };
  (post.reactions || []).forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });

  const commentsCount = post.commentsCount || 0;
  const favoritesCount = (post.favorites || []).length;
  const iDidReact = (type) => (post.reactions || []).some(r => String(r.user) === myUserId && r.type === type);
  const iFavorited = (post.favorites || []).some(u => String(u) === myUserId);

  return (
    <article className="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-shadow">
      {post.coverUrl && (
        <img src={resolveMediaUrl(post.coverUrl)} alt="" className="w-full h-44 object-cover rounded mb-3" />
      )}
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold pr-6">
          <Link to={`/posts/${post._id}`} className="hover:underline">{post.title}</Link>
        </h3>
        <div className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</div>
      </div>
      <p className="text-sm text-gray-700 mt-2">{post.content?.slice(0, 140)}{post.content?.length > 140 ? '…' : ''}</p>
      <div className="mt-4 text-sm text-gray-600 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[0.95rem]">
          <img src={post.author.avatarUrl ? resolveMediaUrl(post.author.avatarUrl) : defaultAvatar} alt="" className="w-7 h-7 rounded-full object-cover shadow-sm" />
          <Link to={`/users/${post.author._id}`} className="hover:underline text-gray-600">{post.author.name}</Link>
        </div>
        <div className="flex items-center w-full">
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
            <Link
              to={`/posts/${post._id}`}
              aria-label={`comments (${commentsCount})`}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/70 hover:bg-indigo-50 focus:outline-none focus:ring focus:ring-indigo-300"
            >
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
      </div>
    </article>
  );
}
