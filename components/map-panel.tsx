"use client";

import { useEffect, useId, useRef } from "react";
import { ExternalLink, MapPin, Navigation, Phone } from "lucide-react";
import {
  appleMapsDirectionsUrl,
  appleMapsUrl,
  formatMapAddress,
  googleMapsDirectionsUrl,
  googleMapsEmbedUrl,
  googleMapsSearchUrl,
  type AddressParts,
} from "@/lib/maps";
import { cn } from "@/lib/utils";
import { formatPhone, telHref } from "@/lib/format";

type MapPanelProps = {
  address: AddressParts;
  label?: string;
  phone?: string | null;
  confirmName?: string;
  confirmed?: boolean;
  onConfirmChange?: (value: boolean) => void;
  className?: string;
};

export function MapPanel({
  address,
  label,
  phone,
  confirmName,
  confirmed,
  onConfirmChange,
  className,
}: MapPanelProps) {
  const fullAddress = formatMapAddress(address);
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const appleToken = process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN;
  const embedSrc = googleMapsEmbedUrl(fullAddress, googleKey || undefined);
  const callHref = telHref(phone);

  return (
    <section
      className={cn(
        "rounded-2xl overflow-hidden border border-[#d7e3ea] bg-navy-2 text-white",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7eb6e8]">
            Site on the map
          </p>
          <p className="font-heading text-2xl uppercase tracking-wide leading-none mt-1">
            {label || address.suburb}
          </p>
          <p className="text-sm text-[#c5d6e2] mt-1">{fullAddress}</p>
        </div>
        <MapPin className="text-orange shrink-0 mt-1" size={22} />
      </div>

      <div className="grid lg:grid-cols-2 gap-0 bg-cream">
        <div className="min-h-[240px] bg-[#102938]">
          <iframe
            title={`Google Maps — ${fullAddress}`}
            src={embedSrc}
            className="w-full h-[240px] lg:h-full min-h-[240px] border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <AppleMapPane address={fullAddress} token={appleToken} />
      </div>

      <div className="px-4 py-3 bg-navy grid sm:grid-cols-2 gap-2">
        <a
          href={googleMapsDirectionsUrl(fullAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 min-h-11 rounded-xl bg-blue px-3 py-2.5 text-sm font-semibold"
        >
          <Navigation size={16} />
          Google directions
        </a>
        <a
          href={appleMapsDirectionsUrl(fullAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 min-h-11 rounded-xl bg-white text-navy px-3 py-2.5 text-sm font-semibold"
        >
          <Navigation size={16} />
          Apple directions
        </a>
        <a
          href={googleMapsSearchUrl(fullAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 min-h-11 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold"
        >
          <ExternalLink size={16} />
          Open Google Maps
        </a>
        <a
          href={appleMapsUrl(fullAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 min-h-11 rounded-xl bg-orange px-3 py-2.5 text-sm font-semibold"
        >
          <ExternalLink size={16} />
          Open Apple Maps
        </a>
        {callHref ? (
          <a
            href={callHref}
            className="sm:col-span-2 inline-flex items-center justify-center gap-2 min-h-11 rounded-xl bg-white text-navy px-3 py-2.5 text-sm font-semibold"
          >
            <Phone size={16} />
            Call {formatPhone(phone)}
          </a>
        ) : null}
      </div>

      {confirmName ? (
        <label className="flex items-start gap-3 px-4 py-3 bg-[#0c2230] text-sm">
          <input
            type="checkbox"
            name={confirmName}
            checked={confirmed}
            onChange={(event) => onConfirmChange?.(event.target.checked)}
            className="mt-1 h-5 w-5 accent-[#FF612F]"
            required
          />
          <span>
            <span className="font-semibold">Confirm this is the site.</span>{" "}
            Next step — we use this pin for the job, van directions and the customer record.
          </span>
        </label>
      ) : null}
    </section>
  );
}

function AppleMapPane({ address, token }: { address: string; token?: string }) {
  const hostId = useId().replace(/:/g, "");
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token || !mapRef.current) return;
    const win = window as Window & {
      mapkit?: {
        init: (opts: { authorizationCallback: (done: (t: string) => void) => void }) => void;
        Map: new (el: HTMLElement) => {
          destroy?: () => void;
          showItems: (items: unknown[]) => void;
        };
        CoordinateRegion: new (center: unknown, span: unknown) => unknown;
        Coordinate: new (lat: number, lng: number) => unknown;
        CoordinateSpan: new (lat: number, lng: number) => unknown;
        MarkerAnnotation: new (coord: unknown, opts?: { title?: string }) => unknown;
        Geocoder: new () => {
          lookup: (
            query: string,
            cb: (error: Error | null, data?: { results?: { coordinate: unknown }[] }) => void,
          ) => void;
        };
      };
    };

    function boot() {
      const mapkit = win.mapkit;
      if (!mapkit || !mapRef.current) return;
      try {
        mapkit.init({
          authorizationCallback(done) {
            done(token as string);
          },
        });
        const map = new mapkit.Map(mapRef.current);
        const geocoder = new mapkit.Geocoder();
        geocoder.lookup(address, (error, data) => {
          if (error || !data?.results?.[0]) return;
          const marker = new mapkit.MarkerAnnotation(data.results[0].coordinate, {
            title: address,
          });
          map.showItems([marker]);
        });
      } catch {
        // Token missing or invalid — the pin card still works.
      }
    }

    if (win.mapkit) {
      boot();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
    script.async = true;
    script.onload = boot;
    document.body.appendChild(script);
    return () => {
      script.onload = null;
    };
  }, [address, token]);

  return (
    <div className="min-h-[240px] bg-[#E5EFF3] text-ink p-4 flex flex-col">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">Apple Maps</p>
      <p className="font-heading text-xl uppercase tracking-wide text-navy mt-1">On the way there</p>
      {token ? (
        <div id={hostId} ref={mapRef} className="mt-3 flex-1 min-h-[160px] rounded-xl overflow-hidden bg-white" />
      ) : (
        <div className="mt-3 flex-1 rounded-xl bg-white border border-[#cfd8de] p-4 flex flex-col justify-between min-h-[160px]">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
              <MapPin size={16} className="text-orange" />
              Pin ready for Apple Maps
            </p>
            <p className="text-sm text-[#3c4d5a] mt-2">{address}</p>
          </div>
          <p className="text-xs text-[#5b6b78] mt-3">
            Opens the same Gold Coast / Northern NSW address in Apple Maps on iPhone. Optional MapKit embed
            uses <code>NEXT_PUBLIC_APPLE_MAPS_TOKEN</code>.
          </p>
        </div>
      )}
      <a
        href={appleMapsUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center justify-center gap-2 min-h-11 rounded-xl bg-navy text-white px-3 py-2.5 text-sm font-semibold"
      >
        <ExternalLink size={16} />
        Open in Apple Maps
      </a>
    </div>
  );
}
