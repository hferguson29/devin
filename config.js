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
    baseUrl: flags.flag_legacy_api ? '/api/v1' : '/api/v2',
    timeout: flags.flag_legacy_api ? 10000 : 5000,
    useLegacy: flags.flag_legacy_api,
  },

  checkout: {
    flow: flags.flag_new_checkout ? 'new' : 'legacy',
    enableGuestCheckout: flags.flag_new_checkout,
    enableExpressCheckout: flags.flag_new_checkout,
  },

  dashboard: {
    enableBetaFeatures: flags.flag_beta_dashboard,
    tabs: flags.flag_beta_dashboard
      ? ['overview', 'reports', 'analytics', 'insights', 'cohorts']
      : ['overview', 'reports'],
  },
};

module.exports = config;
