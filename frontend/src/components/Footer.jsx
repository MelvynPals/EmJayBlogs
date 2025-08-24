import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="bg-gray-900 text-gray-300!">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
                <div className="grid md:grid-cols-4 gap-10">
                    <div>
                        <h3 className="text-lg font-semibold text-white! mb-3">EmJayBlogs</h3>
                        <p className="text-sm leading-relaxed text-gray-300!">Stories, ideas, and perspectives shared by the community. Stay curious and keep writing.</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400! mb-3">Explore</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/feature" className="hover:text-white">Featured</Link></li>
                            <li><Link to="/search" className="hover:text-white">Search</Link></li>
                            <li><Link to="/favorite" className="hover:text-white">Favorites</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400! mb-3">Account</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/profile" className="hover:text-white">Profile</Link></li>
                            <li><Link to="/settings" className="hover:text-white">Settings</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400! mb-3">Connect</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="https://github.com/MelvynPals" target="_blank" rel="noopener noreferrer" className="hover:text-white">GitHub</a></li>
                            <li><a href="mailto:melvynpaleguin18@gmail.com" className="hover:text-white">Email</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row items-center gap-4 text-xs text-gray-500">
                    <div>&copy; {year} EmJayBlogs. All rights reserved.</div>
                </div>
            </div>
        </footer>
    );
}
