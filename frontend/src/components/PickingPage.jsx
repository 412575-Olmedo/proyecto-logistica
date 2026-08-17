import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { StatusBadge } from "./StatusBadge";
import { ClientFilter } from "./ClientFilter";

export function PickingPage() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [clientFilter, setClientFilter] = useState("");

  useEffect(() => {
    loadOrders();
    api.getClients().then(setClients).catch(() => {});
  }, []);

  function loadOrders() {
    setLoading(true);
    setError(null);
    return api
      .getOrders("pendiente_picking")
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function handleBack() {
    setSelectedOrderId(null);
    loadOrders();
  }

  const filteredOrders = useMemo(() => {
    if (!clientFilter) return orders;
    return orders.filter((o) => String(o.client.id) === clientFilter);
  }, [orders, clientFilter]);

  if (selectedOrderId) {
    return <PickingDetail orderId={selectedOrderId} onBack={handleBack} />;
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Picking</h1>
        <ClientFilter clients={clients} value={clientFilter} onChange={setClientFilter} />
      </div>

      {loading && <p className="text-gray-500">Cargando pedidos...</p>}
      {error && <p className="text-red-600">Error al cargar pedidos: {error}</p>}

      {!loading && !error && filteredOrders.length === 0 && (
        <p className="text-sm text-gray-400">
          {orders.length === 0
            ? "No hay pedidos pendientes de picking."
            : "Ningún pedido pendiente coincide con ese cliente."}
        </p>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <>
          {/* Mobile: stacked cards */}
          <ul className="space-y-2 sm:hidden">
            {filteredOrders.map((order) => (
              <li key={order.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  #{order.id} — {order.client.name}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(order.date).toLocaleDateString("es-AR")} · {order.items.length} ítems
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className="mt-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Armar pedido
                </button>
              </li>
            ))}
          </ul>

          {/* Tablet+: table */}
          <div className="hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 font-medium">Pedido</th>
                    <th className="px-4 py-2 font-medium">Cliente</th>
                    <th className="px-4 py-2 font-medium">Fecha</th>
                    <th className="px-4 py-2 font-medium">Ítems</th>
                    <th className="px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-2 text-gray-900">#{order.id}</td>
                      <td className="px-4 py-2 text-gray-700">{order.client.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                        {new Date(order.date).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-4 py-2 text-gray-500">{order.items.length}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          Armar pedido
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PickingDetail({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    api
      .getOrder(orderId)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  async function toggleAllocation(allocationId, picked) {
    setSavingId(allocationId);
    setError(null);
    try {
      const updated = await api.setAllocationPicked(orderId, allocationId, picked);
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Cargando pedido...</div>;
  if (error && !order) return <div className="p-8 text-red-600">Error: {error}</div>;

  const isReady = order.status === "listo_para_entregar";

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm text-blue-600 hover:underline"
      >
        ← Volver al listado
      </button>

      <div
        className={`mb-6 flex flex-col gap-2 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
          isReady ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"
        }`}
      >
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pedido #{order.id}</h1>
          <p className="text-sm text-gray-500">
            {order.client.name} · {new Date(order.date).toLocaleDateString("es-AR")}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {isReady && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          Todos los ítems fueron juntados. El pedido está listo para entregar.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}

      <div className="space-y-4">
        {order.items.map((item) => (
          <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-2 font-medium text-gray-900">
              {item.product.name} — {item.quantityRequested} {item.product.unit}
            </p>
            <ul className="space-y-2">
              {item.allocations.map((alloc) => (
                <li key={alloc.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={alloc.picked}
                    disabled={savingId === alloc.id}
                    onChange={(e) => toggleAllocation(alloc.id, e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex flex-1 flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className={alloc.picked ? "text-gray-400 line-through" : "text-gray-700"}>
                      Lote #{alloc.batchId} — {alloc.batch.section.name}
                    </span>
                    <span className={alloc.picked ? "text-gray-400" : "text-gray-600"}>
                      {alloc.quantityAllocated} {item.product.unit}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
