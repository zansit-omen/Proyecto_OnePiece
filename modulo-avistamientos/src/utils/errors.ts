import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Envuelve los controladores async para que los errores lleguen al errorHandler
export const asyncHandler = (fn: Handler) =>
    (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch(next);
    };

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof HttpError) {
        res.status(err.status).json({ ok: false, mensaje: err.message });
        return;
    }
    if (err?.code === "ER_NO_REFERENCED_ROW_2") {
        res.status(400).json({ ok: false, mensaje: "El criminal indicado no existe" });
        return;
    }
    console.error(err);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
}
