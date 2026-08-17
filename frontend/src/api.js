const BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `El servidor respondió algo inesperado (no JSON) en ${path}. ¿Está bien configurada la URL del backend (VITE_API_URL)?`
    );
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Error inesperado del servidor");
  }
  return data;
}

export const api = {
  getClients: () => request("/clients"),
  getProducts: () => request("/products"),
  createOrder: (payload) =>
    request("/orders", { method: "POST", body: JSON.stringify(payload) }),
  getOrders: (status) => request(status ? `/orders?status=${status}` : "/orders"),
  getOrder: (id) => request(`/orders/${id}`),
  getStock: () => request("/stock"),
  setAllocationPicked: (orderId, allocationId, picked) =>
    request(`/orders/${orderId}/allocations/${allocationId}`, {
      method: "PATCH",
      body: JSON.stringify({ picked }),
    }),
};
