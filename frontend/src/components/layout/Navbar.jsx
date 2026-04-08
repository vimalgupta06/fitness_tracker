import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { logoutUser } from '@/api/auth';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      logout();
      toast.success('Logged out');
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">FitTrack</Link>
      <div className="navbar-links">
        {user && (
          <>
            <span>Hello, {user.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
