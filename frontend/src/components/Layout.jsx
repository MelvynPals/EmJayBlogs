// frontend/src/components/Layout.jsx
import React from 'react';
import Header from './Header';
import Footer from './Footer';
import SidebarLeft from './SidebarLeft';
import SidebarRight from './SidebarRight';
import { Outlet } from 'react-router-dom';

export default function Layout() {
    return (
        <div className="min-h-screen g-bg-page flex flex-col">
            <Header />
            <div className="flex flex-1 justify-center">
                <div className="container px-6 py-3">
                    <div className="grid grid-cols-12 gap-6 py-6 pt-16">
                        <aside className="hidden lg:block lg:col-span-2">
                            <SidebarLeft />
                        </aside>
                        <main className="col-span-12 lg:col-span-7">
                            <Outlet />
                        </main>
                        <aside className="hidden lg:block lg:col-span-3">
                            <SidebarRight />
                        </aside>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
