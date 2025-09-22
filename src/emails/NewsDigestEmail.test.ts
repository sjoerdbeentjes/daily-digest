import { describe, it, expect } from 'vitest';
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

  it('should include dark mode styles for automatic detection', () => {
    const html = render(
      React.createElement(NewsDigestEmail, {
        date: 'January 1st, 2024',
        categories: [],
        introText: 'Test intro text',
      })
    );
    
    // Check that the HTML contains dark mode styles for automatic detection
    // Manual theme toggle styles are now handled by the hosting wrapper
    expect(html).toContain('@media (prefers-color-scheme: dark)');
    expect(html).toContain('color: #4dd0e1 !important');
    expect(html).toContain('background-color: #1a1a1a !important');
  });
});