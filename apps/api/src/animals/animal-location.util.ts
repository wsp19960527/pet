/** Deterministic coordinate fuzz (50–200m) for privacy. */
export function fuzzyCoordinate(
  latitude: number,
  longitude: number,
  seed: string,
): { latitude: number; longitude: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const angle = ((Math.abs(hash) % 360) * Math.PI) / 180;
  const distanceM = 50 + (Math.abs(hash) % 151);
  const dLat = (distanceM / 111_320) * Math.cos(angle);
  const dLng =
    (distanceM / (111_320 * Math.cos((latitude * Math.PI) / 180))) *
    Math.sin(angle);

  return {
    latitude: latitude + dLat,
    longitude: longitude + dLng,
  };
}

export function canViewPreciseLocation(
  userId: string | undefined,
  animal: { creatorId: string; rescuerId: string | null },
  userRole?: string,
): boolean {
  if (!userId) return false;
  if (userId === animal.creatorId || userId === animal.rescuerId) return true;
  return userRole === 'org_admin' || userRole === 'admin';
}

export function blurAddress(address: string | null): string | null {
  if (!address) return null;
  if (address.length <= 4) return `${address.slice(0, 2)}**附近`;
  return `${address.slice(0, Math.min(6, address.length))}…附近`;
}
