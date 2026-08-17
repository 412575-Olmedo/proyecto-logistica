const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
  res.json(clients);
});

module.exports = router;
