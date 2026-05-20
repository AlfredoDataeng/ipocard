import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';

export default async function secretariaRoutes(fastify: FastifyInstance) {
  // Pre-handler hook to check for SECRETARIA role (commented out/optional if doing simple demo, but let's implement validation if JWT exists)
  
  // Register a new student with auto-generated studentNumber sequence (CRUD - Create)
  fastify.post('/students', async (request, reply) => {
    const { name, classGroup, photoUrl, password } = request.body as any;

    if (!name || !classGroup) {
      return reply.code(400).send({ error: 'Nome e turma são obrigatórios.' });
    }

    // Auto-generate studentNumber sequentially
    const allStudents = await fastify.prisma.student.findMany({
      select: { studentNumber: true }
    });
    
    let maxSeq = 0;
    for (const s of allStudents) {
      const parts = s.studentNumber.split('-');
      const lastPart = parts[parts.length - 1];
      const seq = parseInt(lastPart);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
    const nextSeq = maxSeq + 1;
    const currentYear = new Date().getFullYear();
    const studentNumber = `IC-IPOCET-${currentYear}-${String(nextSeq).padStart(3, '0')}`;

    const defaultPassword = password || 'student123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const student = await fastify.prisma.student.create({
      data: {
        name: name.toUpperCase(),
        studentNumber,
        classGroup,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400', // default avatar
        password: passwordHash,
        balance: 0.0
      }
    });

    return { message: 'Estudante cadastrado com sucesso!', student: { id: student.id, name: student.name, studentNumber: student.studentNumber, classGroup: student.classGroup, balance: student.balance } };
  });

  // List all students
  fastify.get('/students', async (request, reply) => {
    const students = await fastify.prisma.student.findMany({
      orderBy: { name: 'asc' },
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
    return students;
  });

  // Get student by ID
  fastify.get('/students/:id', async (request, reply) => {
    const { id } = request.params as any;
    const student = await fastify.prisma.student.findUnique({
      where: { id },
      include: {
        deposits: { orderBy: { createdAt: 'desc' } },
        purchases: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!student) {
      return reply.code(404).send({ error: 'Estudante não encontrado.' });
    }

    // Remove password
    const { password, ...studentData } = student;
    return studentData;
  });

  // List all deposits (with filter by status)
  fastify.get('/deposits', async (request, reply) => {
    const { status } = request.query as any;
    
    const deposits = await fastify.prisma.deposit.findMany({
      where: status ? { status } : undefined,
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
    return deposits;
  });

  // Approve a bank deposit (Balance manipulation - Transactional/ACID)
  fastify.post('/deposits/:id/approve', async (request, reply) => {
    const { id } = request.params as any;
    const { approvedBy } = request.body as any;

    const deposit = await fastify.prisma.deposit.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!deposit) {
      return reply.code(404).send({ error: 'Registo de depósito não encontrado.' });
    }

    if (deposit.status !== 'PENDING') {
      return reply.code(400).send({ error: `Este depósito já foi processado como ${deposit.status}.` });
    }

    // Process approval as a Prisma transaction (ACID transaction)
    try {
      const result = await fastify.prisma.$transaction(async (tx) => {
        // 1. Update deposit status
        const updatedDeposit = await tx.deposit.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedBy: approvedBy || 'Secretaria Central',
            validatedAt: new Date()
          }
        });

        // 2. Increment student balance
        const updatedStudent = await tx.student.update({
          where: { id: deposit.studentId },
          data: {
            balance: {
              increment: deposit.amount
            }
          }
        });

        return { updatedDeposit, newBalance: updatedStudent.balance };
      });

      return {
        message: 'Depósito aprovado com sucesso e saldo creditado!',
        deposit: result.updatedDeposit,
        newBalance: result.newBalance
      };
    } catch (error: any) {
      return reply.code(500).send({ error: 'Erro ao processar transação no banco de dados: ' + error.message });
    }
  });

  // Reject a bank deposit
  fastify.post('/deposits/:id/reject', async (request, reply) => {
    const { id } = request.params as any;
    const { approvedBy } = request.body as any;

    const deposit = await fastify.prisma.deposit.findUnique({
      where: { id }
    });

    if (!deposit) {
      return reply.code(404).send({ error: 'Registo de depósito não encontrado.' });
    }

    if (deposit.status !== 'PENDING') {
      return reply.code(400).send({ error: `Este depósito já foi processado como ${deposit.status}.` });
    }

    const updatedDeposit = await fastify.prisma.deposit.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: approvedBy || 'Secretaria Central',
        validatedAt: new Date()
      }
    });

    return { message: 'Depósito rejeitado com sucesso.', deposit: updatedDeposit };
  });

  // Direct physical deposit at secretariat (Balance manipulation - Transactional/ACID)
  fastify.post('/students/:id/deposit', async (request, reply) => {
    const { id } = request.params as any;
    const { amount, receiptRef } = request.body as any;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return reply.code(400).send({ error: 'Valor do depósito inválido.' });
    }

    if (!receiptRef) {
      return reply.code(400).send({ error: 'A referência do comprovativo físico é obrigatória.' });
    }

    const student = await fastify.prisma.student.findUnique({
      where: { id }
    });

    if (!student) {
      return reply.code(404).send({ error: 'Estudante não encontrado.' });
    }

    try {
      const result = await fastify.prisma.$transaction(async (tx) => {
        // 1. Create an already APPROVED deposit record
        const deposit = await tx.deposit.create({
          data: {
            studentId: id,
            amount: amountNum,
            receiptRef: receiptRef,
            receiptDate: new Date(),
            status: 'APPROVED',
            approvedBy: 'Secretaria Central',
            validatedAt: new Date()
          }
        });

        // 2. Increment student balance
        const updatedStudent = await tx.student.update({
          where: { id },
          data: {
            balance: {
              increment: amountNum
            }
          }
        });

        return { deposit, newBalance: updatedStudent.balance };
      });

      return {
        message: 'Depósito físico registado com sucesso!',
        deposit: result.deposit,
        newBalance: result.newBalance
      };
    } catch (error: any) {
      return reply.code(500).send({ error: 'Erro ao processar transação: ' + error.message });
    }
  });

  // Update student details (CRUD - Update)
  fastify.put('/students/:id', async (request, reply) => {
    const { id } = request.params as any;
    const { name, classGroup } = request.body as any;

    if (!name || !classGroup) {
      return reply.code(400).send({ error: 'Nome e turma são obrigatórios.' });
    }

    try {
      const student = await fastify.prisma.student.update({
        where: { id },
        data: {
          name: name.toUpperCase(),
          classGroup
        }
      });
      return { message: 'Estudante atualizado com sucesso!', student };
    } catch (error: any) {
      return reply.code(500).send({ error: 'Erro ao atualizar estudante: ' + error.message });
    }
  });

  // Delete student (CRUD - Delete)
  fastify.delete('/students/:id', async (request, reply) => {
    const { id } = request.params as any;

    try {
      await fastify.prisma.student.delete({
        where: { id }
      });
      return { message: 'Estudante removido com sucesso!' };
    } catch (error: any) {
      return reply.code(500).send({ error: 'Erro ao remover estudante: ' + error.message });
    }
  });
}
