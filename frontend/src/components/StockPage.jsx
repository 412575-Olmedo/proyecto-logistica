import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { CategoryBadge } from "./CategoryBadge";

const ALERT_DAYS = 7;

const CATEGORY_FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "seco", label: "Seco" },
  { id: "refrigerado", label: "Refrigerado" },
  { id: "congelado", label: "Congelado" },
];

function daysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / msPerDay);
}

function locationLabel(section) {
  return section.parent ? `${section.parent.name} > ${section.name}` : section.name;
}

function ExpirationCell({ dateStr }) {
  const days = daysUntil(dateStr);
  const formatted = new Date(dateStr).toLocaleDateString("es-AR");

  let badge = null;
  if (days < 0) {
    badge = <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">Vencido</span>;
  } else if (days <= ALERT_DAYS) {
    badge = (
      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        {days === 0 ? "Vence hoy" : `Vence en ${days} día${days === 1 ? "" : "s"}`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center">
      {formatted}
      {badge}
    </span>
  );
}

export function StockPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");

  useEffect(() => {
    api
      .getStock()
      .then(setBatches)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return batches.filter((b) => {
      const matchesSearch = !term || b.product.name.toLowerCase().includes(term);
      const matchesCategory = category === "todas" || b.product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [batches, search, category]);

  if (loading) {
    return <div className="p-8 text-gray-500">Cargando stock...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error al cargar stock: {error}</div>;
  }

  const soonExpiringCount = batches.filter((b) => daysUntil(b.expirationDate) <= ALERT_DAYS).length;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Stock y vencimientos</h1>
        {soonExpiringCount > 0 && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
            {soonExpiringCount} lote{soonExpiringCount === 1 ? "" : "s"} por vencer
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                category === c.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar producto..."
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none sm:w-56"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white py-8 text-center text-sm text-gray-400 shadow-sm">
          No se encontraron lotes.
        </p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <ul className="space-y-2 sm:hidden">
            {filtered.map((b) => {
              const alert = daysUntil(b.expirationDate) <= ALERT_DAYS;
              return (
                <li
                  key={b.id}
                  className={`rounded-xl border p-3 shadow-sm ${
                    alert ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">{b.product.name}</span>
                    <CategoryBadge category={b.product.category} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{locationLabel(b.section)}</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {b.quantity} {b.product.unit}
                    </span>
                    <ExpirationCell dateStr={b.expirationDate} />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Tablet+: table */}
          <div className="hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 font-medium">Producto</th>
                    <th className="px-4 py-2 font-medium">Categoría</th>
                    <th className="px-4 py-2 font-medium">Ubicación</th>
                    <th className="px-4 py-2 font-medium">Cantidad</th>
                    <th className="px-4 py-2 font-medium">Vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const alert = daysUntil(b.expirationDate) <= ALERT_DAYS;
                    return (
                      <tr
                        key={b.id}
                        className={`border-b border-gray-100 last:border-0 ${alert ? "bg-red-50" : ""}`}
                      >
                        <td className="px-4 py-2 text-gray-900">{b.product.name}</td>
                        <td className="px-4 py-2">
                          <CategoryBadge category={b.product.category} />
                        </td>
                        <td className="px-4 py-2 text-gray-600">{locationLabel(b.section)}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {b.quantity} {b.product.unit}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          <ExpirationCell dateStr={b.expirationDate} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
