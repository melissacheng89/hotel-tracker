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
  url: string;
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
            url: hotel.url || "",
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
            city: props.city || "",
            stateArea: props.stateArea || "",
            country: props.country || "",
            status: props.status || "",
            notes: props.notes || "",
            url: props.url || "",
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
    <div style={{ position: "relative", width: "100%", height: "600px", borderRadius: "12px", border: "1px solid #e8e2d9" }}>
      {loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF7F2", zIndex: 10, borderRadius: "12px" }}>
          <p style={{ color: "#999", fontSize: "0.875rem" }}>Loading map...</p>
        </div>
      )}
      <div ref={mapContainer} style={{ width: "100%", height: "100%", borderRadius: "12px" }} />

      {selected && (
        <div style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          zIndex: 10,
          background: "#1a1a1a",
          borderRadius: "12px",
          padding: "18px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          width: "280px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
            <p style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "1.4rem",
              fontWeight: 300,
              color: "#FAF7F2",
              lineHeight: 1.2,
            }}>
              {selected.name}
            </p>
            <button
              onClick={() => setSelected(null)}
              style={{ fontSize: "0.8rem", color: "#666", background: "none", border: "none", cursor: "pointer", flexShrink: 0, marginTop: "2px" }}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: "0.72rem", color: "#888", marginBottom: "6px" }}>
            {[selected.city, selected.stateArea, selected.country].filter(Boolean).join(", ")}
          </p>

          {selected.notes && (
            <p style={{ fontSize: "0.68rem", color: "#666", fontStyle: "italic", lineHeight: 1.5, marginBottom: "10px" }}>
              {selected.notes}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #333" }}>
            <span style={{
              fontSize: "0.65rem",
              padding: "3px 10px",
              borderRadius: "999px",
              border: "1px solid",
              ...(selected.status === "Visited"
                ? { borderColor: "#34d399", color: "#34d399" }
                : { borderColor: "#d97706", color: "#d97706" })
            }}>
              {selected.status === "Visited" ? "✓ Visited" : "Wishlist"}
            </span>

            {selected.url && (
              
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.7rem", color: "#FAF7F2", textDecoration: "none", borderBottom: "1px solid #555", paddingBottom: "1px" }}
              >
                Visit site →
              </a>
            )}
          </div>
        </div>
      )}

      <div style={{
        position: "absolute",
        bottom: "16px",
        right: "48px",
        zIndex: 10,
        background: "#FAF7F2",
        border: "1px solid #e8e2d9",
        borderRadius: "8px",
        padding: "6px 12px",
        display: "flex",
        gap: "12px",
        fontSize: "0.7rem",
        color: "#999",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#92400e", display: "inline-block" }} />
          Wishlist
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#059669", display: "inline-block" }} />
          Visited
        </span>
      </div>
    </div>
  );
}
