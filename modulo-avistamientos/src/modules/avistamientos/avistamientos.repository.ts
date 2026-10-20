import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Ejecutor, pool } from "../../db";
import {
    Avistamiento, FiltrosAvistamiento, FiltrosReporte, NuevoAvistamiento,
    NuevoReporte, ReporteCiudadano, EstadoReporte
} from "./avistamientos.types";

// Toda la comunicación con la base de datos vive aquí.

export async function existeCriminal(id_criminal: number, db: Ejecutor = pool): Promise<boolean> {
    const [rows] = await db.query<RowDataPacket[]>(
        "SELECT id_criminal FROM criminales WHERE id_criminal = ?", [id_criminal]
    );
    return rows.length > 0;
}

// ======================= AVISTAMIENTOS =======================

export async function crearAvistamiento(datos: NuevoAvistamiento, db: Ejecutor = pool): Promise<number> {
    const [res] = await db.query<ResultSetHeader>(
        `INSERT INTO avistamientos
         (id_criminal, fecha_avistamiento, zona, ubicacion, testigo, descripcion,
          estado_verificacion, origen, id_reporte)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            datos.id_criminal, datos.fecha_avistamiento, datos.zona, datos.ubicacion,
            datos.testigo, datos.descripcion ?? null,
            datos.estado_verificacion ?? "SIN_VERIFICAR",
            datos.origen ?? "REGISTRO_DIRECTO",
            datos.id_reporte ?? null
        ]
    );
    return res.insertId;
}

export async function obtenerAvistamiento(id: number, db: Ejecutor = pool): Promise<Avistamiento | null> {
    const [rows] = await db.query<RowDataPacket[]>(
        "SELECT * FROM avistamientos WHERE id_avistamiento = ?", [id]
    );
    return (rows[0] as Avistamiento) ?? null;
}

export async function listarAvistamientos(f: FiltrosAvistamiento): Promise<{ total: number; datos: Avistamiento[] }> {
    const condiciones: string[] = [];
    const params: unknown[] = [];

    if (f.id_criminal !== undefined) { condiciones.push("a.id_criminal = ?"); params.push(f.id_criminal); }
    if (f.zona) { condiciones.push("a.zona LIKE ?"); params.push(`%${f.zona}%`); }
    if (f.fecha_desde) { condiciones.push("a.fecha_avistamiento >= ?"); params.push(f.fecha_desde); }
    if (f.fecha_hasta) { condiciones.push("a.fecha_avistamiento <= ?"); params.push(f.fecha_hasta); }
    if (f.estado_verificacion) { condiciones.push("a.estado_verificacion = ?"); params.push(f.estado_verificacion); }

    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

    const [conteo] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM avistamientos a ${where}`, params
    );
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT a.* FROM avistamientos a ${where}
         ORDER BY a.fecha_avistamiento DESC
         LIMIT ? OFFSET ?`,
        [...params, f.limite, (f.pagina - 1) * f.limite]
    );
    return { total: conteo[0].total as number, datos: rows as Avistamiento[] };
}

export async function actualizarVerificacionAvistamiento(
    id: number, estado: string, db: Ejecutor = pool
): Promise<void> {
    await db.query("UPDATE avistamientos SET estado_verificacion = ? WHERE id_avistamiento = ?", [estado, id]);
}

// ======================= REPORTES CIUDADANOS =======================

export async function crearReporte(datos: NuevoReporte, db: Ejecutor = pool): Promise<number> {
    const [res] = await db.query<ResultSetHeader>(
        `INSERT INTO reportes_ciudadanos
         (id_criminal, nombre_informante, contacto, fecha_avistamiento, zona, ubicacion, descripcion)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            datos.id_criminal, datos.nombre_informante, datos.contacto ?? null,
            datos.fecha_avistamiento, datos.zona, datos.ubicacion, datos.descripcion ?? null
        ]
    );
    return res.insertId;
}

// bloquear = true usa FOR UPDATE para evitar que dos revisores validen el mismo reporte a la vez
export async function obtenerReporte(id: number, db: Ejecutor = pool, bloquear = false): Promise<ReporteCiudadano | null> {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT * FROM reportes_ciudadanos WHERE id_reporte = ? ${bloquear ? "FOR UPDATE" : ""}`, [id]
    );
    return (rows[0] as ReporteCiudadano) ?? null;
}

export async function listarReportes(f: FiltrosReporte): Promise<{ total: number; datos: ReporteCiudadano[] }> {
    const condiciones: string[] = [];
    const params: unknown[] = [];

    if (f.id_criminal !== undefined) { condiciones.push("id_criminal = ?"); params.push(f.id_criminal); }
    if (f.estado) { condiciones.push("estado = ?"); params.push(f.estado); }

    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

    const [conteo] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM reportes_ciudadanos ${where}`, params
    );
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM reportes_ciudadanos ${where}
         ORDER BY fecha_reporte DESC LIMIT ? OFFSET ?`,
        [...params, f.limite, (f.pagina - 1) * f.limite]
    );
    return { total: conteo[0].total as number, datos: rows as ReporteCiudadano[] };
}

export async function resolverReporte(
    id: number,
    estado: EstadoReporte,
    revisado_por: string,
    motivo_rechazo: string | null,
    id_avistamiento: number | null,
    db: Ejecutor = pool
): Promise<void> {
    await db.query(
        `UPDATE reportes_ciudadanos
         SET estado = ?, fecha_revision = NOW(), revisado_por = ?,
             motivo_rechazo = ?, id_avistamiento = ?
         WHERE id_reporte = ?`,
        [estado, revisado_por, motivo_rechazo, id_avistamiento, id]
    );
}
