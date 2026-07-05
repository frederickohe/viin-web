import { useEffect, useState } from 'react';
import { api, ApiError, type Plan, type SubscriptionStatus } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function Subscription() {
  const { token } = useAuth();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const [s, p] = await Promise.all([
          api.getSubscription(token),
          api.getPlans(),
        ]);
        if (!cancelled) {
          setSub(s);
          setPlans(p.plans || []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load subscription');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="dash-page">
      <header className="dash-header">
        <h1>Subscription</h1>
        <p>Your plan determines which features Viin can use for you.</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="dash-muted">Loading…</p>
      ) : sub && (
        <>
          <section className="dash-card dash-subscription-current">
            <div className="dash-subscription-head">
              <div>
                <h3>{sub.has_active_subscription ? sub.plan_name : 'No active plan'}</h3>
                <p className="dash-muted">
                  {sub.has_active_subscription
                    ? `${sub.days_remaining} days remaining · ${sub.status}`
                    : 'Subscribe to unlock more features'}
                </p>
              </div>
              {sub.has_active_subscription && sub.plan_price != null && (
                <span className="dash-stat-value dash-stat-value--sm">
                  GHS {sub.plan_price}
                </span>
              )}
            </div>

            {sub.features && sub.features.length > 0 && (
              <div>
                <h4>Included features</h4>
                <ul className="dash-bullets">
                  {sub.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

          </section>

          <section className="dash-card">
            <h3>Available plans</h3>
            <div className="pricing-grid">
              {plans.map((plan) => (
                <article key={plan.id} className="plan-card">
                  <h3>{plan.name}</h3>
                  <p className="plan-price">
                    GHS {plan.price}
                    <span>/mo</span>
                  </p>
                  {plan.description && <p className="plan-desc">{plan.description}</p>}
                  <ul>
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  {sub.plan_id === plan.id && (
                    <span className="dash-badge dash-badge--current">Current plan</span>
                  )}
                </article>
              ))}
            </div>
            <p className="dash-muted dash-hint">
              To upgrade or subscribe, contact support or use the Viin mobile app payment flow.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
