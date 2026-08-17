/**
 * Resuelve un ítem de pedido contra los lotes disponibles de su producto,
 * usando la regla FEFO (first expired, first out): consume primero el lote
 * que vence antes; si no alcanza, completa con el siguiente, y así sucesivamente.
 *
 * Corre dentro de una transacción Prisma (tx). Lanza un error si el stock
 * total disponible no alcanza para cubrir la cantidad pedida.
 */
async function allocateOrderItemFEFO(tx, orderItem) {
  const batches = await tx.batch.findMany({
    where: { productId: orderItem.productId, quantity: { gt: 0 } },
    orderBy: { expirationDate: "asc" },
  });

  let remaining = orderItem.quantityRequested;
  const allocations = [];

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, batch.quantity);
    allocations.push({ batch, take });
    remaining -= take;
  }

  if (remaining > 1e-9) {
    throw new Error(
      `Stock insuficiente para cubrir el pedido de este producto (faltan ${remaining}).`
    );
  }

  for (const { batch, take } of allocations) {
    await tx.batch.update({
      where: { id: batch.id },
      data: { quantity: batch.quantity - take },
    });
    await tx.orderItemAllocation.create({
      data: {
        orderItemId: orderItem.id,
        batchId: batch.id,
        quantityAllocated: take,
      },
    });
  }
}

module.exports = { allocateOrderItemFEFO };
