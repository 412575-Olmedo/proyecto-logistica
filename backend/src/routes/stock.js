const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  const batches = await prisma.batch.findMany({
    where: { quantity: { gt: 0 } },
    orderBy: { expirationDate: "asc" },
    include: {
      product: true,
      section: { include: { parent: true } },
    },
  });
  res.json(batches);
});

module.exports = router;
