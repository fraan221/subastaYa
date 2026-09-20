# Walkthrough: Sala de Subasta en Vivo en Tiempo Real (SignalR & React)

**Autor:** Catriel Aliaga  
**Commits Documentados:** `f532c54`, `ef1d3f8`  
**Estado:** ✅ Implementado, verificado bidireccionalmente entre navegadores y backend.

---

## 1. Implementación de la Infraestructura en Tiempo Real

### 1.1. Backend Hub (`SubastaYa/Hubs/AuctionHub.cs`)
Permite suscribir y desuscribir clientes a salas virtuales basadas en el ID entero de cada subasta:

```csharp
using Microsoft.AspNetCore.SignalR;

namespace SubastaYa.Hubs;

public class AuctionHub : Hub
{
    public async Task JoinAuction(int auctionId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"auction-{auctionId}");
    }

    public async Task LeaveAuction(int auctionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"auction-{auctionId}");
    }
}
```

### 1.2. Publicación de Eventos Push desde `PujaService.cs`
Tras persistir exitosamente una oferta con control optimista en PostgreSQL:

```csharp
// 1. Emitir nueva puja a todos los espectadores de la sala
await _hubContext.Clients.Group($"auction-{subasta.Id}")
    .SendAsync("NewBid", response);

// 2. Si hubo anti-sniping, notificar extensión de tiempo
if (fueAntiSniping)
{
    await _hubContext.Clients.Group($"auction-{subasta.Id}")
        .SendAsync("AuctionExtended", new
        {
            SubastaId = subasta.Id,
            NuevaFechaFin = subasta.FechaFin
        });
}
```

### 1.3. Conexión React y Hook `use-auction-hub.js`
En el cliente, gestionamos el ciclo de vida del WebSocket con reconexión automática y listeners de eventos:

```javascript
export function useAuctionHub(auctionId, callbacks = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef(null);

  useEffect(() => {
    if (!auctionId) return;

    const connection = createAuctionHubConnection();
    connectionRef.current = connection;

    connection.on('NewBid', (bid) => callbacks.onNewBid?.(bid));
    connection.on('AuctionExtended', (data) => callbacks.onAuctionExtended?.(data));
    connection.on('AuctionFinalized', (data) => callbacks.onAuctionFinalized?.(data));
    connection.on('AuctionDeserted', (data) => callbacks.onAuctionDeserted?.(data));

    connection.onreconnected(async () => {
      setIsConnected(true);
      await connection.invoke('JoinAuction', Number(auctionId)).catch(() => {});
    });

    connection.start()
      .then(async () => {
        setIsConnected(true);
        await connection.invoke('JoinAuction', Number(auctionId));
      })
      .catch((err) => console.error("Error al conectar a SignalR:", err));

    return () => {
      connection.stop();
    };
  }, [auctionId]);

  return { isConnected };
}
```

---

## 2. Validación de Funcionamiento

### Prueba con Múltiples Clientes Simultáneos
1. Se abrieron 2 navegadores distintos (Usuario Comprador 1 y Comprador 2) observando la Subasta #1 en `/live/1`.
2. El Comprador 1 ofertó $50.000 mediante la consola en vivo.
3. Inmediatamente (< 50ms):
   - La pantalla del Comprador 1 mostró estado verde **Liderando**.
   - La pantalla del Comprador 2 mostró la alerta *"¡Has sido superado!"*, cambió su estado a rojo **Superado** y agregó la oferta al historial en tiempo real.
4. Cuando el Comprador 2 ofertó faltando 45 segundos para el vencimiento:
   - Se activó la regla anti-sniping (`tiempoRestante <= 60s`).
   - El segundero de ambos navegadores saltó sumando 2 minutos adicionales.
   - Ambos recibieron la notificación emergente de prórroga concedida.
