import React from 'react';
import { Link } from 'react-router-dom';
import resolveMediaUrl from '../utils/resolveMediaUrl';
import { LikeIcon, DislikeIcon, LoveIcon, FavoriteIcon, CommentIcon } from './icons/ReactionIcons';

// Non-interactive featured post card (no reaction/favorite clicks)
export default function FeaturedPostCard({ post }) {
    const counts = { like: 0, dislike: 0, love: 0 };
    (post.reactions || []).forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
    const favoritesCount = (post.favorites || []).length;
    const commentsCount = post.commentsCount || 0;
    const normalize = (txt = '') => txt.replace(/\s+/g, ' ').trim();
    const TITLE_MAX_CHARS = 120;
    const BODY_MAX_CHARS = 260;
    const fullTitle = normalize(post.title || '');
    const fullBody = normalize(post.content || '');
    const truncatedTitle = fullTitle.length > TITLE_MAX_CHARS ? fullTitle.slice(0, TITLE_MAX_CHARS) + '…' : fullTitle;
    const truncatedBody = fullBody.length > BODY_MAX_CHARS ? fullBody.slice(0, BODY_MAX_CHARS) + '…' : fullBody;
    return (
        <article className="bg-white rounded p-4 shadow-sm hover:shadow-lg transition-shadow opacity-95 flex flex-col h-full">
            {post.coverUrl && <img src={resolveMediaUrl(post.coverUrl)} alt="" className="w-full h-40 object-cover rounded mb-3" />}
            <div className="flex justify-between items-start gap-3">
                <h3 className="text-lg font-semibold leading-snug flex-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    <Link to={`/posts/${post._id}`} className="hover:underline">{truncatedTitle}</Link>
                </h3>
                <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">{new Date(post.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="text-sm text-gray-700 mt-2 flex-1" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{truncatedBody}</div>
            <div className="mt-4 text-xs text-gray-600 flex flex-col gap-2 select-none">
                <div>By <Link to={`/users/${post.author._id}`} className="font-medium hover:underline">{post.author.name}</Link></div>
                <div className="flex items-center w-full">
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="flex items-center gap-1"><LikeIcon active={true} preview={false} /><span className="text-gray-700">{counts.like}</span></span>
                        <span className="flex items-center gap-1"><DislikeIcon active={true} preview={false} /><span className="text-gray-700">{counts.dislike}</span></span>
                        <span className="flex items-center gap-1"><LoveIcon active={true} preview={false} /><span className="text-gray-700">{counts.love}</span></span>
                        <span className="flex items-center gap-1"><CommentIcon /><span className="text-indigo-600">{commentsCount}</span></span>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-[11px]">
                        <FavoriteIcon active={true} preview={false} />
                        <span className={favoritesCount > 0 ? 'text-yellow-600' : 'text-yellow-600'}>{favoritesCount}</span>
                    </div>
                </div>
            </div>
        </article>
    );
}
