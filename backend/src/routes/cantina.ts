import { FastifyInstance } from 'fastify';

export default async function cantinaRoutes(fastify: FastifyInstance) {
  // Get student by student number (QR Code scanned value) or ID
  fastify.get('/students/scan', async (request, reply) => {
    const { key } = request.query as any;
    
    if (!key) {
      return reply.code(400).send({ error: 'Parâmetro de busca (key) ausente.' });
    }

    const student = await fastify.prisma.student.findFirst({
      where: {
        OR: [
          { studentNumber: key },
          { id: key }
        ]
      },
      select: {
        id: true,
        name: true,
        studentNumber: true,
        classGroup: true,
        photoUrl: true,
        balance: true
      }
    });

    if (!student) {
      return reply.code(404).send({ error: 'Estudante não encontrado no sistema.' });
    }

    return student;
  });

  // List all products for POS
  fastify.get('/products', async (request, reply) => {
    const products = await fastify.prisma.product.findMany({
      orderBy: { name: 'asc' }
    });
    return products;
  });

  // Create a purchase (Register purchase & deduct balance - ACID Transaction)
  fastify.post('/purchases', async (request, reply) => {
    const { studentId, items } = request.body as any;

    if (!studentId || !items || !Array.isArray(items) || items.length === 0) {
      return reply.code(400).send({ error: 'ID do estudante e lista de itens são obrigatórios.' });
    }

    // Get student details
    const student = await fastify.prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return reply.code(404).send({ error: 'Estudante não encontrado.' });
    }

    // Calculate total price
    let totalAmount = 0;
    for (const item of items) {
      if (!item.price || !item.quantity || item.quantity <= 0) {
        return reply.code(400).send({ error: 'Item com estrutura inválida (requer preço e quantidade).' });
      }
      totalAmount += item.price * item.quantity;
    }

    // Check balance
    if (student.balance < totalAmount) {
      return reply.code(400).send({
        error: 'Saldo insuficiente para realizar esta compra.',
        balance: student.balance,
        totalAmount
      });
    }

    // Process payment and record transaction in an ACID Prisma Transaction
    try {
      const result = await fastify.prisma.$transaction(async (tx) => {
        // 1. Deduct balance from student
        const updatedStudent = await tx.student.update({
          where: { id: studentId },
          data: {
            balance: {
              decrement: totalAmount
            }
          }
        });

        // Double check balance has not gone negative (race conditions)
        if (updatedStudent.balance < 0) {
          throw new Error('Saldo insuficiente detectado após dedução.');
        }

        // 2. Create purchase log
        const purchase = await tx.purchase.create({
          data: {
            studentId,
            totalAmount,
            items: items as any // Cast JSON
          }
        });

        return { purchase, newBalance: updatedStudent.balance };
      });

      return {
        message: 'Compra registrada com sucesso!',
        purchase: result.purchase,
        newBalance: result.newBalance
      };

    } catch (error: any) {
      return reply.code(500).send({ error: 'Erro ao processar compra: ' + error.message });
    }
  });

  // Get general purchase logs
  fastify.get('/purchases', async (request, reply) => {
    const purchases = await fastify.prisma.purchase.findMany({
      include: {
        student: {
          select: {
            name: true,
            studentNumber: true,
            classGroup: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return purchases;
  });
}
