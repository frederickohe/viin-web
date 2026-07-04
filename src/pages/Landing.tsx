import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Plan } from '../api/client';

const FEATURES = [
  {
    title: 'Natural conversations',
    desc: 'Ask questions, get tasks done, and manage your day in plain language.',
  },
  {
    title: 'Business-ready',
    desc: 'Email, reminders, expense tracking, and customer support — all in one assistant.',
  },
  {
    title: 'Always learning',
    desc: 'Upload documents and let Viin answer questions using your own knowledge base.',
  },
];

export function Landing() {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    api
      .getPlans()
      .then((res) => setPlans(res.plans))
      .catch(() => {});
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <p className="eyebrow">Your AI assistant, shared with the world</p>
        <h1>
          Meet <em>Viin</em>
          <br />
          intelligence that works for you
        </h1>
        <p className="hero-lead">
          Sign up in minutes and start chatting with a powerful AI assistant built for
          productivity, business, and everyday life.
        </p>
        <div className="hero-actions">
          <Link to="/signup" className="btn btn-primary btn-lg">
            Create free account
          </Link>
          <Link to="/signin" className="btn btn-outline btn-lg">
            I have an account
          </Link>
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

      {plans.length > 0 && (
        <section className="pricing">
          <h2>Plans</h2>
          <div className="pricing-grid">
            {plans.map((plan) => (
              <article key={plan.id} className="plan-card">
                <h3>{plan.name}</h3>
                <p className="plan-price">
                  {plan.price > 0 ? `GHS ${plan.price}` : 'Free'}
                  {plan.price > 0 && <span>/mo</span>}
                </p>
                {plan.description && <p className="plan-desc">{plan.description}</p>}
                <ul>
                  {plan.features.slice(0, 5).map((feat) => (
                    <li key={feat}>{feat}</li>
                  ))}
                </ul>
                <Link to="/signup" className="btn btn-outline btn-block">
                  Get started
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="cta-band">
        <h2>Ready to try Viin?</h2>
        <p>Join others using your AI assistant today.</p>
        <Link to="/signup" className="btn btn-primary btn-lg">
          Sign up free
        </Link>
      </section>
    </>
  );
}
