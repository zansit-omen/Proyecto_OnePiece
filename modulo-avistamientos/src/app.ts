// Ejemplo de integración. Si ya tienes tu app.ts / index.ts, solo copia las 3 líneas marcadas.
import express from "express";
import dotenv from "dotenv";
import avistamientosRouter from "./modules/avistamientos/avistamientos.routes";   // <- 1
import { errorHandler } from "./utils/errors";                                     // <- 2

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api", avistamientosRouter);                                              // <- 3

app.use(errorHandler); // siempre al final, después de las rutas

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
