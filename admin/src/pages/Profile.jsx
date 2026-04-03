import React from 'react';

const PROFILE_SECTIONS = [
  {
    title: 'Admin Overview',
    items: [
      'Full access to catalog, orders, and users',
      'Can publish products and manage stock levels',
      'Can review order progress and customer issues',
    ],
  },
  {
    title: 'Quick Actions',
    items: [
      'Add a new book to the inventory',
      'Review pending orders and shipped items',
      'Block suspicious users or restore access',
    ],
  },
  {
    title: 'Security',
    items: [
      'Use a strong password and sign out after shared sessions',
      'Do not expose admin credentials in public devices',
      'Verify stock and order changes before saving',
    ],
  },
];

function Profile() {
  return (
    <div className="page-content">
      <div className="profile-hero section-card">
        <div className="profile-avatar profile-avatar--lg">A</div>
        <div>
          <h2 className="profile-title">Admin Profile</h2>
          <p className="profile-subtitle">Bibliotheca management console</p>
        </div>
      </div>

      <div className="stats-grid stats-grid--sm profile-stats-grid">
        {[
          { label: 'Role', value: 'Administrator', icon: '🛡️' },
          { label: 'Access', value: 'Full Control', icon: '🔑' },
          { label: 'Workspace', value: 'Store Operations', icon: '🏬' },
          { label: 'Status', value: 'Active', icon: '✅' },
        ].map((item) => (
          <div className="stat-card stat-card--sm" key={item.label}>
            <div className="stat-card-icon">{item.icon}</div>
            <div className="stat-card-body">
              <div className="stat-card-value">{item.value}</div>
              <div className="stat-card-label">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="profile-grid">
        {PROFILE_SECTIONS.map((section) => (
          <section key={section.title} className="section-card profile-section">
            <h3 className="section-card-title">{section.title}</h3>
            <ul className="profile-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="section-card profile-section">
        <div className="section-card-header">
          <h3 className="section-card-title">Profile Notes</h3>
        </div>
        <p className="td-muted" style={{ margin: 0 }}>
          This page is the shared admin profile area for the panel. You can extend it later with live
          account data, last login history, permissions, or company contact details.
        </p>
      </section>
    </div>
  );
}

export default Profile;