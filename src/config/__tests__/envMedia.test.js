import { describe, it, expect } from 'vitest';
import { API_BASE_URL, resolveMediaUrl } from '../env';

describe('Central env & resolveMediaUrl tests', () => {
  it('1. exports a non-empty API_BASE_URL string', () => {
    expect(typeof API_BASE_URL).toBe('string');
    expect(API_BASE_URL.length).toBeGreaterThan(0);
    expect(API_BASE_URL.endsWith('/')).toBe(false);
  });

  it('2. resolves relative /media/ paths using API_BASE_URL', () => {
    const result = resolveMediaUrl('/media/products/laptop.jpg');
    expect(result).toBe(`${API_BASE_URL}/media/products/laptop.jpg`);
  });

  it('3. handles relative paths without leading slashes and prevents double slashes', () => {
    const result = resolveMediaUrl('media/products/saree.png');
    expect(result).toBe(`${API_BASE_URL}/media/products/saree.png`);
    expect(result).not.toContain('//media');
  });

  it('4. passes through absolute HTTP and HTTPS URLs unchanged', () => {
    const httpUrl = 'http://example.com/images/sample.png';
    const httpsUrl = 'https://images.unsplash.com/photo-123';
    expect(resolveMediaUrl(httpUrl)).toBe(httpUrl);
    expect(resolveMediaUrl(httpsUrl)).toBe(httpsUrl);
  });

  it('5. returns fallback asset for null, undefined, or empty strings', () => {
    expect(resolveMediaUrl(null)).toBe('/icons.svg');
    expect(resolveMediaUrl(undefined)).toBe('/icons.svg');
    expect(resolveMediaUrl('')).toBe('/icons.svg');
    expect(resolveMediaUrl('   ')).toBe('/icons.svg');
  });
});
