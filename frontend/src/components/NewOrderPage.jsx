import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { CategoryBadge } from "./CategoryBadge";
import { OrderItemsBreakdown } from "./OrderItemsBreakdown";

export function NewOrderPage() {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]); // [{ productId, quantity }]

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const [clientsData, productsData] = await Promise.all([
        api.getClients(),
        api.getProducts(),
      ]);
      setClients(clientsData);
      setProducts(productsData);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const productsById = useMemo(() => {
    const map = new Map();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => p.name.toLowerCase().includes(term));
  }, [products, search]);

  function addToCart(productId) {
    setCart((prev) => {
      if (prev.some((line) => line.productId === productId)) return prev;
      return [...prev, { productId, quantity: 1 }];
    });
  }

  function updateQuantity(productId, quantity) {
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, quantity } : line
      )
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  }

  const cartHasInvalidQuantities = cart.some((line) => {
    const product = productsById.get(line.productId);
    return (
      !line.quantity ||
      line.quantity <= 0 ||
      (product && line.quantity > product.availableStock)
    );
  });

  const canConfirm =
    clientId && cart.length > 0 && !cartHasInvalidQuantities && !submitting;

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await api.createOrder({
        clientId: Number(clientId),
        items: cart.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
      });
      setConfirmedOrder(order);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startNewOrder() {
    setConfirmedOrder(null);
    setCart([]);
    setClientId("");
    setSearch("");
    setSubmitError(null);
    loadData(); // refresh stock, ya que el pedido confirmado consumió lotes
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Cargando datos...</div>;
  }

  if (loadError) {
    return (
      <div className="p-8 text-red-600">
        Error al cargar datos: {loadError}
      </div>
    );
  }

  if (confirmedOrder) {
    return <OrderConfirmation order={confirmedOrder} onNewOrder={startNewOrder} />;
  }

  const selectedClient = clients.find((c) => String(c.id) === String(clientId));

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">Toma de pedidos</h1>

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Cliente
        </label>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">Seleccionar cliente...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type})
            </option>
          ))}
        </select>
        {selectedClient && (
          <p className="mt-2 text-sm text-gray-500">{selectedClient.address}</p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-gray-900">Productos</h2>
            <input
              type="text"
              placeholder="Buscar producto..."
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none sm:w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filteredProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No se encontraron productos.</p>
          ) : (
            <div className="max-h-[28rem] overflow-y-auto">
              {/* Mobile: stacked cards */}
              <ul className="space-y-2 sm:hidden">
                {filteredProducts.map((p) => {
                  const inCart = cart.some((line) => line.productId === p.id);
                  return (
                    <li key={p.id} className="rounded-lg border border-gray-100 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-gray-900">{p.name}</span>
                        <CategoryBadge category={p.category} />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {p.availableStock} {p.unit} disponibles
                        </span>
                        <button
                          type="button"
                          disabled={inCart || p.availableStock <= 0}
                          onClick={() => addToCart(p.id)}
                          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          {inCart ? "Agregado" : "Agregar"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Tablet+: table */}
              <table className="hidden w-full text-sm sm:table">
                <thead className="sticky top-0 bg-white text-left text-gray-500">
                  <tr className="border-b border-gray-200">
                    <th className="py-2 font-medium">Producto</th>
                    <th className="py-2 font-medium">Categoría</th>
                    <th className="py-2 font-medium">Stock</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const inCart = cart.some((line) => line.productId === p.id);
                    return (
                      <tr key={p.id} className="border-b border-gray-100">
                        <td className="py-2 text-gray-900">{p.name}</td>
                        <td className="py-2">
                          <CategoryBadge category={p.category} />
                        </td>
                        <td className="whitespace-nowrap py-2 text-gray-600">
                          {p.availableStock} {p.unit}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            disabled={inCart || p.availableStock <= 0}
                            onClick={() => addToCart(p.id)}
                            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            {inCart ? "Agregado" : "Agregar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-gray-900">Pedido actual</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-gray-400">Todavía no agregaste productos.</p>
          ) : (
            <ul className="mb-4 space-y-3">
              {cart.map((line) => {
                const product = productsById.get(line.productId);
                const exceedsStock = line.quantity > product.availableStock;
                return (
                  <li key={line.productId} className="rounded-md border border-gray-100 p-2">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {product.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(line.productId)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        quitar
                      </button>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={line.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            line.productId,
                            Math.max(1, Math.round(Number(e.target.value) || 0))
                          )
                        }
                        className={`w-24 rounded-md border px-2 py-1 text-sm focus:outline-none ${
                          exceedsStock
                            ? "border-red-400 focus:border-red-500"
                            : "border-gray-300 focus:border-blue-500"
                        }`}
                      />
                      <span className="text-xs text-gray-500">{product.unit}</span>
                    </div>
                    {exceedsStock && (
                      <p className="mt-1 text-xs text-red-500">
                        Supera el stock disponible ({product.availableStock} {product.unit})
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {submitError && (
            <p className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-600">
              {submitError}
            </p>
          )}

          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="w-full rounded-md bg-green-600 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? "Confirmando..." : "Confirmar pedido"}
          </button>
        </section>
      </div>
    </div>
  );
}

function OrderConfirmation({ order, onNewOrder }) {
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <h1 className="text-xl font-semibold text-green-800">
          Pedido #{order.id} confirmado
        </h1>
        <p className="text-sm text-green-700">
          Cliente: {order.client.name} — Estado: pendiente de picking
        </p>
      </div>

      <div className="mt-6">
        <OrderItemsBreakdown items={order.items} />
      </div>

      <button
        type="button"
        onClick={onNewOrder}
        className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Nuevo pedido
      </button>
    </div>
  );
}
