import { Router } from "express";
import { asyncHandler } from "../../utils/errors";
import * as ctrl from "./avistamientos.controller";

const router = Router();

// RF14 y RF17
router.post("/avistamientos", asyncHandler(ctrl.crearAvistamiento));
router.get("/avistamientos", asyncHandler(ctrl.listarAvistamientos));
router.get("/avistamientos/:id", asyncHandler(ctrl.obtenerAvistamiento));
router.patch("/avistamientos/:id/verificacion", asyncHandler(ctrl.actualizarVerificacion));

// RF15 y RF16
router.post("/reportes", asyncHandler(ctrl.crearReporte));
router.get("/reportes", asyncHandler(ctrl.listarReportes));
router.get("/reportes/:id", asyncHandler(ctrl.obtenerReporte));
router.patch("/reportes/:id/validar", asyncHandler(ctrl.validarReporte));

export default router;
