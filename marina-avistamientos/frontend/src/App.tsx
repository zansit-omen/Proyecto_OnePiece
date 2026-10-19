
import { useEffect, useState } from "react";
import "./App.css";

interface EstadoBackend {
    estado: string;
    mensaje: string;
}

function App() {
    const [backend, setBackend] = useState<EstadoBackend | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        fetch("http://localhost:3000/api/health")
            .then((respuesta) => {
                if (!respuesta.ok) {
                    throw new Error("El servidor respondió con un error");
                }

                return respuesta.json() as Promise<EstadoBackend>;
            })
            .then((datos) => {
                setBackend(datos);
                setError(null);
            })
            .catch(() => {
                setError("No se pudo conectar con el backend.");
            })
            .finally(() => {
                setCargando(false);
            });
    }, []);

    return (
        <main className="contenedor">
            <h1>Marina — Centro de Inteligencia</h1>
            <p>Gestión de avistamientos de criminales</p>

            <section className="panel">
                <h2>Estado del sistema</h2>

                {cargando && <p>Conectando con el servidor...</p>}

                {error && <p className="error">{error}</p>}

                {backend && (
                    <div className="exito">
                        <p>Estado: {backend.estado}</p>
                        <p>{backend.mensaje}</p>
                    </div>
                )}
            </section>
        </main>
    );
}

export default App;
