"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const prisma_js_1 = __importDefault(require("./plugins/prisma.js"));
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const secretaria_js_1 = __importDefault(require("./routes/secretaria.js"));
const cantina_js_1 = __importDefault(require("./routes/cantina.js"));
const aluno_js_1 = __importDefault(require("./routes/aluno.js"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const server = (0, fastify_1.default)({
    logger: true
});
// Register CORS
server.register(cors_1.default, {
    origin: true // Allow all origins for testing
});
// Register JWT
server.register(jwt_1.default, {
    secret: process.env.JWT_SECRET || 'ipocard_super_secret_jwt_key_2026'
});
// Register Prisma Plugin
server.register(prisma_js_1.default);
// Register routes
server.register(auth_js_1.default, { prefix: '/api/auth' });
server.register(secretaria_js_1.default, { prefix: '/api/secretaria' });
server.register(cantina_js_1.default, { prefix: '/api/cantina' });
server.register(aluno_js_1.default, { prefix: '/api/aluno' });
// Health check
server.get('/health', async () => {
    return { status: 'OK', system: 'IPOCARD API' };
});
server.get('/api/health', async () => {
    return { status: 'OK', system: 'IPOCARD API' };
});
const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000;
        // Host '0.0.0.0' allows external connections (Docker and network access)
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`IPOCARD Backend running on port ${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
