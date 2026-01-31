import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Expo/native modules to avoid pulling in native code during unit tests
vi.mock('expo-constants', () => ({
  default: {
    expoConfig: { version: '1.2.3', extra: {} },
    platform: { ios: true },
  },
}));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}), { virtual: true });

// Helper to create a fresh environment for each test (reset modules and env)
function setupEnv(minLevel?: string) {
  vi.resetModules();
  process.env.EXPO_PUBLIC_SENTRY_DSN = 'test-dsn';
  if (minLevel !== undefined) {
    process.env.EXPO_PUBLIC_SENTRY_MIN_LEVEL = minLevel;
  } else {
    delete process.env.EXPO_PUBLIC_SENTRY_MIN_LEVEL;
  }
}

describe('crashReporting', () => {
  beforeEach(() => {
    setupEnv();
  });

  it('initializes Sentry and sets tags', async () => {
    const mock = {
      init: vi.fn(),
      setTag: vi.fn(),
    };

    const { crashReporting, __setSentryForTest } = await import('../crashReporting');

    // Inject the mock so initialize doesn't try to require the native package
    __setSentryForTest(mock as any);

    await crashReporting.initialize();

    expect(mock.init).toHaveBeenCalled();
    // setTag is called for app_version and platform
    expect(mock.setTag).toHaveBeenCalled();
    expect(crashReporting.isEnabled()).toBe(true);
  });

  it('captureMessage respects minimum level', async () => {
    setupEnv('error');

    const mock = {
      init: vi.fn(),
      captureMessage: vi.fn(),
    };

    const { crashReporting, __setSentryForTest } = await import('../crashReporting');

    __setSentryForTest(mock as any);

    await crashReporting.initialize();

    crashReporting.captureMessage('debug-msg', 'debug');
    crashReporting.captureMessage('info-msg', 'info');
    crashReporting.captureMessage('warn-msg', 'warning');
    crashReporting.captureMessage('err-msg', 'error');

    expect(mock.captureMessage).toHaveBeenCalledTimes(1);
    expect(mock.captureMessage).toHaveBeenCalledWith('err-msg', { level: 'error' });
  });

  it('captureError uses withScope when available', async () => {
    const captureException = vi.fn();
    const withScope = vi.fn((fn: any) => fn({ setContext: vi.fn() }));

    const mock = {
      init: vi.fn(),
      withScope,
      captureException,
    };

    const { crashReporting, __setSentryForTest } = await import('../crashReporting');

    __setSentryForTest(mock as any);

    await crashReporting.initialize();

    crashReporting.captureError(new Error('boom'), { foo: 'bar' });

    expect(withScope).toHaveBeenCalled();
    expect(captureException).toHaveBeenCalled();
  });

  it('testCrash captures and flushes', async () => {
    const captureException = vi.fn();
    const flush = vi.fn(async (t: number) => true);

    const mock = {
      init: vi.fn(),
      captureException,
      flush,
    };

    const { crashReporting, __setSentryForTest } = await import('../crashReporting');

    __setSentryForTest(mock as any);

    await crashReporting.initialize();

    await crashReporting.testCrash();

    expect(captureException).toHaveBeenCalled();
    expect(flush).toHaveBeenCalled();
  });
});
