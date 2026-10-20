import { Request, Response } from "express";
import * as servicio from "./avistamientos.service";

// Convierte req.query en un objeto simple de strings
function consulta(req: Request): Record<string, string | undefined> {
    const salida: Record<string, string | undefined> = {};
    for (const [clave, valor] of Object.entries(req.query)) {
        salida[clave] = typeof valor === "string" ? valor : undefined;
    }
    return salida;
}

// ---- Avistamientos ----
export async function crearAvistamiento(req: Request, res: Response) {
    const datos = await servicio.registrarAvistamiento(req.body);
    res.status(201).json({ ok: true, mensaje: "Avistamiento registrado", datos });
}

export async function listarAvistamientos(req: Request, res: Response) {
    const resultado = await servicio.consultarAvistamientos(consulta(req));
    res.json({ ok: true, ...resultado });
}

export async function obtenerAvistamiento(req: Request, res: Response) {
    const datos = await servicio.obtenerAvistamientoPorId(req.params.id);
    res.json({ ok: true, datos });
}

export async function actualizarVerificacion(req: Request, res: Response) {
    const datos = await servicio.actualizarVerificacion(req.params.id, req.body);
    res.json({ ok: true, mensaje: "Estado de verificación actualizado", datos });
}

// ---- Reportes ciudadanos ----
export async function crearReporte(req: Request, res: Response) {
    const datos = await servicio.registrarReporte(req.body);
    res.status(201).json({
        ok: true,
        mensaje: "Reporte recibido. Quedará pendiente de verificación",
        datos
    });
}

export async function listarReportes(req: Request, res: Response) {
    const resultado = await servicio.consultarReportes(consulta(req));
    res.json({ ok: true, ...resultado });
}

export async function obtenerReporte(req: Request, res: Response) {
    const datos = await servicio.obtenerReportePorId(req.params.id);
    res.json({ ok: true, datos });
}

export async function validarReporte(req: Request, res: Response) {
    const datos = await servicio.validarReporte(req.params.id, req.body);
    res.json({ ok: true, mensaje: "Reporte procesado", datos });
}
