const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { batches: true },
  });

  const result = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    unit: p.unit,
    availableStock: p.batches.reduce((sum, b) => sum + b.quantity, 0),
  }));

  res.json(result);
});

module.exports = router;
