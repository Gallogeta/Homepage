import React from 'react';

// Compact 4-up pricing for services; no monthly/yearly; square edges; order opens Contact with details
export default function Prices({ onOrder }) {
  const plans = [
    {
      key: 'site-starter',
      title: 'Starter Website',
      price: '€500',
      points: [
        'Up to 3 pages (Home, About, Contact)',
        'Mobile-friendly design',
        'Basic SEO setup',
        'Contact form integration',
      ],
    },
    {
      key: 'site-pro',
      title: 'Professional Website',
      price: '€1200',
      points: [
        'Up to 8 pages',
        'Custom components & animations',
        'Performance & security hardening',
        'Contact + gallery/blog sections',
      ],
    },
    {
      key: 'site-business',
      title: 'Business Website',
      price: 'Contract price',
      points: [
        'Custom design and features',
        'E‑commerce/integrations on demand',
        'Admin panel / CMS if needed',
        'SLA & ongoing support options',
      ],
    },
    {
      key: 'pc-repair',
      title: 'PC Software Repair',
      price: '€70 / hour',
      points: [
        'OS cleanup & optimization',
        'Malware removal',
        'Driver & software fixes',
        'Remote or on-site (local)',
      ],
    },
  ];

  const handleBuy = (plan) => {
    const detail = {
      type: 'service-order',
      key: plan.key,
      title: plan.title,
      price: plan.price,
      subject: `Order: ${plan.title}`,
      message: `Service: ${plan.title}\nPrice: ${plan.price}\nPlease include any details and timelines.`,
    };
    if (typeof onOrder === 'function') onOrder(detail);
    else {
      try { window.dispatchEvent(new CustomEvent('open-order', { detail })); } catch {}
    }
  };

  return (
    <div className="pricing_1" style={{ width: '100%' }}>
      <style>{`
        .pricing_1 * { font-family: Nunito, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
        .pricing_1 .container { max-width: 1400px; padding: 10px 0; margin: 30px auto 0 auto; }
        .pricing_1 .text-blk { margin: 0; line-height: 22px; color: #ffd700; }
        .pricing_1 .text-blk.head { width: 100%; text-align: center; font-size: 28px; font-weight: 900; line-height: 36px; color: #ffd700; }
  /* Grid centered with fixed-width tracks so cards sit in the page center */
  .pricing_1 .card-container { display: grid; grid-template-columns: repeat(4, auto); gap: 16px; margin: 20px auto 0 auto; align-items: stretch; justify-content: center; }
  /* Additional ~10% shrink */
  .pricing_1 .card { text-align: left; width: 180px; border: 1px solid #ffd70066; border-radius: 0; display: flex; flex-direction: column; position: relative; align-items: stretch; min-height: 260px; font-size: 12px; color: #ffd700; padding: 10px; background: #000; transition: border-color .2s ease, box-shadow .2s ease; }
  .pricing_1 .card:hover { border-color: #ffd700; box-shadow: 0 0 12px rgba(191,164,58,0.18); }
  .pricing_1 .card h1 { font-size: 24px; line-height: 30px; font-weight: 900; margin: 8px 0 10px 0; color: #ffd700; }
        .pricing_1 .card .title { font-weight: 700; letter-spacing: .2px; }
        .pricing_1 .text-blk.card-points { line-height: 24px; color: #e8d98a; }
        .pricing_1 .buy-button { margin-top: auto; width: 100%; }
        /* Square button just for Pricing page */
        .pricing_1 .order-btn { border-radius: 0 !important; font-weight: 700; }
  @media (max-width: 1200px) { .pricing_1 .card-container { grid-template-columns: repeat(4, auto); } }
  @media (max-width: 1024px) { .pricing_1 .card-container { grid-template-columns: repeat(3, auto); } }
  @media (max-width: 768px)  { .pricing_1 .card-container { grid-template-columns: repeat(2, auto); } }
  @media (max-width: 500px)  { .pricing_1 .card-container { grid-template-columns: repeat(1, auto); } }
      `}</style>

      <div className="responsive-container-block container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p className="text-blk head">Services & Pricing</p>
        <div className="card-container">
          {plans.map((p) => (
            <div key={p.key} className="card">
              <p className="text-blk title">{p.title}</p>
              <h1>{p.price}</h1>
              <div className="card-description" style={{ marginBottom: 12 }}>
                {p.points.map((pt, i) => (
                  <p key={i} className="text-blk card-points">{pt}</p>
                ))}
              </div>
              <div className="buy-button">
                <button className="order-btn" type="button" onClick={() => handleBuy(p)}>Buy</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
