const flags = require('./feature_flags.json').reduce((acc, f) => {
  acc[f.name] = f.status === 'active';
  return acc;
}, {});

const config = {
  app: {
    name: 'MyApp',
    version: '2.4.1',
  },

  ui: {
    theme: flags.flag_dark_mode ? 'dark' : 'light',
    showThemeToggle: flags.flag_dark_mode,
  },

  api: {
    baseUrl: '/api/v2',
    timeout: 5000,
  },

  checkout: {
    flow: flags.flag_new_checkout ? 'new' : 'legacy',
    enableGuestCheckout: flags.flag_new_checkout,
    enableExpressCheckout: flags.flag_new_checkout,
  },

  dashboard: {
    enableBetaFeatures: true,
    tabs: ['overview', 'reports', 'analytics', 'insights', 'cohorts'],
  },
};

module.exports = config;
