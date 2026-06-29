"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { geocodeHotel } from "@/lib/geocode";

type Hotel = {
  id: string;
  name: string;
  region: string;
  country: string;
  stateArea: string;
  city: string;
  status: string;
  notes: string;
};

type Props = {
  hotels: Hotel[];
};

export default function HotelMap({ hotels }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Hotel | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 20],
      zoom: 1.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", async () => {
      const geocoded = await Promise.all(
        hotels.map(async (hotel) => {
          const coords = await geocodeHotel(
            hotel.city,
            hotel.stateArea,
            hotel.country
          );
          return { hotel, coords };
        })
      );

      const features = geocoded
        .filter(({ coords }) => coords !== null)
        .map(({ hotel, coords }) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: coords!,
          },
          properties: {
            id: hotel.id,
            name: hotel.name,
            city: hotel.city,
            stateArea: hotel.stateArea,
            country: hotel.country,
            status: hotel.status,
            notes: hotel.notes,
            color: hotel.status === "Visited" ? "#059669" : "#92400e",
            borderColor: hotel.status === "Visited" ? "#34d399" : "#d97706",
          },
        }));

      map.current!.addSource("hotels", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features,
        },
      });

      map.current!.addLayer({
        id: "hotels-layer",
        type: "circle",
        source: "hotels",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            1, 5,
            5, 8,
            10, 12,
          ],
          "circle-color": ["get", "color"],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": ["get", "borderColor"],
          "circle-opacity": 0.85,
        },
      });

      map.current!.on("mouseenter", "hotels-layer", () => {
        map.current!.getCanvas().style.cursor = "pointer";
      });

      map.current!.on("mouseleave", "hotels-layer", () => {
        map.current!.getCanvas().style.cursor = "";
      });

      map.current!.on("click", "hotels-layer", (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties!;
          setSelected({
            id: props.id,
            name: props.name,
            city: props.city,
            stateArea: props.stateArea,
            country: props.country,
            status: props.status,
            notes: props.notes,
            region: "",
          });
        }
      });

      map.current!.on("click", (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ["hotels-layer"],
        });
        if (features.length === 0) {
          setSelected(null);
        }
      });

      setLoading(false);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [hotels]);

  return (
    <div
      className="relative w-full rounded-xl"
      style={{ height: "600px", border: "1px solid #e8e2d9" }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl" style={{ background: "#FAF7F2" }}>
          <p className="text-sm" style={{ color: "#999" }}>Loading map...</p>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full rounded-xl" />

      {selected && (
        <div
          className="absolute bottom-4 left-4 z-10 rounded-xl px-4 py-3 max-w-xs"
          style={{ background: "#FAF7F2", border: "1px solid #e8e2d9" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-sm leading-snug font-light"
                style={{ color: "#1a1a1a", fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}
              >
                {selected.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                {[selected.city, selected.stateArea, selected.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {selected.notes && (
                <p className="text-xs mt-1 italic" style={{ color: "#aaa" }}>
                  {selected.notes}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="text-xs"
                style={{ color: "#999" }}
              >
                ✕
              </button>
              <span
                className="text-xs px-2 py-0.5 rounded-full border"
                style={
                  selected.status === "Visited"
                    ? { borderColor: "#6ee7b7", color: "#065f46", background: "#ecfdf5" }
                    : { borderColor: "#e8e2d9", color: "#999", background: "transparent" }
                }
              >
                {selected.status === "Visited" ? "✓ Visited" : "Wishlist"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        className="absolute bottom-4 right-12 z-10 rounded-lg px-3 py-2 flex gap-3 text-xs"
        style={{ background: "#FAF7F2", border: "1px solid #e8e2d9", color: "#999" }}
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#92400e" }} />
          Wishlist
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#059669" }} />
          Visited
        </span>
      </div>
    </div>
  );
}
