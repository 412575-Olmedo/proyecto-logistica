const LABELS = {
  pendiente_picking: "Pendiente de picking",
  listo_para_entregar: "Listo para entregar",
};

const STYLES = {
  pendiente_picking: "bg-yellow-100 text-yellow-800",
  listo_para_entregar: "bg-green-100 text-green-800",
};

export function StatusBadge({ status }) {
  const style = STYLES[status] || "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-block shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
      {LABELS[status] || status}
    </span>
  );
}
