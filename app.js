const flags = require('./feature_flags.json').reduce((acc, f) => {
  acc[f.name] = f.status === 'active';
  return acc;
}, {});

// ---- UI Theme ----
function applyTheme(user) {
  if (flags.flag_dark_mode) {
    document.body.classList.add('dark-theme');
    user.theme = 'dark';
    console.log('Dark mode enabled for user:', user.id);
  } else {
    document.body.classList.add('light-theme');
    user.theme = 'light';
    console.log('Light mode enabled for user:', user.id);
  }
}

// ---- Checkout ----
function handleCheckout(cart) {
  console.log('Using new checkout flow');
  return newCheckoutFlow(cart);
}

function newCheckoutFlow(cart) {
  const total = cart.items.reduce((sum, item) => sum + item.price, 0);
  return { success: true, total, flow: 'new' };
}

// ---- API ----
function getApiClient(version) {
  if (flags.flag_legacy_api) {
    console.warn('Legacy API enabled — this will be deprecated soon');
    return createLegacyApiClient(version);
  } else {
    return createModernApiClient(version);
  }
}

function createLegacyApiClient(version) {
  return { version, baseUrl: '/api/v1', legacy: true };
}

function createModernApiClient(version) {
  return { version, baseUrl: '/api/v2', legacy: false };
}

// ---- Dashboard ----
function renderDashboard(user) {
  const sections = ['overview', 'reports'];

  sections.push('analytics', 'insights', 'cohorts');

  return {
    user: user.id,
    sections,
    beta: true,
  };
}

module.exports = { applyTheme, handleCheckout, getApiClient, renderDashboard };
