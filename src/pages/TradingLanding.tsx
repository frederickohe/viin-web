import { Link } from 'react-router-dom';

const FEATURES = [
  {
    title: 'AI-guided trades',
    desc: 'Describe your strategy in plain language. The bot watches markets and executes within your rules.',
  },
  {
    title: 'Live equities watchlist',
    desc: 'Add symbols, toggle bots per equity, and monitor bars without leaving Viin.',
  },
  {
    title: 'Same Viin account',
    desc: 'Sign up once — Trading Bot is a separate service on the same secure account.',
  },
];

export function TradingLanding() {
  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-panel">
          <p className="eyebrow">Viin Trading Bot</p>
          <h1>
            Trade with a
            <br />
            <em>calm</em> co-pilot
          </h1>
          <p className="hero-lead">
            A dedicated trading service on Viin — monitor equities, chat with your bot, and stay in
            control of every start and stop.
          </p>
          <div className="hero-actions">
            <Link to="/signup?service=trading" className="btn btn-primary btn-lg">
              Sign up for Trading Bot
            </Link>
            <Link to="/signin?service=trading" className="btn btn-outline btn-lg">
              I have an account
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
        {FEATURES.map((f) => (
          <article key={f.title} className="feature-card">
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </article>
        ))}
      </section>

      <section className="cta-band">
        <h2>Also need a task assistant?</h2>
        <p>Viin Task Assistant runs on the same account — pick what you need when you sign up.</p>
        <Link to="/signup?service=assistant" className="btn btn-outline btn-lg">
          Explore Task Assistant
        </Link>
      </section>
    </>
  );
}
