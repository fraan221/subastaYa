# Walkthrough: Módulo de Mis Actividades (Ofertas y Publicaciones)

**Autor:** Catriel Aliaga  
**Commits Documentados:** `12e8eae`, `23e6ba9`  
**Estado:** ✅ Implementado en backend y frontend, verificado en navegador.

---

## 1. Implementación Técnica

### 1.1. Determinación de Estados de Puja en Backend (`ActivitiesService.cs`)
Para que el usuario sepa en tiempo real si va ganando o si ya perdió, se calcula el estado en base a la subasta y la puja mayor:

```csharp
var pujaMayor = subasta.Pujas.OrderByDescending(p => p.Monto).FirstOrDefault();
string estadoPuja;

if (subasta.Estado == EstadoSubasta.Activa)
{
    estadoPuja = (pujaMayor != null && pujaMayor.CompradorId == usuarioId) 
        ? "Ganando" 
        : "Superada";
}
else if (subasta.Estado == EstadoSubasta.Finalizada)
{
    estadoPuja = (pujaMayor != null && pujaMayor.CompradorId == usuarioId) 
        ? "Ganada" 
        : "Perdida";
}
else
{
    estadoPuja = "Cancelada";
}
```

### 1.2. Interfaz React: Tarjetas y Badges de Estado
En `SubastaYaFront/src/components/activity/bid-activity-card.jsx`, renderizamos estados claros con badges diferenciados:

```jsx
const estadoBadge = {
  Ganando: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Superada: "bg-amber-100 text-amber-800 border-amber-300",
  Ganada: "bg-blue-100 text-blue-800 border-blue-300",
  Perdida: "bg-slate-100 text-slate-700 border-slate-300",
  Cancelada: "bg-red-100 text-red-700 border-red-300"
};

export function BidActivityCard({ actividad }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow transition">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-slate-900">{actividad.tituloSubasta}</h3>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${estadoBadge[actividad.estadoPuja]}`}>
          {actividad.estadoPuja}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-500">Mi Oferta:</span>
          <p className="font-bold text-slate-900">${actividad.miMonto.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-slate-500">Oferta Mayor:</span>
          <p className="font-bold text-emerald-600">${actividad.montoActual.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 2. Pruebas y Validación Funcional

1. **Prueba como Comprador:**
   - Usuario puja en Subasta #3 por $15.000 $\rightarrow$ En `/actividades` pestaña "Mis Ofertas" figura con badge verde **Ganando**.
   - Otro usuario puja $18.000 $\rightarrow$ Al refrescar o recibir la señal, la tarjeta transiciona a badge amarillo **Superada**, invitando a volver a la sala en vivo.
2. **Prueba como Vendedor:**
   - En la pestaña "Mis Publicaciones", se listan las subastas creadas por el usuario autenticado con métricas agregadas: Total de ofertas recibidas, precio base vs. precio actual y fecha límite.
3. **Paginación y Seguridad:**
   - La respuesta HTTP devuelve cabeceras correctas de paginación y rechaza cualquier petición no autenticada con HTTP 401.
