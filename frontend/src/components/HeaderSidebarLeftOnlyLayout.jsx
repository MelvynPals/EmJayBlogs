import React from 'react';
import Header from './Header';
import Footer from './Footer';
import SidebarLeft from './SidebarLeft';
import { Outlet } from 'react-router-dom';

// Layout with header + left sidebar only (no right sidebar) for profile pages
export default function HeaderSidebarLeftOnlyLayout() {
    return (
        <div className="min-h-screen g-bg-page flex flex-col">
            <Header />
            <div className="flex flex-1 justify-center">
                <div className="container px-6 py-3">
                    <div className="grid grid-cols-12 gap-6 py-6">
                        <aside className="hidden lg:block col-span-2">
                            <SidebarLeft />
                        </aside>
                        <main className="col-span-12 lg:col-span-10">
                            <Outlet />
                        </main>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
