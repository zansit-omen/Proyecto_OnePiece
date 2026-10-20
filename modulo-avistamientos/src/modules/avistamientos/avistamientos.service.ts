import { conTransaccion } from "../../db";
import { HttpError } from "../../utils/errors";
import * as repo from "./avistamientos.repository";
import {
    ESTADOS_REPORTE, ESTADOS_VERIFICACION, EstadoReporte, EstadoVerificacion,
    FiltrosAvistamiento, FiltrosReporte, NuevoAvistamiento, NuevoReporte, ValidacionReporte
} from "./avistamientos.types";

// ====================== Validaciones reutilizables ======================

function textoRequerido(valor: unknown, campo: string, max = 255): string {
    if (typeof valor !== "string" || valor.trim() === "") {
        throw new HttpError(400, `El campo '${campo}' es obligatorio`);
    }
    if (valor.trim().length > max) {
        throw new HttpError(400, `El campo '${campo}' no puede superar ${max} caracteres`);
    }
    return valor.trim();
}

function textoOpcional(valor: unknown, campo: string, max = 255): string | null {
    if (valor === undefined || valor === null || valor === "") return null;
    return textoRequerido(valor, campo, max);
}

function enteroPositivo(valor: unknown, campo: string): number {
    const n = Number(valor);
    if (!Number.isInteger(n) || n <= 0) {
        throw new HttpError(400, `El campo '${campo}' debe ser un entero positivo`);
    }
    return n;
}

// Acepta "2026-10-19" o "2026-10-19T14:30:00". Una fecha sin hora se toma a las 00:00 local.
function parsearFecha(valor: unknown, campo: string, finDelDia = false): Date {
    if (typeof valor !== "string" || valor.trim() === "") {
        throw new HttpError(400, `El campo '${campo}' es obligatorio`);
    }
    const texto = valor.trim();
    const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(texto);
    const fecha = new Date(soloFecha ? `${texto}T${finDelDia ? "23:59:59" : "00:00:00"}` : texto);
    if (isNaN(fecha.getTime())) {
        throw new HttpError(400, `El campo '${campo}' no tiene un formato de fecha válido (use YYYY-MM-DD o ISO 8601)`);
    }
    return fecha;
}

function fechaNoFutura(fecha: Date, campo: string): void {
    if (fecha.getTime() > Date.now()) {
        throw new HttpError(400, `El campo '${campo}' no puede ser una fecha futura`);
    }
}

async function verificarCriminal(id_criminal: number): Promise<void> {
    if (!(await repo.existeCriminal(id_criminal))) {
        throw new HttpError(404, `No existe un criminal con id ${id_criminal}`);
    }
}

function paginacion(pagina: unknown, limite: unknown): { pagina: number; limite: number } {
    const p = pagina === undefined ? 1 : enteroPositivo(pagina, "pagina");
    const l = limite === undefined ? 20 : enteroPositivo(limite, "limite");
    return { pagina: p, limite: Math.min(l, 100) };
}

// ====================== RF14: registrar avistamiento ======================

export async function registrarAvistamiento(body: any) {
    const datos: NuevoAvistamiento = {
        id_criminal: enteroPositivo(body?.id_criminal, "id_criminal"),
        fecha_avistamiento: parsearFecha(body?.fecha_avistamiento, "fecha_avistamiento"),
        zona: textoRequerido(body?.zona, "zona", 120),
        ubicacion: textoRequerido(body?.ubicacion, "ubicacion"),
        testigo: textoRequerido(body?.testigo, "testigo", 120),
        descripcion: textoOpcional(body?.descripcion, "descripcion", 2000),
        estado_verificacion: "SIN_VERIFICAR",
        origen: "REGISTRO_DIRECTO"
    };
    fechaNoFutura(datos.fecha_avistamiento, "fecha_avistamiento");
    await verificarCriminal(datos.id_criminal);

    const id = await repo.crearAvistamiento(datos);
    return repo.obtenerAvistamiento(id);
}

// ====================== RF17: consultar avistamientos ======================

export async function consultarAvistamientos(query: Record<string, string | undefined>) {
    const filtros: FiltrosAvistamiento = { ...paginacion(query.pagina, query.limite) };

    if (query.id_criminal !== undefined) filtros.id_criminal = enteroPositivo(query.id_criminal, "id_criminal");
    if (query.zona) filtros.zona = query.zona.trim();
    if (query.fecha_desde) filtros.fecha_desde = parsearFecha(query.fecha_desde, "fecha_desde");
    if (query.fecha_hasta) filtros.fecha_hasta = parsearFecha(query.fecha_hasta, "fecha_hasta", true);
    if (filtros.fecha_desde && filtros.fecha_hasta && filtros.fecha_desde > filtros.fecha_hasta) {
        throw new HttpError(400, "'fecha_desde' no puede ser posterior a 'fecha_hasta'");
    }
    if (query.estado_verificacion) {
        const estado = query.estado_verificacion.toUpperCase() as EstadoVerificacion;
        if (!ESTADOS_VERIFICACION.includes(estado)) {
            throw new HttpError(400, `'estado_verificacion' debe ser: ${ESTADOS_VERIFICACION.join(", ")}`);
        }
        filtros.estado_verificacion = estado;
    }

    const { total, datos } = await repo.listarAvistamientos(filtros);
    return { total, pagina: filtros.pagina, limite: filtros.limite, datos };
}

export async function obtenerAvistamientoPorId(idTexto: string) {
    const id = enteroPositivo(idTexto, "id");
    const avistamiento = await repo.obtenerAvistamiento(id);
    if (!avistamiento) throw new HttpError(404, `No existe el avistamiento ${id}`);
    return avistamiento;
}

// Cambia manualmente el estado de un avistamiento registrado de forma directa
export async function actualizarVerificacion(idTexto: string, body: any) {
    const id = enteroPositivo(idTexto, "id");
    const estado = String(body?.estado_verificacion ?? "").toUpperCase() as EstadoVerificacion;
    if (!ESTADOS_VERIFICACION.includes(estado)) {
        throw new HttpError(400, `'estado_verificacion' debe ser: ${ESTADOS_VERIFICACION.join(", ")}`);
    }
    await obtenerAvistamientoPorId(idTexto);
    await repo.actualizarVerificacionAvistamiento(id, estado);
    return repo.obtenerAvistamiento(id);
}

// ====================== RF15: reporte ciudadano ======================

export async function registrarReporte(body: any) {
    const datos: NuevoReporte = {
        id_criminal: enteroPositivo(body?.id_criminal, "id_criminal"),
        nombre_informante: textoRequerido(body?.nombre_informante, "nombre_informante", 120),
        contacto: textoOpcional(body?.contacto, "contacto", 120),
        fecha_avistamiento: parsearFecha(body?.fecha_avistamiento, "fecha_avistamiento"),
        zona: textoRequerido(body?.zona, "zona", 120),
        ubicacion: textoRequerido(body?.ubicacion, "ubicacion"),
        descripcion: textoOpcional(body?.descripcion, "descripcion", 2000)
    };
    fechaNoFutura(datos.fecha_avistamiento, "fecha_avistamiento");
    await verificarCriminal(datos.id_criminal);

    const id = await repo.crearReporte(datos);
    return repo.obtenerReporte(id);
}

export async function consultarReportes(query: Record<string, string | undefined>) {
    const filtros: FiltrosReporte = { ...paginacion(query.pagina, query.limite) };
    if (query.id_criminal !== undefined) filtros.id_criminal = enteroPositivo(query.id_criminal, "id_criminal");
    if (query.estado) {
        const estado = query.estado.toUpperCase() as EstadoReporte;
        if (!ESTADOS_REPORTE.includes(estado)) {
            throw new HttpError(400, `'estado' debe ser: ${ESTADOS_REPORTE.join(", ")}`);
        }
        filtros.estado = estado;
    }
    const { total, datos } = await repo.listarReportes(filtros);
    return { total, pagina: filtros.pagina, limite: filtros.limite, datos };
}

export async function obtenerReportePorId(idTexto: string) {
    const id = enteroPositivo(idTexto, "id");
    const reporte = await repo.obtenerReporte(id);
    if (!reporte) throw new HttpError(404, `No existe el reporte ${id}`);
    return reporte;
}

// ====================== RF16: validar reporte ======================
// VERIFICAR -> crea un avistamiento oficial (VERIFICADO) y lo vincula al reporte.
// RECHAZAR  -> marca el reporte como rechazado con su motivo.
// Todo ocurre en una transacción: nunca queda un reporte verificado sin avistamiento.

export async function validarReporte(idTexto: string, body: any) {
    const id = enteroPositivo(idTexto, "id");
    const accion = String(body?.accion ?? "").toUpperCase();
    if (accion !== "VERIFICAR" && accion !== "RECHAZAR") {
        throw new HttpError(400, "'accion' debe ser VERIFICAR o RECHAZAR");
    }
    const validacion: ValidacionReporte = {
        accion,
        revisado_por: textoRequerido(body?.revisado_por, "revisado_por", 120),
        motivo_rechazo: accion === "RECHAZAR"
            ? textoRequerido(body?.motivo_rechazo, "motivo_rechazo")
            : null
    };

    return conTransaccion(async (conn) => {
        const reporte = await repo.obtenerReporte(id, conn, true);
        if (!reporte) throw new HttpError(404, `No existe el reporte ${id}`);
        if (reporte.estado !== "PENDIENTE") {
            throw new HttpError(409, `El reporte ya fue revisado (estado: ${reporte.estado})`);
        }

        if (validacion.accion === "VERIFICAR") {
            const id_avistamiento = await repo.crearAvistamiento({
                id_criminal: reporte.id_criminal,
                fecha_avistamiento: reporte.fecha_avistamiento,
                zona: reporte.zona,
                ubicacion: reporte.ubicacion,
                testigo: reporte.nombre_informante,
                descripcion: reporte.descripcion ?? null,
                estado_verificacion: "VERIFICADO",
                origen: "REPORTE_CIUDADANO",
                id_reporte: reporte.id_reporte
            }, conn);
            await repo.resolverReporte(id, "VERIFICADO", validacion.revisado_por, null, id_avistamiento, conn);
        } else {
            await repo.resolverReporte(id, "RECHAZADO", validacion.revisado_por, validacion.motivo_rechazo ?? null, null, conn);
        }

        const actualizado = await repo.obtenerReporte(id, conn);
        const avistamiento = actualizado?.id_avistamiento
            ? await repo.obtenerAvistamiento(actualizado.id_avistamiento, conn)
            : null;
        return { reporte: actualizado, avistamiento };
    });
}
