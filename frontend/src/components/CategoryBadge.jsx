const STYLES = {
  seco: "bg-amber-100 text-amber-800",
  refrigerado: "bg-cyan-100 text-cyan-800",
  congelado: "bg-blue-100 text-blue-800",
};

export function CategoryBadge({ category }) {
  const style = STYLES[category] || "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-block shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style}`}>
      {category}
    </span>
  );
}
