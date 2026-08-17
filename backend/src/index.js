const express = require("express");
const cors = require("cors");

const clientsRouter = require("./routes/clients");
const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");
const stockRouter = require("./routes/stock");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/clients", clientsRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/stock", stockRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
