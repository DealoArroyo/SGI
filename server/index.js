import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import clientesRoutes from "./routes/clientes.routes.js";
import inquilinosRoutes from "./routes/inquilinos.routes.js";
import inquilinosClientesRoutes from "./routes/inquilinos_clientes.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use('/api/clientes', clientesRoutes);
app.use('/api/inquilinos', inquilinosRoutes);
app.use('/api/inquilinosClientes', inquilinosClientesRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});