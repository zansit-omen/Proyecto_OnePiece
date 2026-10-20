// ---------------------------------------------------------------
// REEMPLAZA este archivo por tu conexión existente si ya la tienes.
// Solo necesita exportar un `pool` de mysql2/promise.
// ---------------------------------------------------------------
import mysql, { Pool, PoolConnection } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool: Pool = mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "onepiece",
    waitForConnections: true,
    connectionLimit: 10
});

export type Ejecutor = Pool | PoolConnection;

// Ejecuta varias consultas como una sola unidad (todo o nada)
export async function conTransaccion<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const resultado = await fn(conn);
        await conn.commit();
        return resultado;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}
