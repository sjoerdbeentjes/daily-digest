import { describe, it, expect } from 'bun:test';
import { generateDigestSlug } from './hosting';

describe('mailer URL generation', () => {
  it('should generate correct web URL for digest', () => {
    const testDate = new Date('2024-01-15T10:00:00.000Z');
    
    const slug = generateDigestSlug(testDate);
    
    expect(slug).toBe('2024-01-15');
  });
});