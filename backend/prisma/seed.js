const { PrismaClient } = require("@prisma/client");
const { allocateOrderItemFEFO } = require("../src/fefo");

const prisma = new PrismaClient();

function daysFromNow(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  // Clean slate (order matters due to FKs)
  await prisma.orderItemAllocation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.product.deleteMany();
  await prisma.client.deleteMany();
  await prisma.section.deleteMany();
  await prisma.warehouse.deleteMany();

  const warehouse = await prisma.warehouse.create({
    data: { name: "Depósito Central" },
  });

  const zonaSeca = await prisma.section.create({
    data: { name: "Zona seca", warehouseId: warehouse.id },
  });
  const estanteA1 = await prisma.section.create({
    data: { name: "Estante A1", warehouseId: warehouse.id, parentId: zonaSeca.id },
  });
  const estanteA2 = await prisma.section.create({
    data: { name: "Estante A2", warehouseId: warehouse.id, parentId: zonaSeca.id },
  });

  const zonaCongelados = await prisma.section.create({
    data: { name: "Zona congelados", warehouseId: warehouse.id },
  });
  const camara1 = await prisma.section.create({
    data: { name: "Cámara 1", warehouseId: warehouse.id, parentId: zonaCongelados.id },
  });
  const camara2 = await prisma.section.create({
    data: { name: "Cámara 2", warehouseId: warehouse.id, parentId: zonaCongelados.id },
  });

  // --- Productos ---
  const productDefs = [
    // secos
    { name: "Fideos tallarín 500g", category: "seco", unit: "unidad" },
    { name: "Arroz largo fino", category: "seco", unit: "kg" },
    { name: "Polenta", category: "seco", unit: "kg" },
    { name: "Aceite de girasol 900ml", category: "seco", unit: "litro" },
    { name: "Tomate perita en lata", category: "seco", unit: "caja" },
    { name: "Atún en lata", category: "seco", unit: "caja" },
    { name: "Yerba mate 1kg", category: "seco", unit: "kg" },
    { name: "Azúcar", category: "seco", unit: "kg" },
    // congelados
    { name: "Milanesas de carne", category: "congelado", unit: "kg" },
    { name: "Milanesas de pollo", category: "congelado", unit: "kg" },
    { name: "Verduras congeladas (mix)", category: "congelado", unit: "kg" },
    { name: "Papas fritas congeladas", category: "congelado", unit: "kg" },
    { name: "Helado de crema 1L", category: "congelado", unit: "unidad" },
    { name: "Medallones de merluza", category: "congelado", unit: "kg" },
  ];

  const products = {};
  for (const def of productDefs) {
    products[def.name] = await prisma.product.create({ data: def });
  }

  const secasSections = [estanteA1, estanteA2];
  const congeladasSections = [camara1, camara2];

  // [productName, [ [section, quantity, entryOffsetDays, expirationOffsetDays], ... ] ]
  const batchDefs = [
    ["Fideos tallarín 500g", [
      [estanteA1, 180, -20, 120],
      [estanteA2, 60, -5, 4],
    ]],
    ["Arroz largo fino", [
      [estanteA1, 95, -15, 60],
      [estanteA2, 40, -2, 6],
    ]],
    ["Polenta", [
      [estanteA1, 70, -10, 90],
    ]],
    ["Aceite de girasol 900ml", [
      [estanteA1, 120, -25, 45],
      [estanteA2, 30, -3, 3],
    ]],
    ["Tomate perita en lata", [
      [estanteA2, 50, -18, 150],
      [estanteA1, 20, -30, 30],
    ]],
    ["Atún en lata", [
      [estanteA2, 35, -12, 200],
    ]],
    ["Yerba mate 1kg", [
      [estanteA1, 85, -8, 75],
      [estanteA2, 25, -1, 5],
    ]],
    ["Azúcar", [
      [estanteA1, 110, -14, 50],
    ]],
    ["Milanesas de carne", [
      [camara1, 45, -6, 25],
      [camara2, 18, -1, 2],
    ]],
    ["Milanesas de pollo", [
      [camara1, 38, -9, 40],
    ]],
    ["Verduras congeladas (mix)", [
      [camara2, 60, -20, 100],
      [camara1, 22, -2, 7],
    ]],
    ["Papas fritas congeladas", [
      [camara1, 55, -11, 35],
      [camara2, 15, -3, 3],
    ]],
    ["Helado de crema 1L", [
      [camara2, 40, -7, 60],
    ]],
    ["Medallones de merluza", [
      [camara1, 30, -4, 5],
      [camara2, 20, -13, 55],
    ]],
  ];

  for (const [productName, batches] of batchDefs) {
    const product = products[productName];
    for (const [section, quantity, entryOffset, expOffset] of batches) {
      await prisma.batch.create({
        data: {
          productId: product.id,
          sectionId: section.id,
          quantity,
          entryDate: daysFromNow(entryOffset),
          expirationDate: daysFromNow(expOffset),
        },
      });
    }
  }

  // --- Clientes ---
  const clientDefs = [
    { name: "Almacén Don Pepe", type: "almacen", address: "Av. San Martín 1450, Rosario" },
    { name: "Restaurante La Parrilla", type: "restaurante", address: "Calle Belgrano 320, Rosario" },
    { name: "Kiosco 24hs El Sol", type: "kiosco", address: "Bv. Oroño 890, Rosario" },
    { name: "Restaurante Sabores del Sur", type: "restaurante", address: "Pellegrini 2100, Rosario" },
    { name: "Almacén La Esquina", type: "almacen", address: "Mendoza 655, Rosario" },
    { name: "Kiosco Rápido", type: "kiosco", address: "Corrientes 1200, Rosario" },
  ];

  const clients = {};
  for (const def of clientDefs) {
    clients[def.name] = await prisma.client.create({ data: def });
  }

  // --- Pedidos de ejemplo, para que Picking e Historial no arranquen vacíos ---
  async function createOrder(clientName, items) {
    const order = await prisma.order.create({
      data: {
        clientId: clients[clientName].id,
        status: "pendiente_picking",
        items: {
          create: items.map(([productName, quantity]) => ({
            productId: products[productName].id,
            quantityRequested: quantity,
          })),
        },
      },
      include: { items: true },
    });
    for (const orderItem of order.items) {
      await allocateOrderItemFEFO(prisma, orderItem);
    }
    return order.id;
  }

  // Dos pedidos quedan pendientes de picking, listos para probar el Módulo 3.
  await createOrder("Restaurante La Parrilla", [
    ["Milanesas de pollo", 15],
    ["Papas fritas congeladas", 10],
  ]);
  await createOrder("Kiosco 24hs El Sol", [
    ["Fideos tallarín 500g", 20],
    ["Aceite de girasol 900ml", 10],
  ]);

  // Un tercer pedido se marca como ya entregado, para ver el ciclo completo en el Historial.
  const deliveredOrderId = await createOrder("Almacén Don Pepe", [
    ["Arroz largo fino", 25],
    ["Azúcar", 15],
  ]);
  await prisma.orderItemAllocation.updateMany({
    where: { orderItem: { orderId: deliveredOrderId } },
    data: { picked: true },
  });
  await prisma.order.update({
    where: { id: deliveredOrderId },
    data: { status: "listo_para_entregar" },
  });

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
