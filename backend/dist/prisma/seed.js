"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    // Clear existing data
    await prisma.purchase.deleteMany({});
    await prisma.deposit.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.product.deleteMany({});
    console.log('Seeding products...');
    const products = [
        { name: 'Hambúrguer de Novilho', price: 1200.00, category: 'Lanches', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
        { name: 'Sumo Natural de Laranja', price: 500.00, category: 'Bebidas', imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400' },
        { name: 'Sandes de Queijo e Fiambre', price: 800.00, category: 'Lanches', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400' },
        { name: 'Fatia de Bolo de Chocolate', price: 600.00, category: 'Sobremesas', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400' },
        { name: 'Água Mineral IPOCET (500ml)', price: 300.00, category: 'Bebidas', imageUrl: 'https://images.unsplash.com/photo-1608885898957-a599fb18ec3d?w=400' },
        { name: 'Cachorro Quente Especial', price: 1000.00, category: 'Lanches', imageUrl: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=400' },
        { name: 'Iogurte Natural Batido', price: 700.00, category: 'Bebidas', imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400' }
    ];
    for (const product of products) {
        await prisma.product.create({
            data: product
        });
    }
    console.log('Seeding students...');
    const passwordHash = await bcryptjs_1.default.hash('student123', 10);
    const currentYear = new Date().getFullYear();
    // Seed students with new fictional names
    const matheus = await prisma.student.create({
        data: {
            name: 'MATHEUS DOMINGOS',
            studentNumber: `IC-IPOCET-${currentYear}-001`,
            classGroup: '12ª Classe - Informática',
            password: passwordHash,
            balance: 15000.00,
            photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400'
        }
    });
    const beatriz = await prisma.student.create({
        data: {
            name: 'BEATRIZ GONÇALVES',
            studentNumber: `IC-IPOCET-${currentYear}-002`,
            classGroup: '11ª Classe - Construção Civil',
            password: passwordHash,
            balance: 500.00,
            photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'
        }
    });
    const francisco = await prisma.student.create({
        data: {
            name: 'FRANCISCO COSTA',
            studentNumber: `IC-IPOCET-${currentYear}-003`,
            classGroup: '10ª Classe - Eletricidade',
            password: passwordHash,
            balance: 0.00,
            photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
        }
    });
    // Create physical deposits (already approved for audit logs)
    await prisma.deposit.create({
        data: {
            studentId: beatriz.id,
            amount: 500.00,
            receiptRef: 'DEP-PHYS-981273',
            receiptDate: new Date(),
            status: 'APPROVED',
            approvedBy: 'Secretaria Central',
            validatedAt: new Date()
        }
    });
    await prisma.deposit.create({
        data: {
            studentId: matheus.id,
            amount: 15000.00,
            receiptRef: 'DEP-PHYS-102938',
            receiptDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            status: 'APPROVED',
            approvedBy: 'Secretaria Central',
            validatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
    });
    console.log('Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
