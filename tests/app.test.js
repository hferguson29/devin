const { applyTheme, handleCheckout, getApiClient, renderDashboard } = require('../app');

const flags = require('../feature_flags.json').reduce((acc, f) => {
  acc[f.name] = f.status === 'active';
  return acc;
}, {});

describe('applyTheme', () => {
  it('applies dark theme', () => {
    const user = { id: 'user_1' };
    const result = applyTheme(user);
    expect(result.theme).toBe('dark');
  });
});

describe('handleCheckout', () => {
  const cart = { items: [{ price: 10 }, { price: 20 }] };

  it('uses new checkout flow when flag_new_checkout is active', () => {
    const result = handleCheckout(cart);
    if (flags.flag_new_checkout) {
      expect(result.flow).toBe('new');
      expect(result.total).toBe(30);
    } else {
      expect(result.flow).toBe('legacy');
    }
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
