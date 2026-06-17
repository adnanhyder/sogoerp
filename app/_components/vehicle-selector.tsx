"use client";

import { useState } from "react";

type VehicleData = Record<string, Record<string, string[]>>;

const VEHICLE_DATA: VehicleData = {
  Car: {
    Toyota: ["Corolla", "Yaris", "Prius", "Land Cruiser", "Hilux", "Vitz", "Aqua"],
    Honda: ["Civic", "City", "Accord", "BR-V", "Vezel"],
    Suzuki: ["Cultus", "Swift", "Alto", "Mehran", "Wagon R", "Bolan"],
    Kia: ["Sportage", "Picanto", "Stonic", "Sorento"],
    Hyundai: ["Tucson", "Elantra", "Sonata"],
    Changan: ["Alsvin", "Oshan X7"],
    Other: ["Other"],
  },
  Truck: {
    Hino: ["Dutro", "Ranger", "Profia"],
    Isuzu: ["N-Series", "F-Series"],
    FAW: ["Tiger", "J5"],
    Master: ["Foton"],
    Other: ["Other"],
  },
  Van: {
    Suzuki: ["Bolan", "APV"],
    Toyota: ["Hiace", "Alphard"],
    Hyundai: ["Grand Starex"],
    Changan: ["Karvaan"],
    Other: ["Other"],
  },
  Motorcycle: {
    Honda: ["CD 70", "CG 125", "Pridor", "CB 150F"],
    Yamaha: ["YBR 125", "YB 125Z", "YBR 125G"],
    Suzuki: ["GS 150", "GD 110S", "GR 150"],
    United: ["US 70", "US 125"],
    RoadPrince: ["RP 70", "RP 125"],
    Other: ["Other"],
  },
  "E-Bike": {
    Jolta: ["JE-70", "JE-100"],
    Metro: ["T9", "E-Bike"],
    Evee: ["C1"],
    Other: ["Other"],
  },
  Other: {
    Other: ["Other"],
  },
};

type VehicleSelectorProps = {
  name: string;
};

export function VehicleSelector({ name }: VehicleSelectorProps) {
  const [type, setType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const types = Object.keys(VEHICLE_DATA);
  const brands = type && VEHICLE_DATA[type] ? Object.keys(VEHICLE_DATA[type]) : [];
  const models = type && brand && VEHICLE_DATA[type][brand] ? VEHICLE_DATA[type][brand] : [];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => String(currentYear - i));

  // Determine what value gets submitted. Only construct a full string if at least type is selected.
  const combinedValue = [type, brand, model, year].filter(Boolean).join(" - ");

  // Determine how many columns to show
  let visibleCount = 1;
  if (type) visibleCount++;
  if (brand) visibleCount++;
  if (model) visibleCount++;

  const gridClass =
    visibleCount === 1 ? "grid-cols-1" :
    visibleCount === 2 ? "md:grid-cols-2" :
    visibleCount === 3 ? "md:grid-cols-3" :
    "md:grid-cols-4";

  return (
    <div className={`grid gap-2 ${gridClass} transition-all duration-300`}>
      <input type="hidden" name={name} value={combinedValue} />
      
      <label className="group relative block animate-[slideUpFade_0.6s_ease-out_both]" style={{ animationDelay: '0.1s' }}>
        <span className="mb-2 block text-[13px] font-extrabold uppercase tracking-wider text-gray-700 transition-all duration-300 group-focus-within:text-[#FAC54D]">Vehicle Type</span>
        <select
          className="h-14 w-full appearance-none rounded-[14px] border-2 border-gray-300 bg-white px-5 text-[16px] font-bold text-gray-900 shadow-sm outline-none transition-all duration-300 hover:border-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
          onChange={(e) => {
            setType(e.target.value);
            setBrand("");
            setModel("");
            setYear("");
          }}
          value={type}
        >
          <option value="">Select Type</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      {type && (
        <label className="group relative block animate-[slideUpFade_0.6s_ease-out_both]" style={{ animationDelay: '0.15s' }}>
          <span className="mb-2 block text-[13px] font-extrabold uppercase tracking-wider text-gray-700 transition-all duration-300 group-focus-within:text-[#FAC54D]">Brand</span>
          <select
            className="h-14 w-full appearance-none rounded-[14px] border-2 border-gray-300 bg-white px-5 text-[16px] font-bold text-gray-900 shadow-sm outline-none transition-all duration-300 hover:border-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
            onChange={(e) => {
              setBrand(e.target.value);
              setModel("");
              setYear("");
            }}
            value={brand}
          >
            <option value="">Select Brand</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      )}

      {brand && (
        <label className="group relative block animate-[slideUpFade_0.6s_ease-out_both]" style={{ animationDelay: '0.2s' }}>
          <span className="mb-2 block text-[13px] font-extrabold uppercase tracking-wider text-gray-700 transition-all duration-300 group-focus-within:text-[#FAC54D]">Model</span>
          <select
            className="h-14 w-full appearance-none rounded-[14px] border-2 border-gray-300 bg-white px-5 text-[16px] font-bold text-gray-900 shadow-sm outline-none transition-all duration-300 hover:border-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
            onChange={(e) => {
              setModel(e.target.value);
              setYear("");
            }}
            value={model}
          >
            <option value="">Select Model</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      )}

      {model && (
        <label className="group relative block animate-[slideUpFade_0.6s_ease-out_both]" style={{ animationDelay: '0.25s' }}>
          <span className="mb-2 block text-[13px] font-extrabold uppercase tracking-wider text-gray-700 transition-all duration-300 group-focus-within:text-[#FAC54D]">Manufacture Year</span>
          <select
            className="h-14 w-full appearance-none rounded-[14px] border-2 border-gray-300 bg-white px-5 text-[16px] font-bold text-gray-900 shadow-sm outline-none transition-all duration-300 hover:border-gray-400 focus:border-[#FAC54D] focus:ring-4 focus:ring-[#FAC54D]/20"
            onChange={(e) => setYear(e.target.value)}
            value={year}
          >
            <option value="">Select Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
