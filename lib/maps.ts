export type AddressParts = {
  street: string;
  suburb: string;
  state?: string;
  postcode: string;
};

export function formatMapAddress(parts: AddressParts) {
  return `${parts.street}, ${parts.suburb} ${parts.state ?? "QLD"} ${parts.postcode}, Australia`;
}

export function googleMapsSearchUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function googleMapsDirectionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function googleMapsEmbedUrl(address: string, key?: string) {
  if (key) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(address)}`;
  }
  const params = new URLSearchParams({
    q: address,
    output: "embed",
    hl: "en-AU",
    z: "16",
  });
  return `https://maps.google.com/maps?${params.toString()}`;
}

export function appleMapsUrl(address: string) {
  return `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
}

export function appleMapsDirectionsUrl(address: string) {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(address)}&dirflg=d`;
}

export function mapsConfig() {
  return {
    googleEmbedKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? "",
    appleMapsToken: process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN ?? "",
  };
}
