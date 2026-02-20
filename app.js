const flags = require('./feature_flags.json').reduce((acc, f) => {
  acc[f.name] = f.status === 'active';
  return acc;
}, {});

// ---- UI Theme ----
function applyTheme(user) {
  const hasDocument = typeof document !== 'undefined' && document.body;
  if (flags.flag_dark_mode) {
    if (hasDocument) document.body.classList.add('dark-theme');
    user.theme = 'dark';
    console.log('Dark mode enabled for user:', user.id);
  } else {
    if (hasDocument) document.body.classList.add('light-theme');
    user.theme = 'light';
    console.log('Light mode enabled for user:', user.id);
  }
  return user;
}

// ---- Checkout ----
function handleCheckout(cart) {
  if (flags.flag_new_checkout) {
    console.log('Using new checkout flow');
    return newCheckoutFlow(cart);
  } else {
    console.log('Using legacy checkout flow');
    return legacyCheckoutFlow(cart);
  }
}

function newCheckoutFlow(cart) {
  // New streamlined checkout
  const total = cart.items.reduce((sum, item) => sum + item.price, 0);
  return { success: true, total, flow: 'new' };
}

function legacyCheckoutFlow(cart) {
  // Old checkout with extra steps
  const subtotal = cart.items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.08;
  return { success: true, total: subtotal + tax, flow: 'legacy' };
}

// ---- API ----
function getApiClient(version) {
  return createModernApiClient(version);
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
