import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HeaderOnlyLayout from './components/HeaderOnlyLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Feature from './pages/Feature';
import UserProfile from './pages/UserProfile';
import PostView from './pages/PostView';
import Search from './pages/Search';
import Settings from './pages/Settings';
import EditPost from './pages/EditPost';
import AdminDashboard from './pages/AdminDashboard';
import Favorites from './pages/Favorites';
import Layout from './components/Layout';
import HeaderSidebarLeftOnlyLayout from './components/HeaderSidebarLeftOnlyLayout';
import { AuthContext } from './context/authContext';

export default function App() {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading…</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Login & Signup: header only (no sidebars) */}
        <Route element={<HeaderOnlyLayout />}>
          <Route path="/" element={user ? <Navigate to="/feature" /> : <Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Profile routes: header + left sidebar only */}
        <Route element={<HeaderSidebarLeftOnlyLayout />}>
          <Route path="/profile" element={user ? <UserProfile isSelfRoute={true} /> : <Navigate to="/login" />} />
          <Route path="/users/:id" element={user ? <UserProfile /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/login" />} />
        </Route>

        {/* Remaining app routes with full sidebars */}
        <Route element={<Layout />}>
          <Route path="/feature" element={<Feature />} />
          <Route path="/favorite" element={user ? <Favorites /> : <Navigate to="/login" />} />
          <Route path="/search" element={<Search />} />
          <Route path="/posts/:id" element={<PostView />} />
          <Route path="/posts/edit/:id" element={user ? <EditPost /> : <Navigate to="/login" />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback: redirect unknown routes to feature or landing */}
        <Route path="*" element={<Navigate to={user ? "/feature" : "/"} />} />
      </Routes>
    </BrowserRouter>
  );
}
