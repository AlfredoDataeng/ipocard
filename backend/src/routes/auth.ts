import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';

export default async function authRoutes(fastify: FastifyInstance) {
  // Student Login
  fastify.post('/login/student', async (request, reply) => {
    const { studentNumber, password } = request.body as any;
    
    if (!studentNumber || !password) {
      return reply.code(400).send({ error: 'Nº do estudante e senha são obrigatórios.' });
    }

    const student = await fastify.prisma.student.findUnique({
      where: { studentNumber }
    });

    if (!student) {
      return reply.code(401).send({ error: 'Estudante não encontrado.' });
    }

    const passwordMatch = await bcrypt.compare(password, student.password);
    if (!passwordMatch) {
      return reply.code(401).send({ error: 'Senha incorreta.' });
    }

    const token = fastify.jwt.sign({ id: student.id, role: 'STUDENT', name: student.name });
    
    return { 
      token, 
      student: { 
        id: student.id, 
        name: student.name, 
        studentNumber: student.studentNumber, 
        classGroup: student.classGroup, 
        balance: student.balance, 
        photoUrl: student.photoUrl 
      } 
    };
  });

  // Admin / Staff Login (Secretaria & Cantina)
  fastify.post('/login/staff', async (request, reply) => {
    const { username, password } = request.body as any;
    
    if (!username || !password) {
      return reply.code(400).send({ error: 'Utilizador e senha são obrigatórios.' });
    }

    let role = '';
    if (username === 'secretaria' && password === 'sec123') {
      role = 'SECRETARIA';
    } else if (username === 'cantina' && password === 'cant123') {
      role = 'CANTINA';
    } else {
      return reply.code(401).send({ error: 'Credenciais inválidas.' });
    }

    const token = fastify.jwt.sign({ role, username });
    
    return { token, role, username };
  });
}
