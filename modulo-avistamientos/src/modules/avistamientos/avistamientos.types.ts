export type EstadoVerificacion = "SIN_VERIFICAR" | "VERIFICADO" | "DESCARTADO";
export type EstadoReporte = "PENDIENTE" | "VERIFICADO" | "RECHAZADO";
export type OrigenAvistamiento = "REGISTRO_DIRECTO" | "REPORTE_CIUDADANO";

export const ESTADOS_VERIFICACION: EstadoVerificacion[] = ["SIN_VERIFICAR", "VERIFICADO", "DESCARTADO"];
export const ESTADOS_REPORTE: EstadoReporte[] = ["PENDIENTE", "VERIFICADO", "RECHAZADO"];

export interface Avistamiento {
    id_avistamiento: number;
    id_criminal: number;
    fecha_avistamiento: Date;
    zona: string;
    ubicacion: string;
    testigo: string;
    descripcion?: string | null;
    estado_verificacion: EstadoVerificacion;
    origen: OrigenAvistamiento;
    id_reporte?: number | null;
    fecha_registro: Date;
}

export interface ReporteCiudadano {
    id_reporte: number;
    id_criminal: number;
    nombre_informante: string;
    contacto?: string | null;
    fecha_avistamiento: Date;
    zona: string;
    ubicacion: string;
    descripcion?: string | null;
    estado: EstadoReporte;
    fecha_reporte: Date;
    fecha_revision?: Date | null;
    revisado_por?: string | null;
    motivo_rechazo?: string | null;
    id_avistamiento?: number | null;
}

// ---- Datos de entrada (lo que llega desde Postman) ----
export interface NuevoAvistamiento {
    id_criminal: number;
    fecha_avistamiento: Date;
    zona: string;
    ubicacion: string;
    testigo: string;
    descripcion?: string | null;
    estado_verificacion?: EstadoVerificacion;
    origen?: OrigenAvistamiento;
    id_reporte?: number | null;
}

export interface NuevoReporte {
    id_criminal: number;
    nombre_informante: string;
    contacto?: string | null;
    fecha_avistamiento: Date;
    zona: string;
    ubicacion: string;
    descripcion?: string | null;
}

export interface ValidacionReporte {
    accion: "VERIFICAR" | "RECHAZAR";
    revisado_por: string;
    motivo_rechazo?: string | null;
}

// ---- Filtros de consulta (RF17) ----
export interface FiltrosAvistamiento {
    id_criminal?: number;
    zona?: string;
    fecha_desde?: Date;
    fecha_hasta?: Date;
    estado_verificacion?: EstadoVerificacion;
    pagina: number;
    limite: number;
}

export interface FiltrosReporte {
    id_criminal?: number;
    estado?: EstadoReporte;
    pagina: number;
    limite: number;
}
