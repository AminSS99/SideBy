import { describe, it, expect } from 'vitest';
import { getClientIp } from './route-guard.js';
import type { VercelRequest } from "@vercel/node";

describe('getClientIp', () => {
  it('should prefer x-real-ip header if available', () => {
    const req = {
      headers: {
        'x-real-ip': '1.1.1.1',
        'x-vercel-forwarded-for': '2.2.2.2',
        'x-forwarded-for': '3.3.3.3',
      },
      socket: { remoteAddress: '4.4.4.4' },
    } as unknown as VercelRequest;
    expect(getClientIp(req)).toBe('1.1.1.1');
  });

  it('should fall back to x-vercel-forwarded-for if x-real-ip is not available', () => {
    const req = {
      headers: {
        'x-vercel-forwarded-for': '2.2.2.2',
        'x-forwarded-for': '3.3.3.3',
      },
      socket: { remoteAddress: '4.4.4.4' },
    } as unknown as VercelRequest;
    expect(getClientIp(req)).toBe('2.2.2.2');
  });

  it('should fall back to x-forwarded-for if neither x-real-ip nor x-vercel-forwarded-for are available', () => {
    const req = {
      headers: {
        'x-forwarded-for': '3.3.3.3, 5.5.5.5',
      },
      socket: { remoteAddress: '4.4.4.4' },
    } as unknown as VercelRequest;
    expect(getClientIp(req)).toBe('3.3.3.3');
  });

  it('should use x-forwarded-for if it is the only one available', () => {
    const req = {
      headers: {
        'x-forwarded-for': '3.3.3.3',
      },
      socket: {},
    } as unknown as VercelRequest;
    expect(getClientIp(req)).toBe('3.3.3.3');
  });

  it('should fall back to remoteAddress if no headers are present', () => {
    const req = {
      headers: {},
      socket: { remoteAddress: '4.4.4.4' },
    } as unknown as VercelRequest;
    expect(getClientIp(req)).toBe('4.4.4.4');
  });
});
