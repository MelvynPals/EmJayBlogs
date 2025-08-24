import React, { useContext, useState, useMemo } from 'react';
import { AuthContext } from '../context/authContext';
import api from '../api/axios';

export default function Settings() {
    const { user, setUser } = useContext(AuthContext);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [saving, setSaving] = useState(false);

    // Change password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changingPw, setChangingPw] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/users/me', { name, email });
            const updated = {
                ...user,
                ...res.data.user,
                id: String(res.data.user.id || res.data.user._id),
                coverUrl: res.data.user.coverUrl,
                followersCount: res.data.user.followersCount
            };
            setUser(updated);
            alert('Profile updated');
            window.location.reload();
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed');
        } finally { setSaving(false); }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        setChangingPw(true);
        try {
            await api.put('/users/me/password', { currentPassword, newPassword });
            alert('Password changed');
            setCurrentPassword('');
            setNewPassword('');
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to change password');
        } finally { setChangingPw(false); }
    };

    // derived password strength (simple heuristic)
    const pwStrength = useMemo(() => {
        if (!newPassword) return null;
        let score = 0;
        if (newPassword.length >= 8) score++;
        if (/[A-Z]/.test(newPassword)) score++;
        if (/[0-9]/.test(newPassword)) score++;
        if (/[^A-Za-z0-9]/.test(newPassword)) score++;
        const levels = ['Weak', 'Fair', 'Good', 'Strong'];
        return { score, label: levels[Math.min(score, levels.length - 1)] };
    }, [newPassword]);

    const fieldBase = 'w-full rounded-md border border-slate-300 focus:border-indigo-500 focus:ring focus:ring-indigo-300/40 bg-white/90 px-3 py-2 text-sm transition outline-none';
    const sectionClass = 'g-surface-card p-5 md:p-6 rounded-xl';
    const labelClass = 'text-xs font-semibold tracking-wide text-slate-600 uppercase';
    const groupGap = 'space-y-3';

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold g-heading-gradient mb-1">Settings</h1>
                <p className="text-sm text-slate-600">Manage your profile details & account security.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Profile section */}
                <div className={sectionClass}>
                    <form onSubmit={submit} className="flex flex-col gap-5">
                        <div>
                            <h2 className="text-lg font-semibold mb-1">Profile</h2>
                            <p className="text-xs text-slate-500">Update public information associated with your account.</p>
                        </div>
                        <div className={groupGap}>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="name" className={labelClass}>Name</label>
                                <input id="name" value={name} onChange={e => setName(e.target.value)} className={fieldBase} placeholder="Full name" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="email" className={labelClass}>Email</label>
                                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={fieldBase} placeholder="Email address" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button disabled={saving} className="g-btn-primary disabled:opacity-60 px-5 py-2 rounded font-medium text-sm shadow">
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Password section */}
                <div className={sectionClass}>
                    <form onSubmit={changePassword} className="flex flex-col gap-5">
                        <div>
                            <h2 className="text-lg font-semibold mb-1">Password</h2>
                            <p className="text-xs text-slate-500">Choose a strong password to keep your account secure.</p>
                        </div>
                        <div className={groupGap}>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="currentPw" className={labelClass}>Current Password</label>
                                <input id="currentPw" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={fieldBase} placeholder="Current password" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="newPw" className={labelClass}>New Password</label>
                                <input id="newPw" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={fieldBase} placeholder="New password" />
                                {pwStrength && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 rounded bg-slate-200 overflow-hidden">
                                            <div className={`h-full transition-all duration-300 ${pwStrength.score >= 3 ? 'bg-green-500' : pwStrength.score === 2 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${(pwStrength.score / 4) * 100}%` }} />
                                        </div>
                                        <span className="text-[10px] tracking-wide font-semibold uppercase text-slate-500">{pwStrength.label}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button disabled={changingPw} className="g-btn-emerald disabled:opacity-60 px-5 py-2 rounded font-medium text-sm shadow">
                                {changingPw ? 'Changing…' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Danger zone placeholder (future) */}
            <div className="mt-10 text-xs text-slate-400">Need to deactivate your account? Contact support.</div>
        </div>
    );
}
