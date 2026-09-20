# Plan de Implementación: Flujo Git, Swagger UI y README Placeholder

## Descripción del Objetivo

El objetivo de esta etapa es:
1. **Flujo de Ramas Git:** 
   - Cambiar a la rama `dev`.
   - Integrar los cambios finalizados de `feature/wallet-management` en `dev`.
   - Crear la nueva rama `feature/api-documentation` basada en `dev`.
2. **Documentación OpenAPI (Swagger UI):**
   - Incorporar `Swashbuckle.AspNetCore.SwaggerUI` en `SubastaYa` (.NET 10).
   - Configurar `Program.cs` para autogenerar la especificación OpenAPI v3 enriquecida con metadatos y el esquema de autenticación **Bearer JWT** (permitiendo el uso del botón interactivo *Authorize* en Swagger).
   - Habilitar `UseSwaggerUI` en la ruta `/swagger`.
   - Configurar `launchSettings.json` y `compose.yaml` con `ASPNETCORE_ENVIRONMENT=Development`.
3. **README Placeholder:**
   - Crear un `README.md` inicial en la raíz del proyecto como placeholder estructurado, postergando la guía extendida y el stress test para la siguiente etapa.
4. **Gitignore:**
   - Excluir `.agents/` y `skills-lock.json` para mantener el árbol de trabajo limpio.

---

## User Review Required

> [!NOTE]
> Al mergear `feature/wallet-management` en `dev` localmente, mantendremos la rama lista. Si requieres hacer `git push origin dev`, lo podrás hacer una vez verificado el merge.

> [!IMPORTANT]
> La documentación Swagger UI quedará disponible en `http://localhost:5080/swagger`, leyendo directamente la especificación generada por .NET 10 en `/openapi/v1.json`.

---

## Cambios Propuestos

### 1. Operaciones Git (Preparación de Ramas)

Ejecutar la secuencia:
```bash
git checkout dev
git merge feature/wallet-management
git checkout -b feature/api-documentation
```

---

### 2. Backend (`SubastaYa`)

#### [MODIFY] [SubastaYa.csproj](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/SubastaYa.csproj)
- Agregar la referencia al paquete `Swashbuckle.AspNetCore.SwaggerUI` (versión 10.2.3):
```xml
<PackageReference Include="Swashbuckle.AspNetCore.SwaggerUI" Version="10.2.3" />
```

#### [MODIFY] [Program.cs](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Program.cs)
- Configurar `builder.Services.AddOpenApi()` con transformadores para metadatos del documento y esquema Bearer JWT:
```csharp
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Info = new()
        {
            Title = "SubastaYa API",
            Version = "v1",
            Description = "API RESTful para la plataforma de subastas en tiempo real SubastaYa."
        };

        document.Components ??= new();
        document.Components.SecuritySchemes.Add("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "Ingrese el token JWT obtenido en /api/auth/login"
        });

        document.SecurityRequirements.Add(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });

        return Task.CompletedTask;
    });
});
```
- En el pipeline HTTP de la aplicación:
```csharp
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "SubastaYa API v1");
        options.RoutePrefix = "swagger";
    });
}
```

#### [MODIFY] [launchSettings.json](file:///home/fraan/Documents/Projects/SubastaYa/SubastaYa/Properties/launchSettings.json)
- Modificar `launchUrl` a `"swagger"`.

#### [MODIFY] [compose.yaml](file:///home/fraan/Documents/Projects/SubastaYa/compose.yaml)
- Agregar `- ASPNETCORE_ENVIRONMENT=Development` en el servicio `subastaya`.

---

### 3. Raíz del Repositorio

#### [MODIFY] [.gitignore](file:///home/fraan/Documents/Projects/SubastaYa/.gitignore)
- Agregar `.agents/` y `skills-lock.json`.

#### [NEW] [README.md](file:///home/fraan/Documents/Projects/SubastaYa/README.md)
- Placeholder inicial estructurado:
  - Título y descripción general del proyecto SubastaYa.
  - Stack técnico (.NET 10 Web API, PostgreSQL, React 19 Vite).
  - Enlaces a documentación Swagger (`/swagger`).
  - Nota indicando que las instrucciones completas de instalación, datos semilla y stress test se completarán en la entrega final.

---

## Plan de Verificación

### Compilación y Verificación Automatizada
1. Ejecutar `dotnet restore SubastaYa/SubastaYa.csproj` y `dotnet build SubastaYa/SubastaYa.csproj` comprobando compilación limpia con 0 advertencias y 0 errores.

### Verificación Manual de Swagger UI
1. Iniciar el backend con `dotnet run --project SubastaYa/SubastaYa.csproj` (o ejecutar en background).
2. Consultar `curl -s http://localhost:5080/openapi/v1.json` para verificar que la especificación contenga los endpoints, el título "SubastaYa API" y el esquema "Bearer".
3. Consultar `curl -s -I http://localhost:5080/swagger/index.html` para validar código HTTP 200.
4. Validar que la rama actual sea `feature/api-documentation`.
