import { describe, expect, it } from 'vitest';
import { gcj02ToWgs84, wgs84ToGcj02 } from './gcj02.js';

describe('gcj02', () => {
  it('returns same coords outside China', () => {
    const point = gcj02ToWgs84(-122.4194, 37.7749);
    expect(point.longitude).toBeCloseTo(-122.4194, 5);
    expect(point.latitude).toBeCloseTo(37.7749, 5);
  });

  it('converts Beijing GCJ-02 to WGS84 with expected offset', () => {
    const gcjLng = 116.4074;
    const gcjLat = 39.9042;
    const wgs = gcj02ToWgs84(gcjLng, gcjLat);

    expect(wgs.longitude).toBeLessThan(gcjLng);
    expect(wgs.latitude).toBeLessThan(gcjLat);
    expect(Math.abs(gcjLng - wgs.longitude)).toBeGreaterThan(0.001);
  });

  it('round-trips approximately through wgs84ToGcj02', () => {
    const original = { longitude: 116.4074, latitude: 39.9042 };
    const gcj = wgs84ToGcj02(original.longitude, original.latitude);
    const back = gcj02ToWgs84(gcj.longitude, gcj.latitude);

    expect(back.longitude).toBeCloseTo(original.longitude, 5);
    expect(back.latitude).toBeCloseTo(original.latitude, 5);
  });
});
