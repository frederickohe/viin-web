import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { token, user, signOut } = useAuth();
  const location = useLocation();
  const isChat = location.pathname === '/chat';

  return (
    <div className={`app-shell ${isChat ? 'app-shell--chat' : ''}`}>
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark">V</span>
          <span className="brand-name">Viin</span>
        </Link>
        <nav className="site-nav">
          {token ? (
            <>
              <Link to="/chat" className="nav-link">
                Assistant
              </Link>
              <span className="nav-user">{user?.fullname?.split(' ')[0]}</span>
              <button type="button" className="btn btn-ghost" onClick={() => signOut()}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="nav-link">
                Sign in
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="site-main">{children}</main>
      {!isChat && (
        <footer className="site-footer">
          <p>© {new Date().getFullYear()} Viin · viin.app</p>
        </footer>
      )}
    </div>
  );
}
