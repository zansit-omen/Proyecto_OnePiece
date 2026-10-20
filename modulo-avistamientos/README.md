# Módulo de avistamientos – Centro de inteligencia (One Piece)

## Instalación
1. Copia `src/modules/avistamientos/` y `src/utils/errors.ts` a tu proyecto.
2. Ejecuta `sql/schema.sql` en tu base de datos (requiere la tabla `criminales(id_criminal)`).
3. Si ya tienes conexión, haz que `src/db.ts` exporte tu `pool` de `mysql2/promise`.
4. En tu `app.ts` agrega las 3 líneas marcadas en `src/app.ts`.
5. `npm install express mysql2 dotenv` y `npm run dev`.

## Flujo
Ciudadano reporta (PENDIENTE) -> analista valida:
  - VERIFICAR -> se crea un avistamiento oficial VERIFICADO vinculado al reporte
  - RECHAZAR  -> el reporte queda RECHAZADO con motivo

## Endpoints (base: http://localhost:3000/api)

| RF | Método | Ruta | Descripción |
|----|--------|------|-------------|
| 14 | POST  | /avistamientos | Registrar avistamiento (queda SIN_VERIFICAR) |
| 15 | POST  | /reportes | Ciudadano/informante envía reporte (queda PENDIENTE) |
| 16 | PATCH | /reportes/:id/validar | VERIFICAR o RECHAZAR un reporte |
| 17 | GET   | /avistamientos?id_criminal=&zona=&fecha_desde=&fecha_hasta=&estado_verificacion=&pagina=&limite= | Consulta con filtros combinables |
| -  | GET   | /avistamientos/:id | Detalle |
| -  | PATCH | /avistamientos/:id/verificacion | Cambiar estado de un avistamiento directo |
| -  | GET   | /reportes?estado=PENDIENTE&id_criminal= | Bandeja de reportes por revisar |
| -  | GET   | /reportes/:id | Detalle de reporte |

## Ejemplos para Postman (Body -> raw -> JSON)

POST /avistamientos
{
  "id_criminal": 1,
  "fecha_avistamiento": "2026-10-15T18:30:00",
  "zona": "Isla Fish-Man",
  "ubicacion": "Puerto principal, muelle 3",
  "testigo": "Capitán Smoker",
  "descripcion": "Visto abordando un barco con sombrero de paja"
}

POST /reportes
{
  "id_criminal": 1,
  "nombre_informante": "Makino",
  "contacto": "makino@mail.com",
  "fecha_avistamiento": "2026-10-17",
  "zona": "Isla Fish-Man",
  "ubicacion": "Taberna del puerto",
  "descripcion": "Entró a comprar provisiones"
}

PATCH /reportes/1/validar   (verificar)
{ "accion": "VERIFICAR", "revisado_por": "Analista Tashigi" }

PATCH /reportes/2/validar   (rechazar)
{ "accion": "RECHAZAR", "revisado_por": "Analista Tashigi", "motivo_rechazo": "Información no coincide con la descripción del criminal" }

PATCH /avistamientos/1/verificacion
{ "estado_verificacion": "VERIFICADO" }

GET /avistamientos?id_criminal=1&zona=fish&fecha_desde=2026-10-01&fecha_hasta=2026-10-31&estado_verificacion=VERIFICADO

## Códigos de respuesta
201 creado · 200 ok · 400 datos inválidos · 404 no existe · 409 reporte ya revisado · 500 error interno
