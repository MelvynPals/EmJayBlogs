// src/pages/PostView.jsx
import React, { useEffect, useState, useContext, useMemo } from 'react';
import resolveMediaUrl from '../utils/resolveMediaUrl';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/authContext';
import { LikeIcon, DislikeIcon, LoveIcon, FavoriteIcon, CommentIcon } from '../components/icons/ReactionIcons';
import { REACTION_TYPES, FAVORITE_TYPE } from '../components/icons/reactionConstants';

function buildTree(flat) {
    const map = {}; flat.forEach(c => map[c._id] = { ...c, children: [] });
    const roots = [];
    flat.forEach(c => {
        if (c.parentComment) {
            if (map[c.parentComment]) map[c.parentComment].children.push(map[c._id]);
        } else {
            roots.push(map[c._id]);
        }
    });
    return roots;
}

export default function PostView() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    // comments
    // comments state no longer directly used; tree holds structured comments
    const [/*comments*/, setComments] = useState([]);
    const [tree, setTree] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api.get(`/posts/${id}`);
                if (mounted) setPost(res.data.post);
            } catch (err) { console.error(err); }
            finally { if (mounted) setLoading(false); }
        })();
        return () => { mounted = false; };
    }, [id]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api.get(`/comments/post/${id}`);
                if (mounted) {
                    setComments(res.data.comments || []);
                    setTree(buildTree(res.data.comments || []));
                }
            } catch (err) { console.error(err); }
        })();
        return () => { mounted = false; };
    }, [id]);

    const postComment = async (parentId = null) => {
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            const payload = { postId: id, content: newComment.trim(), parentCommentId: parentId };
            await api.post('/comments', payload);
            // refresh comments
            const res = await api.get(`/comments/post/${id}`);
            setComments(res.data.comments || []);
            setTree(buildTree(res.data.comments || []));
            setNewComment('');
        } catch (err) {
            alert(err?.response?.data?.message || 'Comment failed');
        }
        setSubmitting(false);
    };

    const wordCount = useMemo(() => (post?.content || '').trim().split(/\s+/).filter(Boolean).length, [post?.content]);
    const readMins = Math.max(1, Math.round((wordCount || 0) / 200));
    const created = post ? new Date(post.createdAt) : null;

    if (loading) return <div className="p-6">Loading…</div>;
    if (!post) return <div className="p-6">Post not found</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-2">
            <div className="mb-4 flex items-center justify-between text-xs">
                <Link to="/feature" className="text-indigo-600 hover:underline">← Back</Link>
            </div>

            {/* Hero / cover */}
            {post.coverUrl ? (
                <div className="relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5 mb-10">
                    <img src={resolveMediaUrl(post.coverUrl)} alt="cover" className="w-full h-[340px] object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight drop-shadow g-heading-gradient" style={{ WebkitTextFillColor: 'unset' }}>{post.title}</h1>
                        <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-200 font-medium">
                            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur shadow-sm">By {post.author?.name || 'Unknown'}</span>
                            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur shadow-sm">{created.toLocaleDateString()} • {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur shadow-sm">{wordCount} words</span>
                            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur shadow-sm">{readMins} min read</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold g-heading-gradient leading-tight">{post.title}</h1>
                    <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-600 font-medium">
                        <span className="px-3 py-1 rounded-full bg-white/70 shadow-sm border border-slate-200">By {post.author?.name}</span>
                        <span className="px-3 py-1 rounded-full bg-white/70 shadow-sm border border-slate-200">{created.toLocaleDateString()} • {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="px-3 py-1 rounded-full bg-white/70 shadow-sm border border-slate-200">{wordCount} words</span>
                        <span className="px-3 py-1 rounded-full bg-white/70 shadow-sm border border-slate-200">{readMins} min read</span>
                    </div>
                </div>
            )}

            {/* Reactions & favorite bar */}
            <div className="mb-8">
                <PostReactionsBar post={post} onUpdate={setPost} />
            </div>

            {/* Article content card */}
            <article className="g-surface-card p-6 md:p-8 rounded-2xl prose max-w-none mb-12 leading-relaxed">
                {post.content.split('\n').map((p, i) => (
                    <p key={i} className={i === 0 ? 'first:before:content-["*"] first:before:hidden' : ''}>{p}</p>
                ))}
            </article>

            {/* Comments block */}
            <section id="comments" className="scroll-mt-24">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold g-heading-gradient">Comments</h3>
                    <div className="h-px flex-1 ml-6 bg-gradient-to-r from-slate-300/40 to-transparent" />
                </div>

                {/* top-level comment form */}
                {user ? (
                    <form onSubmit={e => { e.preventDefault(); postComment(null); }} className="mb-8 g-surface-card p-4 rounded-xl shadow-sm space-y-3">
                        <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." className="w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring focus:ring-indigo-300/40 bg-white/90 px-3 py-2 text-sm outline-none resize-y" rows={3} />
                        <div className="flex items-center gap-3">
                            <button type="submit" disabled={!newComment.trim() || submitting} className="px-5 py-2 rounded g-btn-primary disabled:opacity-60 text-sm font-medium shadow">
                                {submitting ? 'Posting…' : 'Post Comment'}
                            </button>
                            {newComment && (
                                <button type="button" onClick={() => setNewComment('')} className="text-xs text-slate-500 hover:text-rose-600 transition">Clear</button>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="mb-6 text-sm text-gray-600">Log in to comment.</div>
                )}

                {/* nested comments */}
                <div className="space-y-4">
                    {tree.map(node => <CommentNode key={node._id} node={node} postId={id} onPosted={() => {
                        // refresh comments after reply (simple approach)
                        api.get(`/comments/post/${id}`).then(res => {
                            setComments(res.data.comments || []);
                            setTree(buildTree(res.data.comments || []));
                        });
                    }} />)}
                </div>
            </section>
        </div>
    );
}

function CommentNode({ node, postId, onPosted, setComments, setTree }) {
    const { user } = React.useContext(AuthContext);
    const [showReply, setShowReply] = React.useState(false);
    const [replyText, setReplyText] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const submitReply = async () => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            await api.post('/comments', { postId, content: replyText.trim(), parentCommentId: node._id });
            setReplyText(''); setShowReply(false);
            onPosted?.();
        } catch { alert('Reply failed'); }
        setSubmitting(false);
    };

    const deleteComment = async () => {
        if (!confirm('Delete this comment?')) return;
        try {
            await api.delete(`/comments/${node._id}`);
            // simplified: force full reload for consistent state
            window.location.reload();
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to delete');
        }
    };


    return (
        <div className="space-y-2">
            <div className="g-surface-card rounded-xl p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-700">{node.author?.name}</span>
                            <span className="text-[10px] uppercase tracking-wide text-slate-400">{new Date(node.createdAt).toLocaleDateString()} • {new Date(node.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-sm text-slate-600 mt-1 whitespace-pre-wrap break-words">{node.content}</div>
                        <div className="mt-3 flex items-center gap-4">
                            <button className="text-xs font-medium text-indigo-600 hover:underline" onClick={() => setShowReply(s => !s)}>Reply</button>
                            {user && String(user.id || user._id) === String(node.author._id || node.author._id) && (
                                <button onClick={deleteComment} className="text-xs font-medium text-rose-600 hover:underline">Delete</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showReply && (
                <div className="ml-4">
                    <div className="g-surface-card p-3 rounded-lg mt-1 space-y-2">
                        <textarea rows={2} value={replyText} onChange={e => setReplyText(e.target.value)} className="w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring focus:ring-indigo-300/40 bg-white/95 px-3 py-2 text-sm outline-none resize-y" placeholder="Write reply..." />
                        <div className="flex items-center gap-3">
                            <button onClick={submitReply} disabled={!replyText.trim() || submitting} className="px-4 py-1.5 rounded g-btn-primary disabled:opacity-60 text-xs font-medium">{submitting ? 'Replying…' : 'Reply'}</button>
                            <button onClick={() => { setShowReply(false); setReplyText(''); }} className="text-xs text-slate-500 hover:text-rose-600 transition">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {node.children && node.children.length > 0 && (
                <div className="pl-6 mt-3 space-y-3">
                    {node.children.map(child => <CommentNode key={child._id} node={child} postId={postId} onPosted={onPosted} setComments={setComments} setTree={setTree} />)}
                </div>
            )}
        </div>
    );
}

function PostReactionsBar({ post, onUpdate }) {
    const { user } = useContext(AuthContext);
    const myUserId = String(user?.id || user?._id || '');
    const [busy, setBusy] = useState(false);
    const [hovering, setHovering] = useState(null);
    const [justClicked, setJustClicked] = useState(null); // for pop animation
    const btnBase = 'relative flex items-center gap-1 px-2 py-1 rounded-md transition-all select-none focus:outline-none';

    const refresh = async () => {
        try {
            const res = await api.get(`/posts/${post._id}`);
            onUpdate(res.data.post);
        } catch {/* ignore */ }
    };

    const react = async (type) => {
        if (!user) return alert('Login to react');
        setBusy(true);
        try { await api.post(`/posts/${post._id}/reaction`, { type }); await refresh(); } finally { setBusy(false); }
    };
    const toggleFav = async () => {
        if (!user) return alert('Login to favorite');
        setBusy(true);
        try { await api.post(`/posts/${post._id}/favorite`); await refresh(); } finally { setBusy(false); }
    };

    const handleReact = async (type) => {
        await react(type);
        setJustClicked(type);
        setTimeout(() => setJustClicked(null), 380);
    };
    const handleFav = async () => {
        await toggleFav();
        setJustClicked(FAVORITE_TYPE.key);
        setTimeout(() => setJustClicked(null), 380);
    };

    const counts = { like: 0, dislike: 0, love: 0 };
    (post.reactions || []).forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
    const commentsCount = post.commentsCount || 0; // may have been included earlier
    const iDidReact = (type) => (post.reactions || []).some(r => String(r.user) === myUserId && r.type === type);
    const iFavorited = (post.favorites || []).some(f => String(f) === myUserId);
    const favoritesCount = (post.favorites || []).length;

    return (
        <div className="mt-8 border-t pt-4">
            <div className="flex items-center flex-wrap gap-4 text-sm">
                {REACTION_TYPES.map((item) => {
                    const { key, Icon } = item;
                    const active = iDidReact(key);
                    const preview = hovering === key && !active;
                    return (
                        <button
                            key={key}
                            disabled={busy}
                            onMouseEnter={() => setHovering(key)}
                            onMouseLeave={() => setHovering(null)}
                            onClick={() => handleReact(key)}
                            className={`${btnBase} ${active ? 'bg-indigo-50 ring-1 ring-indigo-300' : 'bg-white/70 hover:bg-indigo-50'} ${preview ? 'scale-[1.07]' : 'scale-100'} ${busy ? 'opacity-60' : ''} ${justClicked === key ? 'animate-reaction-pop' : ''}`}
                            style={{ transformOrigin: 'center' }}
                        >
                            <span className={`transition-transform ${active ? 'scale-110' : 'group-active:scale-90'}`}>
                                <Icon active={active} preview={preview} />
                            </span>
                            <span className={`min-w-[1.25rem] text-xs font-medium ${active ? 'text-indigo-600' : 'text-gray-600'}`}>{counts[key]}</span>
                        </button>
                    );
                })}
                <a href="#comments" className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/70 hover:bg-indigo-50">
                    <CommentIcon />
                    <span className="min-w-[1.25rem] text-xs font-medium text-indigo-600">{commentsCount}</span>
                </a>
                <div className="ml-auto">
                    <button
                        disabled={busy}
                        onMouseEnter={() => setHovering(FAVORITE_TYPE.key)}
                        onMouseLeave={() => setHovering(null)}
                        onClick={handleFav}
                        className={`${btnBase} ${iFavorited ? 'bg-yellow-50 ring-1 ring-yellow-300' : 'bg-white/70 hover:bg-yellow-50'} ${hovering === FAVORITE_TYPE.key && !iFavorited ? 'scale-[1.07]' : 'scale-100'} ${busy ? 'opacity-60' : ''} ${justClicked === FAVORITE_TYPE.key ? 'animate-reaction-pop' : ''}`}
                    >
                        <FavoriteIcon active={iFavorited} preview={hovering === FAVORITE_TYPE.key && !iFavorited} />
                        <span className={`min-w-[1.25rem] text-xs font-medium ${iFavorited ? 'text-yellow-600' : 'text-gray-600'}`}>{favoritesCount}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}