# SubastaYa 🏷️

Plataforma web de subastas en tiempo real y comercio electrónico construida para la cátedra de **Proyecto de Software**.

## 📌 Descripción General

"SubastaYa" busca modernizar las compras y ventas competitivas en línea a través de dos pilares clave:
1. **Confianza y Solvencia Económica (Escrow):** Toda puja está respaldada por saldo real congelado en garantía dentro de la billetera virtual del usuario, liberándose automáticamente al ser superada.
2. **Juego Limpio (Anti-sniping):** Mecanismo de extensión dinámica de 2 minutos adicionales si se registra una oferta válida durante los últimos 60 segundos de la subasta.

---

## 🛠️ Stack Tecnológico

* **Backend:** ASP.NET Core 10 Web API, Entity Framework Core 10 (Code-First con migraciones), SignalR, Hosted Services (`AuctionFinalizationWorker`), BCrypt y Autenticación JWT Bearer.
* **Base de Datos:** PostgreSQL 16 (con soporte para transacciones ACID y *Optimistic Locking* mediante control de concurrencia).
* **Frontend:** React 19, Vite, Tailwind CSS v4, Shadcn UI y Axios.
* **Documentación:** Especificación OpenAPI v3 y Swagger UI interactivo.

---

## 📖 Documentación de la API (OpenAPI & Swagger UI)

La API cuenta con autogeneración de especificación OpenAPI y documentación interactiva mediante **Swagger UI**:

* **Swagger UI:** [http://localhost:5080/swagger](http://localhost:5080/swagger)
* **Especificación OpenAPI JSON:** [http://localhost:5080/openapi/v1.json](http://localhost:5080/openapi/v1.json)

> **Autenticación en Swagger:** Para probar endpoints protegidos, autenticarse en `/api/auth/login`, copiar el token recibido y utilizar el botón **Authorize** en la esquina superior derecha de Swagger UI.

---

## 🚧 Estado del Proyecto (Placeholder)

> *Nota:* Las instrucciones detalladas de instalación, despliegue con Docker Compose, tabla completa de datos semilla (*Seed Data*) y guía de pruebas de concurrencia (*Stress Test*) se incorporarán en las próximas etapas de entrega.
