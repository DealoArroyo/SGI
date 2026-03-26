import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import clientesRoutes from "./routes/clientes.routes.js";
import inquilinosRoutes from "./routes/inquilinos.routes.js";
import inquilinosClientesRoutes from "./routes/inquilinos_clientes.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import authRoutes from "./routes/auth.routes.js";
import rolesRoutes from "./routes/roles.routes.js";
import areasRoutes from "./routes/areas.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import categoriasRoutes from "./routes/categorias.routes.js";
import unidadesRoutes from "./routes/unidades.routes.js";
import agendasRoutes from "./routes/agendas.routes.js";
import pedidosRoutes from "./routes/pedidos.routes.js";
import { bootstrapSecuritySchema } from "./bootstrap/security.bootstrap.js";
import { securityHeadersMiddleware } from "./middlewares/security.middleware.js";
import { sanitizeInputMiddleware } from "./middlewares/input.middleware.js";

dotenv.config();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const allowedOrigins = new Set([
    process.env.CLIENT_URL,
    "http://localhost:5173",
].filter(Boolean));

const corsOptions = {
    origin: (origin, callback) => {
        // Permite requests server-to-server o tools sin origin.
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error("Origen no permitido por CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
};

app.use(cors(corsOptions));

app.use(securityHeadersMiddleware);
app.use(sanitizeInputMiddleware);

app.use('/api/clientes', clientesRoutes);
app.use('/api/inquilinos', inquilinosRoutes);
app.use('/api/inquilinosClientes', inquilinosClientesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/unidades-medida', unidadesRoutes);
app.use('/api/agendas', agendasRoutes);
app.use('/api/pedidos', pedidosRoutes);

const PORT = process.env.PORT || 3000;

const start = async () => {
    try {
        await bootstrapSecuritySchema();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor en http://192.168.0.25:${PORT}`);
        });
    } catch (error) {
        console.error("No se pudo iniciar el servidor de forma segura:", error);
        process.exit(1);
    }
};

start();
