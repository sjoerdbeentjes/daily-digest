import { describe, it, expect } from 'bun:test';
import { render } from '@react-email/render';
import React from 'react';
import { NewsDigestEmail } from './NewsDigestEmail';

describe('NewsDigestEmail', () => {
  it('should render email without webUrl', () => {
    const html = render(
      React.createElement(NewsDigestEmail, {
        date: 'January 1st, 2024',
        categories: [],
        introText: 'Test intro text',
      })
    );
    
    expect(html).toContain('DAILY NEWS DIGEST');
    expect(html).toContain('Test intro text');
    expect(html).not.toContain('View this newsletter in your browser');
  });

  it('should render email with webUrl', () => {
    const testUrl = 'https://example.com/digests/2024-01-01.html';
    const html = render(
      React.createElement(NewsDigestEmail, {
        date: 'January 1st, 2024',
        categories: [],
        introText: 'Test intro text',
        webUrl: testUrl,
      })
    );
    
    expect(html).toContain('DAILY NEWS DIGEST');
    expect(html).toContain('Test intro text');
    expect(html).toContain('View this newsletter in your browser');
    expect(html).toContain(testUrl);
  });
});