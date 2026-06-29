"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const HotelMap = dynamic(() => import("@/app/components/HotelMap"), {
  ssr: false,
});

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

type StatusFilter = "All" | "Bucket List" | "Visited";
type View = "list" | "map";

export default function Home() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [regionFilter, setRegionFilter] = useState<string>("All");
  const [countryFilter, setCountryFilter] = useState<string>("All");
  const [view, setView] = useState<View>("list");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hotels")
      .then((res) => res.json())
      .then((data) => {
        setHotels(data);
        setLoading(false);
      });
  }, []);

  const regionOrder = [
    "N. America",
    "Caribbean",
    "Central America",
    "Europe",
    "Asia",
    "Oceania",
    "Other",
  ];

  const allRegions = regionOrder.filter((r) =>
    hotels.some((h) => h.region === r)
  );

  const allCountries = [
    ...new Set(
      hotels
        .filter((h) => regionFilter === "All" || h.region === regionFilter)
        .map((h) => h.country)
        .filter(Boolean)
        .sort()
    ),
  ];

  const filtered = hotels.filter((h) => {
    const matchesStatus = statusFilter === "All" || h.status === statusFilter;
    const matchesRegion = regionFilter === "All" || h.region === regionFilter;
    const matchesCountry = countryFilter === "All" || h.country === countryFilter;
    return matchesStatus && matchesRegion && matchesCountry;
  });

  const grouped = filtered.reduce((acc, hotel) => {
    const region = hotel.region || "Other";
    const country = hotel.country || "Other";
    if (!acc[region]) acc[region] = {};
    if (!acc[region][country]) acc[region][country] = [];
    acc[region][country].push(hotel);
    return acc;
  }, {} as Record<string, Record<string, Hotel[]>>);

  const sortedRegions = Object.keys(grouped).sort(
    (a, b) => regionOrder.indexOf(a) - regionOrder.indexOf(b)
  );

  const FilterPill = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs tracking-wide transition-all border ${
        active
          ? "bg-[#1a1a1a] text-[#FAF7F2] border-[#1a1a1a]"
          : "bg-transparent text-[#666] border-[#d4cfc8] hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FAF7F2" }}>
      <header className="border-b border-[#e8e2d9] px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-end justify-between">
          <div>
            <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "3.5rem", fontWeight: 300, letterSpacing: "-0.02em", color: "#1a1a1a", lineHeight: 1 }}>
              Checked In
            </h1>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginTop: "6px" }}>
              Your personal hotel tracker
            </p>
            <p style={{ fontSize: "0.7rem", color: "#bbb", marginTop: "4px" }}>
              by Melissa Cheng
            </p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: "0.75rem", color: "#999" }}>
              <span style={{ color: "#1a1a1a", fontWeight: 500 }}>{hotels.filter((h) => h.status === "Visited").length}</span> visited
              <span style={{ margin: "0 8px", color: "#d4cfc8" }}>·</span>
              <span style={{ color: "#1a1a1a", fontWeight: 500 }}>{hotels.filter((h) => h.status === "Bucket List").length}</span> to go
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-start justify-between gap-8 mb-10">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", width: "3.5rem", flexShrink: 0 }}>Status</span>
              {(["All", "Bucket List", "Visited"] as StatusFilter[]).map((f) => (
                <FilterPill key={f} label={f} active={statusFilter === f} onClick={() => setStatusFilter(f)} />
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", width: "3.5rem", flexShrink: 0 }}>Region</span>
              <FilterPill label="All" active={regionFilter === "All"} onClick={() => { setRegionFilter("All"); setCountryFilter("All"); }} />
              {allRegions.map((r) => (
                <FilterPill key={r} label={r} active={regionFilter === r} onClick={() => { setRegionFilter(r); setCountryFilter("All"); }} />
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", width: "3.5rem", flexShrink: 0 }}>Country</span>
              <FilterPill label="All" active={countryFilter === "All"} onClick={() => setCountryFilter("All")} />
              {allCountries.map((c) => (
                <FilterPill key={c} label={c} active={countryFilter === c} onClick={() => setCountryFilter(c)} />
              ))}
            </div>
          </div>

          <div className="flex gap-1 border border-[#e8e2d9] rounded-full p-1 shrink-0">
            <button
              onClick={() => setView("list")}
              className={`px-4 py-1.5 rounded-full text-xs tracking-wide transition-all ${
                view === "list" ? "bg-[#1a1a1a] text-[#FAF7F2]" : "text-[#999] hover:text-[#1a1a1a]"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView("map")}
              className={`px-4 py-1.5 rounded-full text-xs tracking-wide transition-all ${
                view === "map" ? "bg-[#1a1a1a] text-[#FAF7F2]" : "text-[#999] hover:text-[#1a1a1a]"
              }`}
            >
              Map
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#999", fontSize: "0.875rem", letterSpacing: "0.05em" }}>Loading...</p>
        ) : view === "map" ? (
          <HotelMap hotels={filtered} />
        ) : filtered.length === 0 ? (
          <p style={{ color: "#999", fontSize: "0.875rem" }}>No hotels match these filters.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
            {sortedRegions.map((region) => (
              <div key={region}>
                <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "2.25rem", fontWeight: 300, color: "#1a1a1a", marginBottom: "2rem" }}>
                  {region}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                  {Object.keys(grouped[region]).sort().map((country) => (
                    <div key={country}>
                      <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid #e8e2d9" }}>
                        {country}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {grouped[region][country].map((hotel) => (
                          <div key={hotel.id} style={{ border: "1px solid #e8e2d9", borderRadius: "8px", padding: "1.25rem", background: "white", transition: "border-color 0.2s" }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = "#1a1a1a")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "#e8e2d9")}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem" }}>
                              <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.2rem", fontWeight: 300, color: "#1a1a1a", lineHeight: 1.3 }}>
                                {hotel.name}
                              </h3>
                              <span style={{
                                flexShrink: 0, fontSize: "0.65rem", padding: "2px 8px", borderRadius: "999px", border: "1px solid",
                                ...(hotel.status === "Visited"
                                  ? { borderColor: "#6ee7b7", color: "#065f46", background: "#ecfdf5" }
                                  : { borderColor: "#e8e2d9", color: "#999", background: "transparent" })
                              }}>
                                {hotel.status === "Visited" ? "✓" : "✦"}
                              </span>
                            </div>
                            <p style={{ fontSize: "0.75rem", color: "#999" }}>
                              {[hotel.city, hotel.stateArea].filter(Boolean).join(", ")}
                            </p>
                            {hotel.notes && (
                              <p style={{ fontSize: "0.7rem", color: "#aaa", marginTop: "0.5rem", fontStyle: "italic", lineHeight: 1.5 }}>
                                {hotel.notes}
                              </p>
                            )}
                            {hotel.url && (
                              <a href={hotel.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", color: "#999", marginTop: "0.75rem", display: "inline-block", textDecoration: "none" }}
                                onMouseEnter={e => ((e.target as HTMLElement).style.color = "#1a1a1a")}
                                onMouseLeave={e => ((e.target as HTMLElement).style.color = "#999")}
                              >
                                Visit site →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
