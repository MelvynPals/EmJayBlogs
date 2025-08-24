import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import { useContext } from 'react';
import { AuthContext } from '../context/authContext';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 z-50 w-full flex justify-center bg-white/80 backdrop-blur-md shadow-sm g-radial-overlay-dark">
      <nav className="container px-6 py-3 flex justify-between items-center">
        {/* Logo / Title */}
        <Link
          to="/"
          className="cursor-pointer"
        >
          <span className="text-2xl font-bold g-logo-heading">EmJayBlogs</span>
        </Link>

        {/* Nav Buttons */}
        <div className="flex items-center space-x-2">
          <div className="cursor-pointer">
            <Link to="/search" className="flex gap-2 items-center text-gray-600 hover:text-gray-900 mr-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search
            </Link>
          </div>

          {user ? (
            // ✅ Logged-in buttons
            <>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-full g-btn-neutral text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            // ❌ Logged-out buttons
            <>
              <Link to="/login" className="px-5 py-2 rounded-full g-btn-white text-sm font-medium">
                Login
              </Link>

              <Link
                to="/signup"
                className="px-5 py-2 rounded-full g-btn-emerald text-sm font-medium"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
