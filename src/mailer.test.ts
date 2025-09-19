import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateDigestSlug } from './hosting';
import { config } from './config';

// Mock the config to avoid environment dependency
vi.mock('./config', () => ({
  config: {
    SITE_URL: 'https://test-site.com'
  }
}));

describe('mailer URL generation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate correct web URL for digest', () => {
    const testDate = new Date('2024-01-15T10:00:00.000Z');
    vi.setSystemTime(testDate);
    
    const slug = generateDigestSlug(testDate);
    const expectedUrl = `${config.SITE_URL}/digests/${slug}.html`;
    
    expect(slug).toBe('2024-01-15');
    expect(expectedUrl).toBe('https://test-site.com/digests/2024-01-15.html');
  });
});