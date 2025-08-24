// src/components/CreateStory.jsx
import React, { useState, useRef } from 'react';
import api from '../api/axios';

export default function CreateStory({ onNewPost }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [coverFile, setCoverFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const dropRef = useRef(null);

    const setFile = (file) => {
        setCoverFile(file || null);
        if (file) setPreview(URL.createObjectURL(file)); else setPreview('');
    };

    const onFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) setFile(file);
        dropRef.current?.classList.remove('ring-2', 'ring-indigo-400');
    };
    const onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropRef.current?.classList.add('ring-2', 'ring-indigo-400');
    };
    const onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropRef.current?.classList.remove('ring-2', 'ring-indigo-400');
    };

    const TITLE_LIMIT = 140;
    const BODY_MIN = 40;
    const titleChars = title.length;
    const bodyWords = content.trim() ? content.trim().split(/\s+/).length : 0;
    const canSubmit = title.trim() !== '' && content.trim().length >= BODY_MIN;

    const submit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            const form = new FormData();
            form.append('title', title);
            form.append('content', content);
            if (coverFile) form.append('cover', coverFile);

            const res = await api.post('/posts', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            onNewPost?.(res.data.post);
            setTitle(''); setContent(''); setCoverFile(null); setPreview('');
        } catch (err) {
            alert(err?.response?.data?.message || 'Create failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="g-surface-card p-6 rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                <h2 className='font-semibold text-2xl g-heading-gradient'>Create a Story</h2>
                <div className="text-xs text-slate-500 flex gap-4">
                    <span>{titleChars}/{TITLE_LIMIT} title chars</span>
                    <span>{bodyWords} words</span>
                </div>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-wide uppercase text-slate-600">Title</label>
                    <input value={title} maxLength={TITLE_LIMIT} onChange={(e) => setTitle(e.target.value)} placeholder="Catchy, descriptive headline" className="w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring focus:ring-indigo-300/40 bg-white/90 px-3 py-2 text-sm outline-none transition" />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                        <span>{TITLE_LIMIT - titleChars} chars left</span>
                        {titleChars > 0 && titleChars < 8 && <span className="text-amber-600">Consider a longer title</span>}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-wide uppercase text-slate-600">Body</label>
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your story..." rows={8} className="w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring focus:ring-indigo-300/40 bg-white/95 px-3 py-2 text-sm outline-none transition leading-relaxed resize-y" />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                        <span>{content.length} chars</span>
                        <span className={content.trim().length < BODY_MIN ? 'text-rose-600' : 'text-emerald-600'}>{content.trim().length < BODY_MIN ? `${BODY_MIN - content.trim().length} more chars to enable publish` : 'Ready'}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold tracking-wide uppercase text-slate-600">Cover Image (optional)</label>
                    <div
                        ref={dropRef}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        className="relative border-2 border-dashed border-slate-300 hover:border-indigo-400 transition rounded-lg p-5 flex flex-col items-center justify-center text-center bg-white/60 cursor-pointer"
                        onClick={() => dropRef.current?.querySelector('input[type=file]')?.click()}
                    >
                        <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                        {!preview && (
                            <>
                                <span className="text-sm text-slate-600">Drag & drop an image here or <span className="text-indigo-600 underline">browse</span></span>
                                <span className="mt-1 text-[10px] text-slate-400">JPG/PNG up to ~5MB</span>
                            </>
                        )}
                        {preview && (
                            <div className="w-full">
                                <img src={preview} alt="preview" className="w-full max-h-60 object-cover rounded-md shadow" />
                                <button type="button" onClick={() => setFile(null)} className="mt-2 text-[11px] text-rose-600 hover:underline">Remove</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                    <button type="submit" disabled={!canSubmit || submitting} className={`px-6 py-2 rounded font-medium text-sm shadow transition disabled:opacity-60 ${canSubmit ? 'g-btn-primary' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}>{submitting ? 'Posting…' : 'Publish'}</button>
                    <button type="button" onClick={() => { setTitle(''); setContent(''); setFile(null); }} className="px-6 py-2 rounded font-medium text-sm shadow bg-white/80 hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-600 transition">Clear</button>
                </div>
            </form>
        </div>
    );
}
