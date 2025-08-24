import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';

export default function HeaderOnlyLayout() {
    return (
        <div className="min-h-screen g-bg-page flex flex-col">
            <Header />
            <main className="w-full flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
