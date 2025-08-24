import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import resolveMediaUrl from '../utils/resolveMediaUrl';

export default function EditPost() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [newCover, setNewCover] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api.get(`/posts/${id}`);
                if (!mounted) return;
                const p = res.data.post;
                setTitle(p.title || '');
                setContent(p.content || '');
                setCoverUrl(p.coverUrl || '');
            } catch {
                alert('Post not found');
                navigate('/feature');
            } finally { if (mounted) setLoading(false); }
        })();
        return () => { mounted = false; };
    }, [id, navigate]);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const form = new FormData();
            form.append('title', title);
            form.append('content', content);
            if (newCover) form.append('cover', newCover);
            else form.append('coverUrl', coverUrl || '');
            const res = await api.put(`/posts/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            navigate(`/posts/${res.data.post._id}`);
        } catch (err) {
            alert(err?.response?.data?.message || 'Save failed');
        } finally { setSaving(false); }
    };

    const removeCover = () => { setCoverUrl(''); setNewCover(null); };

    if (loading) return <div className="p-6">Loading…</div>;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Edit Post</h1>
            <form onSubmit={save} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Content</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full border rounded px-3 py-2" rows={10} required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Cover Image</label>
                    {(newCover || coverUrl) ? (
                        <div className="mb-2">
                            {newCover ? (
                                <img src={URL.createObjectURL(newCover)} alt="preview" className="w-full h-48 object-cover rounded" />
                            ) : coverUrl ? (
                                <img src={resolveMediaUrl(coverUrl)} alt="cover" className="w-full h-48 object-cover rounded" />
                            ) : null}
                        </div>
                    ) : null}
                    <div className="flex gap-3">
                        <input type="file" accept="image/*" onChange={e => setNewCover(e.target.files[0])} />
                        {(newCover || coverUrl) && <button type="button" onClick={removeCover} className="text-sm text-red-600">Remove</button>}
                    </div>
                </div>
                <div className="pt-2">
                    <button disabled={saving} className="px-5 py-2 rounded g-btn-primary disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
                </div>
            </form>
        </div>
    );
}