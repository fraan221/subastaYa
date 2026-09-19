# SubastaYa

[![.NET 10](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat-square&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/) [![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-Web%20API-512BD4?style=flat-square&logo=dotnet&logoColor=white)](https://learn.microsoft.com/aspnet/core) [![EF Core](https://img.shields.io/badge/EF%20Core-10.0-512BD4?style=flat-square&logo=dotnet&logoColor=white)](https://learn.microsoft.com/ef/core) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/) [![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/) [![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) [![OpenAPI / Swagger](https://img.shields.io/badge/OpenAPI-3.1%20%2F%20Swagger%20UI-85EA2D?style=flat-square&logo=swagger&logoColor=black)](http://localhost:5080/swagger) [![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

---

## Índice

- [SubastaYa](#subastaya)
  - [Índice](#índice)
  - [Swagger UI](#swagger-ui)
    - [Autenticacion](#autenticacion)
  - [Instalación \& Ejecución](#instalación--ejecución)
    - [Prerrequisitos](#prerrequisitos)
  - [Stress Test](#stress-test)
    - [Ejecucion](#ejecucion)
  - [Autores](#autores)

---

## Swagger UI

- **Swagger UI:** [http://localhost:5080/swagger](http://localhost:5080/swagger)
- **JSON:** [http://localhost:5080/openapi/v1.json](http://localhost:5080/openapi/v1.json)

### Autenticacion

1. Realizar una peticion `POST /api/auth/login` con credenciales validas.
2. Copiar el valor devuelto en la propiedad `token`.
3. Presionar el boton **Authorize** en el encabezado de Swagger UI.
4. Ingresar el token en formato `Bearer <token>` y confirmar.

---

## Instalación & Ejecución

### Prerrequisitos

- .NET SDK 10.0+
- Node.js 20+ y gestor de paquetes `pnpm`
- Docker y Docker Compose

1. Parado en `/SubastaYa/`

```bash
docker compose up -d db
```

1. Nos movemos a `SubastaYa/`

```bash
cd SubastaYa/
dotnet run
```

3. En otra terminal, parado en `/SubastaYa`

```bash
cd SubastaYaFront/
pnpm install
pnpm dev
```

---

## Stress Test

- `StressTest/SubastaYa_Stress_Test.postman_collection.json`: Coleccion oficial de Postman con las peticiones y aserciones.
- `StressTest/run_concurrency.js`: Script que dispara dos instancias de Newman en paralelo (`Promise.all`) para generar la concurrencia real.

### Ejecucion

Con el backend en ejecucion:

```bash
node StressTest/run_concurrency.js
```

Salida aproximada:

```bash
[Stress Test] Subasta 1 (v0) - Disparando 2 peticiones concurrentes por $50000...
  -> Peticion 1: HTTP 409 - Rechazada (Conflicto de concurrencia: otro usuario modifico los datos simultaneamente. Por favor, intenta nuevamente.)
  -> Peticion 2: HTTP 201 - Aceptada (Puja ID: 4, Monto: $50000)
[Consistencia] Version: 0 -> 1 | Monto lider: $50000 (Comprador2)
[Resultado] OK: Concurrencia Optimista Verificada (201 vs 409)
```

---

## Autores

<table>
  <tr>
    <td align="center" width="220px">
      <a href="https://github.com/fraan221">
        <img src="https://github.com/fraan221.png?size=140" width="110px;" height="110px;" style="border-radius: 50%;" alt="Franco Herrera"/><br />
        <sub><b>Franco Herrera</b></sub>
      </a>
      <br />
      <sub>Desarrollo Backend / Frontend</sub>
      <br /><br />
      <a href="https://github.com/fraan221">
        <img src="https://img.shields.io/badge/GitHub-Profile-181717?style=flat-square&logo=github" alt="GitHub" />
      </a>
    </td>
    <td align="center" width="220px">
      <a href="https://github.com/trieel">
        <img src="https://github.com/trieel.png?size=140" width="110px;" height="110px;" style="border-radius: 50%;" alt="Catriel"/><br />
        <sub><b>Catriel Aliaga</b></sub>
      </a>
      <br />
      <sub>Desarrollo Backend / Frontend</sub>
      <br /><br />
      <a href="https://github.com/trieel">
        <img src="https://img.shields.io/badge/GitHub-Profile-181717?style=flat-square&logo=github" alt="GitHub" />
      </a>
    </td>
  </tr>
</table>
