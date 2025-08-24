import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/authContext';
import home from '../assets/icons/home.svg';
import homeActive from '../assets/icons/home-active.svg';
import profile from '../assets/icons/profile.svg';
import profileActive from '../assets/icons/profile-active.svg';
import favorite from '../assets/icons/favorite.svg';
import favoriteActive from '../assets/icons/favorite-active.svg';
import settings from '../assets/icons/settings.svg';
import settingsActive from '../assets/icons/settings-active.svg';
import admin from '../assets/icons/admin.svg';
import adminActive from '../assets/icons/admin-active.svg';

const NAV_ITEMS = [
    { to: '/feature', label: 'Home', icon: home, iconActive: homeActive },
    { to: '/profile', label: 'Profile', icon: profile, iconActive: profileActive },
    { to: '/favorite', label: 'Favorite', icon: favorite, iconActive: favoriteActive },
    { to: '/settings', label: 'Settings', icon: settings, iconActive: settingsActive },
];

export default function SidebarLeft() {
    const { user } = useContext(AuthContext);
    const baseLink = 'group flex items-center gap-3 px-3 py-2 rounded-xl relative transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60';

    const computeClass = (isActive) => [
        baseLink,
        isActive
            ? 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-slate-900 font-semibold shadow-sm ring-1 ring-indigo-200'
            : 'text-slate-600 hover:text-slate-800 hover:bg-white/60 hover:shadow-sm',
    ].join(' ');

    return (
        <nav className="sticky top-20">
            <div className="mb-3 ml-1 text-[10px] tracking-wider font-semibold uppercase text-slate-500/70 select-none">Navigation</div>
            <ul className="space-y-1.5">
                {NAV_ITEMS.map(item => (
                    <li key={item.to}>
                        <NavLink to={item.to} className={({ isActive }) => computeClass(isActive)} aria-label={item.label}>
                            {({ isActive }) => {
                                const IconSrc = isActive ? item.iconActive : item.icon;
                                return (
                                    <>
                                        {/* Indicator bar */}
                                        <span className={`absolute left-0 top-1 bottom-1 w-1 rounded-full transition-all ${isActive ? 'bg-indigo-400 scale-y-100' : 'bg-indigo-300/0 group-hover:bg-indigo-300/70 scale-y-50'} origin-center`} />
                                        <span className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all shadow-inner ${isActive ? 'bg-white ring-1 ring-indigo-200' : 'bg-white/70 group-hover:bg-white'} `}>
                                            <img src={IconSrc} alt="" className="w-5 h-5" aria-hidden="true" />
                                        </span>
                                        <span className="text-sm tracking-wide">{item.label}</span>
                                    </>
                                );
                            }}
                        </NavLink>
                    </li>
                ))}
                {user?.role === 'admin' && (
                    <li className="pt-3 mt-3 border-t border-slate-200/70">
                        <NavLink to="/admin" className={({ isActive }) => computeClass(isActive)} aria-label="Admin">
                            {({ isActive }) => (
                                <>
                                    <span className={`absolute left-0 top-1 bottom-1 w-1 rounded-full transition-all ${isActive ? 'bg-indigo-400 scale-y-100' : 'bg-indigo-300/0 group-hover:bg-indigo-300/70 scale-y-50'} origin-center`} />
                                    <span className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all shadow-inner ${isActive ? 'bg-white ring-1 ring-indigo-200' : 'bg-white/70 group-hover:bg-white'} `}>
                                        <img src={isActive ? adminActive : admin} alt="" className="w-5 h-5" aria-hidden="true" />
                                    </span>
                                    <span className="text-sm tracking-wide">Admin</span>
                                </>
                            )}
                        </NavLink>
                    </li>
                )}
            </ul>
        </nav>
    );
}
