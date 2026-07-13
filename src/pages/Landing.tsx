import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Plan } from '../api/client';

const FEATURES = [
  {
    title: 'Tasks & reminders',
    desc: 'Tell Viin what needs doing — deadlines, recurring reminders, and open todo lists, all in plain language.',
  },
  {
    title: 'Daily briefings',
    desc: "Wake up to a summary of what's ahead. Viin tracks your priorities and keeps you on schedule.",
  },
  {
    title: 'Remembers you',
    desc: 'Store notes and preferences Viin recalls in conversations, briefings, and reminders.',
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
        <div className="hero-panel">
          <p className="eyebrow">Your personal task assistant</p>
          <h1>
            Meet <em>Viin</em>
            <br />
            stay on top of your day
          </h1>
          <p className="hero-lead">
            A bright, calm place for tasks, reminders, and daily priorities — so you can focus on what
            matters.
          </p>
          <div className="hero-actions">
            <Link to="/signup?service=assistant" className="btn btn-primary btn-lg">
              Create free account
            </Link>
            <Link to="/signin" className="btn btn-outline btn-lg">
              I have an account
            </Link>
          </div>
        </div>
      </section>

      <section className="services-band">
        <h2>Choose your service</h2>
        <p>One account. Two products. Sign up for what you need.</p>
        <div className="services-grid">
          <article className="service-card">
            <p className="service-card__eyebrow">Core</p>
            <h3>Task Assistant</h3>
            <p>
              Reminders, briefings, memory, and chat — your everyday operating system for getting
              things done.
            </p>
            <Link to="/signup?service=assistant" className="btn btn-primary">
              Get Task Assistant
            </Link>
          </article>
          <article className="service-card">
            <p className="service-card__eyebrow">Markets</p>
            <h3>Trading Bot</h3>
            <p>
              A separate trading co-pilot with equities, charts, and bot controls — still on the same
              Viin signup.
            </p>
            <Link to="/trading" className="btn btn-outline">
              Explore Trading Bot
            </Link>
          </article>
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
                <Link to="/signup?service=assistant" className="btn btn-outline btn-block">
                  Get started
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="cta-band">
        <h2>Ready to simplify your day?</h2>
        <p>Join others who trust Viin as their personal task assistant.</p>
        <Link to="/signup?service=assistant" className="btn btn-primary btn-lg">
          Sign up free
        </Link>
      </section>
    </>
  );
}
