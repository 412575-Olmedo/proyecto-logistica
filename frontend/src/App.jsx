import { useState } from "react";
import { ShoppingCart, Package, ClipboardList, History, Warehouse } from "lucide-react";
import { NewOrderPage } from "./components/NewOrderPage";
import { OrderHistoryPage } from "./components/OrderHistoryPage";
import { StockPage } from "./components/StockPage";
import { PickingPage } from "./components/PickingPage";

const TABS = [
  { id: "new-order", label: "Nuevo pedido", icon: ShoppingCart },
  { id: "stock", label: "Stock y vencimientos", icon: Package },
  { id: "picking", label: "Picking", icon: ClipboardList },
  { id: "history", label: "Historial de pedidos", icon: History },
];

const PAGES = {
  "new-order": NewOrderPage,
  stock: StockPage,
  picking: PickingPage,
  history: OrderHistoryPage,
};

function App() {
  const [tab, setTab] = useState("new-order");
  const Page = PAGES[tab];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-gray-900">
            <Warehouse className="h-5 w-5 shrink-0 text-blue-600" />
            <span className="truncate text-sm font-semibold tracking-wide">
              Distribuidora
              <span className="hidden lg:inline"> — Sistema de gestión</span>
            </span>
          </div>
          <nav className="flex shrink-0 gap-1 sm:gap-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  title={t.label}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>
      <Page />
    </div>
  );
}

export default App;
