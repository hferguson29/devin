const { applyTheme, handleCheckout, getApiClient, renderDashboard } = require('../app');

const flags = require('../feature_flags.json').reduce((acc, f) => {
  acc[f.name] = f.status === 'active';
  return acc;
}, {});

describe('applyTheme', () => {
  it('applies dark theme when flag_dark_mode is active', () => {
    const user = { id: 'user_1' };
    const result = applyTheme(user);
    if (flags.flag_dark_mode) {
      expect(result.theme).toBe('dark');
    } else {
      expect(result.theme).toBe('light');
    }
  });
});

describe('handleCheckout', () => {
  const cart = { items: [{ price: 10 }, { price: 20 }] };

  it('uses new checkout flow', () => {
    const result = handleCheckout(cart);
    expect(result.flow).toBe('new');
    expect(result.total).toBe(30);
  });
});

describe('getApiClient', () => {
  it('returns legacy client when flag_legacy_api is active', () => {
    const client = getApiClient('1.0');
    if (flags.flag_legacy_api) {
      expect(client.legacy).toBe(true);
      expect(client.baseUrl).toBe('/api/v1');
    } else {
      expect(client.legacy).toBe(false);
      expect(client.baseUrl).toBe('/api/v2');
    }
  });
});

describe('renderDashboard', () => {
  it('includes beta sections', () => {
    const user = { id: 'user_1' };
    const result = renderDashboard(user);
    expect(result.sections).toContain('analytics');
    expect(result.beta).toBe(true);
  });
});
