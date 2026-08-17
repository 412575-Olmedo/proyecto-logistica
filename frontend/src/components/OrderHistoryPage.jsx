import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { StatusBadge } from "./StatusBadge";
import { OrderItemsBreakdown } from "./OrderItemsBreakdown";
import { ClientFilter } from "./ClientFilter";

export function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [clientFilter, setClientFilter] = useState("");

  useEffect(() => {
    Promise.all([api.getOrders(), api.getClients()])
      .then(([ordersData, clientsData]) => {
        setOrders(ordersData);
        setClients(clientsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(() => {
    if (!clientFilter) return orders;
    return orders.filter((o) => String(o.client.id) === clientFilter);
  }, [orders, clientFilter]);

  if (loading) {
    return <div className="p-8 text-gray-500">Cargando pedidos...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error al cargar pedidos: {error}</div>;
  }

  if (selectedOrder) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <button
          type="button"
          onClick={() => setSelectedOrder(null)}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← Volver al historial
        </button>
        <div className="mb-6 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Pedido #{selectedOrder.id}
            </h1>
            <p className="text-sm text-gray-500">
              {selectedOrder.client.name} ·{" "}
              {new Date(selectedOrder.date).toLocaleDateString("es-AR")}
            </p>
          </div>
          <StatusBadge status={selectedOrder.status} />
        </div>
        <OrderItemsBreakdown items={selectedOrder.items} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Historial de pedidos</h1>
        <ClientFilter clients={clients} value={clientFilter} onChange={setClientFilter} />
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-sm text-gray-400">
          {orders.length === 0
            ? "Todavía no se registraron pedidos."
            : "Ningún pedido coincide con ese cliente."}
        </p>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <ul className="space-y-2 sm:hidden">
            {filteredOrders.map((order) => (
              <li key={order.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{order.id} — {order.client.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.date).toLocaleDateString("es-AR")} · {order.items.length} ítems
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                >
                  Ver detalle
                </button>
              </li>
            ))}
          </ul>

          {/* Tablet+: table */}
          <div className="hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 font-medium">Pedido</th>
                    <th className="px-4 py-2 font-medium">Cliente</th>
                    <th className="px-4 py-2 font-medium">Fecha</th>
                    <th className="px-4 py-2 font-medium">Ítems</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
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
                      <td className="px-4 py-2">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Ver detalle
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
