import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasService } from '../lib/services';

export function Layout({ children }: { children: React.ReactNode }) {
  const { token, user, signOut } = useAuth();
  const location = useLocation();
  const isChat = location.pathname === '/chat';
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isTradingMarketing = location.pathname === '/trading';
  const showChat = !token || hasService(user, 'assistant');

  return (
    <div className={`app-shell${isChat ? ' app-shell--chat' : ''}${isDashboard ? ' app-shell--dashboard' : ''}`}>
      <header className="site-header">
        <Link to="/" className="brand">
          <img src="/viin-logo.png" alt="" className="brand-mark" width={28} height={28} />
          <span className="brand-name">Viin</span>
        </Link>
        <nav className="site-nav">
          {token ? (
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              {showChat && (
                <Link to="/chat" className="nav-link">
                  Chat
                </Link>
              )}
              <span className="nav-user">{user?.fullname?.split(' ')[0]}</span>
              <button type="button" className="btn btn-ghost" onClick={() => signOut()}>
                Sign out
              </button>
            </>
          ) : (
            <>
              {!isTradingMarketing && (
                <Link to="/trading" className="nav-link">
                  Trading Bot
                </Link>
              )}
              <Link to="/signin" className="nav-link">
                Sign in
              </Link>
              <Link
                to={isTradingMarketing ? '/signup?service=trading' : '/signup?service=assistant'}
                className="btn btn-primary btn-sm"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="site-main">{children}</main>
      {!isChat && !isDashboard && (
        <footer className="site-footer">
          <p>© {new Date().getFullYear()} Viin · task.viin.app</p>
        </footer>
      )}
    </div>
  );
}
