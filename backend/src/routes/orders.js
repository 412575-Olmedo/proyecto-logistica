const express = require("express");
const prisma = require("../prisma");
const { allocateOrderItemFEFO } = require("../fefo");

const router = express.Router();

const orderInclude = {
  client: true,
  items: {
    include: {
      product: true,
      allocations: {
        include: { batch: { include: { section: true } } },
      },
    },
  },
};

router.get("/", async (req, res) => {
  const { status } = req.query;
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { date: "desc" },
    include: orderInclude,
  });
  res.json(orders);
});

router.get("/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: orderInclude,
  });
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  res.json(order);
});

router.post("/", async (req, res) => {
  const { clientId, items } = req.body;

  if (!clientId || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ error: "Se requiere clientId y al menos un ítem." });
  }

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      return res.status(400).json({
        error: "Cada ítem necesita productId y quantity mayor a 0.",
      });
    }
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          clientId: Number(clientId),
          status: "pendiente_picking",
          items: {
            create: items.map((item) => ({
              productId: Number(item.productId),
              quantityRequested: Number(item.quantity),
            })),
          },
        },
        include: { items: true },
      });

      for (const orderItem of created.items) {
        await allocateOrderItemFEFO(tx, orderItem);
      }

      return tx.order.findUnique({
        where: { id: created.id },
        include: orderInclude,
      });
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:orderId/allocations/:allocationId", async (req, res) => {
  const orderId = Number(req.params.orderId);
  const allocationId = Number(req.params.allocationId);
  const { picked } = req.body;

  if (typeof picked !== "boolean") {
    return res.status(400).json({ error: "El campo picked debe ser true o false." });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const allocation = await tx.orderItemAllocation.findUnique({
        where: { id: allocationId },
        include: { orderItem: true },
      });

      if (!allocation || allocation.orderItem.orderId !== orderId) {
        throw new Error("La asignación no pertenece a este pedido.");
      }

      await tx.orderItemAllocation.update({
        where: { id: allocationId },
        data: { picked },
      });

      const allAllocations = await tx.orderItemAllocation.findMany({
        where: { orderItem: { orderId } },
      });
      const allPicked = allAllocations.every((a) => a.picked);

      await tx.order.update({
        where: { id: orderId },
        data: { status: allPicked ? "listo_para_entregar" : "pendiente_picking" },
      });

      return tx.order.findUnique({ where: { id: orderId }, include: orderInclude });
    });

    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
