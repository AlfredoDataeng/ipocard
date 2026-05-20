import { FastifyInstance } from 'fastify';

export default async function alunoRoutes(fastify: FastifyInstance) {
  // Get student details and transaction history (purchases and deposits)
  fastify.get('/profile/:id', async (request, reply) => {
    const { id } = request.params as any;

    const student = await fastify.prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        studentNumber: true,
        classGroup: true,
        photoUrl: true,
        balance: true,
        createdAt: true
      }
    });

    if (!student) {
      return reply.code(404).send({ error: 'Estudante não encontrado.' });
    }

    const purchases = await fastify.prisma.purchase.findMany({
      where: { studentId: id },
      orderBy: { createdAt: 'desc' }
    });

    const deposits = await fastify.prisma.deposit.findMany({
      where: { studentId: id },
      orderBy: { createdAt: 'desc' }
    });

    return {
      student,
      purchases,
      deposits
    };
  });

  // Declare bank deposit (requires student receipt confirmation)
  fastify.post('/deposits', async (request, reply) => {
    const { studentId, amount, receiptRef, receiptDate } = request.body as any;

    if (!studentId || !amount || !receiptRef || !receiptDate) {
      return reply.code(400).send({ error: 'ID do estudante, valor, referência do recibo e data são obrigatórios.' });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return reply.code(400).send({ error: 'O valor do depósito deve ser um número maior que zero.' });
    }

    // Verify student exists
    const student = await fastify.prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return reply.code(404).send({ error: 'Estudante não encontrado.' });
    }

    // Check if reference already declared to prevent duplicates
    const existingDeposit = await fastify.prisma.deposit.findFirst({
      where: { receiptRef }
    });

    if (existingDeposit) {
      return reply.code(400).send({ error: 'Esta referência de comprovativo já foi declarada no sistema.' });
    }

    const deposit = await fastify.prisma.deposit.create({
      data: {
        studentId,
        amount: numericAmount,
        receiptRef,
        receiptDate: new Date(receiptDate),
        status: 'PENDING'
      }
    });

    return {
      message: 'Comprovativo de depósito declarado com sucesso! Aguarde a validação pela Secretaria.',
      deposit
    }
  });
}
