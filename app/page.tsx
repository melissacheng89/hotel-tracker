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
            <h1 className="text-5xl font-light tracking-tight text-[#1a1a1a]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Checked In
            </h1>
            <p className="text-xs tracking-widest text-[#999] uppercase mt-1">
              A personal hotel black book
            </p>
            <p className="text-xs text-[#bbb] mt-1">
  by Melissa Cheng
</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#999]">
              <span className="text-[#1a1a1a] font-medium">{hotels.filter((h) => h.status === "Visited").length}</span> visited
              <span className="mx-2 text-[#d4cfc8]">·</span>
              <span className="text-[#1a1a1a] font-medium">{hotels.filter((h) => h.status === "Bucket List").length}</span> to go
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-start justify-between gap-8 mb-10">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-widest text-[#999] w-14 shrink-0">Status</span>
              {(["All", "Bucket List", "Visited"] as StatusFilter[]).map((f) => (
                <FilterPill key={f} label={f} active={statusFilter === f} onClick={() => setStatusFilter(f)} />
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-widest text-[#999] w-14 shrink-0">Region</span>
              <FilterPill label="All" active={regionFilter === "All"} onClick={() => { setRegionFilter("All"); setCountryFilter("All"); }} />
              {allRegions.map((r) => (
                <FilterPill key={r} label={r} active={regionFilter === r} onClick={() => { setRegionFilter(r); setCountryFilter("All"); }} />
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-widest text-[#999] w-14 shrink-0">Country</span>
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
          <p className="text-[#999] text-sm tracking-wide">Loading...</p>
        ) : view === "map" ? (
          <HotelMap hotels={filtered} />
        ) : filtered.length === 0 ? (
          <p className="text-[#999] text-sm">No hotels match these filters.</p>
        ) : (
          <div className="space-y-16">
            {sortedRegions.map((region) => (
              <div key={region}>
                <h2 className="text-3xl font-light mb-8" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#1a1a1a" }}>
                  {region}
                </h2>
                <div className="space-y-10">
                  {Object.keys(grouped[region]).sort().map((country) => (
                    <div key={country}>
                      <p className="text-xs uppercase tracking-widest text-[#999] mb-4 pb-2 border-b border-[#e8e2d9]">
                        {country}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {grouped[region][country].map((hotel) => (
                          <div key={hotel.id} className="group border border-[#e8e2d9] rounded-lg p-5 hover:border-[#1a1a1a] transition-all duration-200 bg-white">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-light text-[#1a1a1a] leading-snug text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                {hotel.name}
                              </h3>
                              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${
                                hotel.status === "Visited"
                                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                  : "border-[#e8e2d9] text-[#999]"
                              }`}>
                                {hotel.status === "Visited" ? "✓" : "✦"}
                              </span>
                            </div>
                            <p className="text-xs text-[#999]">
                              {[hotel.city, hotel.stateArea].filter(Boolean).join(", ")}
                            </p>
                            {hotel.notes && (
                              <p className="text-xs text-[#aaa] mt-2 italic leading-relaxed">{hotel.notes}</p>
                            )}
                            {hotel.url && (
                              <a href={hotel.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#999] hover:text-[#1a1a1a] mt-3 inline-block transition-colors">
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
