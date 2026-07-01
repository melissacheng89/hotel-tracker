"use client";

import { useEffect, useState, useRef } from "react";
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
type Sort = "az" | "za" | "visited-first";

const ACCENT = "#4A5F8A";
const ACCENT_LIGHT = "#E8ECF4";
const ACCENT_BORDER = "#A8B4D0";

export default function Home() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [regionFilter, setRegionFilter] = useState<string>("All");
  const [countryFilter, setCountryFilter] = useState<string>("All");
  const [view, setView] = useState<View>("list");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("az");
  const [surpriseId, setSurpriseId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch("/api/hotels")
      .then((res) => res.json())
      .then((data) => {
        setHotels(data);
        setLoading(false);
      });
  }, []);

  const handleSurprise = () => {
    const wishlist = hotels.filter((h) => h.status === "Bucket List");
    if (wishlist.length === 0) return;
    const pick = wishlist[Math.floor(Math.random() * wishlist.length)];
    setView("list");
    setStatusFilter("All");
    setRegionFilter("All");
    setCountryFilter("All");
    setSearch("");
    setSurpriseId(pick.id);
    setTimeout(() => {
      const el = cardRefs.current[pick.id];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("surprise-pulse");
        setTimeout(() => {
          el.classList.remove("surprise-pulse");
          setSurpriseId(null);
        }, 2000);
      }
    }, 100);
  };

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

  const searchLower = search.trim().toLowerCase();

  const filtered = hotels.filter((h) => {
    const matchesStatus = statusFilter === "All" || h.status === statusFilter;
    const matchesRegion = regionFilter === "All" || h.region === regionFilter;
    const matchesCountry = countryFilter === "All" || h.country === countryFilter;
    const matchesSearch =
      searchLower === "" ||
      h.name.toLowerCase().includes(searchLower) ||
      h.city.toLowerCase().includes(searchLower) ||
      h.stateArea.toLowerCase().includes(searchLower) ||
      h.country.toLowerCase().includes(searchLower);
    return matchesStatus && matchesRegion && matchesCountry && matchesSearch;
  });

  const sortHotels = (list: Hotel[]) => {
    if (sort === "za") return [...list].sort((a, b) => b.name.localeCompare(a.name));
    if (sort === "visited-first") return [...list].sort((a, b) => {
      if (a.status === "Visited" && b.status !== "Visited") return -1;
      if (a.status !== "Visited" && b.status === "Visited") return 1;
      return a.name.localeCompare(b.name);
    });
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  };

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
      style={{
        padding: "6px 14px",
        borderRadius: "999px",
        fontSize: "0.7rem",
        letterSpacing: "0.05em",
        border: "1px solid",
        whiteSpace: "nowrap",
        flexShrink: 0,
        cursor: "pointer",
        transition: "all 0.15s",
        background: active ? ACCENT : "transparent",
        color: active ? "#FAF7F2" : "#666",
        borderColor: active ? ACCENT : "#d4cfc8",
      }}
    >
      {label}
    </button>
  );

  const FilterRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", width: "52px", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px", msOverflowStyle: "none", scrollbarWidth: "none" }}>
        {children}
      </div>
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#FAF7F2" }}>
      <header style={{ borderBottom: "1px solid #e8e2d9", padding: "20px 24px" }}>
        <div style={{ maxWidth: "1152px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(3rem, 8vw, 3.5rem)", fontWeight: 300, letterSpacing: "-0.02em", color: "#1a1a1a", lineHeight: 1 }}>
                Checked In
              </h1>
              <p style={{ fontSize: "0.6rem", letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginTop: "6px" }}>
                Your personal hotel tracker
              </p>
              <p style={{ fontSize: "0.65rem", color: "#bbb", marginTop: "3px" }}>
                by Melissa Cheng
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontSize: "0.7rem", color: "#999", marginBottom: "8px" }}>
                <span style={{ color: "#1a1a1a", fontWeight: 500 }}>{hotels.filter((h) => h.status === "Visited").length}</span> visited
                <span style={{ margin: "0 6px", color: "#d4cfc8" }}>·</span>
                <span style={{ color: "#1a1a1a", fontWeight: 500 }}>{hotels.filter((h) => h.status === "Bucket List").length}</span> to go
              </p>
              <button
                onClick={handleSurprise}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "0.65rem",
                  letterSpacing: "0.08em",
                  border: `1px solid ${ACCENT_BORDER}`,
                  background: ACCENT_LIGHT,
                  color: ACCENT,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ✦ Surprise me
              </button>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "24px 24px" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hotels, cities, countries..."
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #e8e2d9",
              fontSize: "0.85rem",
              background: "white",
              color: "#1a1a1a",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = ACCENT)}
            onBlur={(e) => (e.target.style.borderColor = "#e8e2d9")}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #e8e2d9",
              fontSize: "0.75rem",
              background: "white",
              color: "#666",
              outline: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="visited-first">Visited first</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, minWidth: 0 }}>
            <FilterRow label="Status">
              {(["All", "Bucket List", "Visited"] as StatusFilter[]).map((f) => (
                <FilterPill key={f} label={f} active={statusFilter === f} onClick={() => setStatusFilter(f)} />
              ))}
            </FilterRow>
            <FilterRow label="Region">
              <FilterPill label="All" active={regionFilter === "All"} onClick={() => { setRegionFilter("All"); setCountryFilter("All"); }} />
              {allRegions.map((r) => (
                <FilterPill key={r} label={r} active={regionFilter === r} onClick={() => { setRegionFilter(r); setCountryFilter("All"); }} />
              ))}
            </FilterRow>
            <FilterRow label="Country">
              <FilterPill label="All" active={countryFilter === "All"} onClick={() => setCountryFilter("All")} />
              {allCountries.map((c) => (
                <FilterPill key={c} label={c} active={countryFilter === c} onClick={() => setCountryFilter(c)} />
              ))}
            </FilterRow>
          </div>

          <div style={{ display: "flex", gap: "4px", border: "1px solid #e8e2d9", borderRadius: "999px", padding: "4px", flexShrink: 0 }}>
            {(["list", "map"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "999px",
                  fontSize: "0.7rem",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  border: "none",
                  background: view === v ? ACCENT : "transparent",
                  color: view === v ? "#FAF7F2" : "#999",
                  textTransform: "capitalize",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#999", fontSize: "0.875rem" }}>Loading...</p>
        ) : view === "map" ? (
          <HotelMap hotels={filtered} />
        ) : filtered.length === 0 ? (
          <p style={{ color: "#999", fontSize: "0.875rem" }}>No hotels match these filters.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4rem" }}>
            {sortedRegions.map((region) => (
              <div key={region}>
                <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.5rem", fontWeight: 300, color: "#1a1a1a", marginBottom: "1.5rem" }}>
                  {region}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  {Object.keys(grouped[region]).sort().map((country) => (
                    <div key={country}>
                      <p style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "1px solid #e8e2d9" }}>
                        {country}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortHotels(grouped[region][country]).map((hotel) => (
                          <div
                            key={hotel.id}
                            ref={(el) => { cardRefs.current[hotel.id] = el; }}
                            style={{ border: `1px solid ${ACCENT_BORDER}`, borderRadius: "8px", padding: "1.25rem", background: "white" }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = surpriseId === hotel.id ? ACCENT : ACCENT_BORDER)}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                              <h3 style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.15rem", fontWeight: 300, color: "#1a1a1a", lineHeight: 1.3 }}>
                                {hotel.name}
                              </h3>
                              <span style={{
                                flexShrink: 0, fontSize: "0.6rem", padding: "2px 8px", borderRadius: "999px", border: "1px solid",
                                ...(hotel.status === "Visited"
                                  ? { borderColor: "#6ee7b7", color: "#065f46", background: "#ecfdf5" }
                                  : { borderColor: ACCENT_BORDER, color: ACCENT, background: ACCENT_LIGHT })
                              }}>
                                {hotel.status === "Visited" ? "✓" : "✦"}
                              </span>
                            </div>
                            <p style={{ fontSize: "0.72rem", color: "#999" }}>
                              {[hotel.city, hotel.stateArea].filter(Boolean).join(", ")}
                            </p>
                            {hotel.notes && (
                              <p style={{ fontSize: "0.68rem", color: "#aaa", marginTop: "6px", fontStyle: "italic", lineHeight: 1.5 }}>
                                {hotel.notes}
                              </p>
                            )}
                            {hotel.url && (
                              <a
                                href={hotel.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: "0.68rem", color: ACCENT, marginTop: "10px", display: "inline-block", textDecoration: "none" }}
                                onMouseEnter={e => ((e.target as HTMLElement).style.color = "#1a1a1a")}
                                onMouseLeave={e => ((e.target as HTMLElement).style.color = ACCENT)}
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
