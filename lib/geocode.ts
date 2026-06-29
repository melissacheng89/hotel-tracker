const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const geocodeCache: Record<string, [number, number]> = {};

export async function geocodeHotel(
  city: string,
  stateArea: string,
  country: string
): Promise<[number, number] | null> {
  const query = [city, stateArea, country].filter(Boolean).join(", ");
  if (!query) return null;

  if (geocodeCache[query]) return geocodeCache[query];

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const data = await res.json();
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].center;
      geocodeCache[query] = [lng, lat];
      return [lng, lat];
    }
  } catch (e) {
    console.error("Geocoding error:", e);
  }
  return null;
}