export function OrderItemsBreakdown({ items }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="font-medium text-gray-900">
            {item.product.name} — {item.quantityRequested} {item.product.unit}
          </p>
          <p className="mb-2 text-xs text-gray-500">Lotes asignados (FEFO):</p>
          <ul className="space-y-1">
            {item.allocations.map((alloc) => (
              <li
                key={alloc.id}
                className="flex flex-col gap-0.5 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
              >
                <span>
                  Lote #{alloc.batchId} — {alloc.batch.section.name}
                </span>
                <span className="text-gray-500 sm:text-gray-700">
                  {alloc.quantityAllocated} {item.product.unit} · vence{" "}
                  {new Date(alloc.batch.expirationDate).toLocaleDateString("es-AR")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
