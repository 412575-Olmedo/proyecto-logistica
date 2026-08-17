export function ClientFilter({ clients, value, onChange }) {
  return (
    <select
      className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none sm:w-56"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Todos los clientes</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
