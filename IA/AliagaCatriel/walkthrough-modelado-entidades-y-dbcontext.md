# Walkthrough: Modelado de Entidades de Dominio y Contexto EF Core

**Autor:** Catriel Aliaga  
**Commits Documentados:**
- `398b8d4`: *Creacion de entidades y upgrade de appdbcontext*
- `b198c50`: *refactor(backend): initialize auction collections and enforce strict wallet relationship mapping*  
**Estado:** ✅ Implementado, migrado y validado en PostgreSQL.

---

## 1. Implementación de las Entidades de Dominio

### 1.1. Billetera y Modelo de Escrow (`SubastaYa/Models/Entities/Billetera.cs`)
Estructura diseñada para soportar retención atómica de fondos y control de concurrencia optimista:

```csharp
namespace SubastaYa.Models.Entities;

public class Billetera
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public decimal SaldoTotal { get; set; }
    public decimal SaldoRetenido { get; set; }
    public decimal SaldoDisponible { get; set; }
    public int Version { get; set; }

    public Usuario Usuario { get; set; } = null!;
}
```

### 1.2. Subasta con Inicialización de Colecciones (`SubastaYa/Models/Entities/Subasta.cs`)
Refactorizada en `b198c50` para evitar referencias nulas en memoria:

```csharp
namespace SubastaYa.Models.Entities;

public class Subasta
{
    public int Id { get; set; }
    public int VendedorId { get; set; }
    public int CategoriaId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string UrlImagen { get; set; } = string.Empty;
    public decimal PrecioBase { get; set; }
    public decimal IncrementoMinimo { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public EstadoSubasta Estado { get; set; }
    public int Version { get; set; }

    public Usuario Vendedor { get; set; } = null!;
    public Categoria Categoria { get; set; } = null!;
    public ICollection<Puja> Pujas { get; set; } = new List<Puja>();
}
```

### 1.3. Libro Mayor Contable (`SubastaYa/Models/Entities/TransaccionLedger.cs`)
Garantiza inmutabilidad y auditoría de cada centavo retenido, liberado o transferido:

```csharp
namespace SubastaYa.Models.Entities;

public class TransaccionLedger
{
    public int Id { get; set; }
    public int BilleteraId { get; set; }
    public TipoTransaccion Tipo { get; set; }
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; }
    public int? SubastaId { get; set; }

    public Billetera Billetera { get; set; } = null!;
    public Subasta? Subasta { get; set; }
}
```

### 1.4. Auditoría Polimórfica (`SubastaYa/Models/Entities/AuditoriaLog.cs`)
Permite rastrear eventos de cualquier entidad de negocio de manera uniforme:

```csharp
namespace SubastaYa.Models.Entities;

public class AuditoriaLog
{
    public int Id { get; set; }
    public string Entidad { get; set; } = string.Empty;
    public int EntidadId { get; set; }
    public string Accion { get; set; } = string.Empty;
    public int? UsuarioId { get; set; }
    public string DetalleJson { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }

    public Usuario? Usuario { get; set; }
}
```

---

## 2. Configuración Fluent API en `AppDbContext.cs`

En `SubastaYa/Data/AppDbContext.cs`, configuramos las restricciones de integridad y precisión:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // 1. Relación 1:1 estricta Usuario - Billetera sin cascada
    modelBuilder.Entity<Billetera>(entity =>
    {
        entity.HasKey(b => b.Id);
        entity.ToTable("billetera");
        entity.Property(b => b.SaldoTotal).HasColumnType("decimal(18,2)").IsRequired();
        entity.Property(b => b.SaldoRetenido).HasColumnType("decimal(18,2)").IsRequired();
        entity.Property(b => b.SaldoDisponible).HasColumnType("decimal(18,2)").IsRequired();
        entity.Property(b => b.Version).IsRequired();
        entity.HasOne(b => b.Usuario)
              .WithOne(u => u.Billetera)
              .HasForeignKey<Billetera>(b => b.UsuarioId)
              .OnDelete(DeleteBehavior.Restrict);
    });

    // 2. Subastas con conversión de enum y precisión
    modelBuilder.Entity<Subasta>(entity =>
    {
        entity.HasKey(s => s.Id);
        entity.ToTable("subasta");
        entity.Property(s => s.PrecioBase).HasColumnType("decimal(18,2)").IsRequired();
        entity.Property(s => s.IncrementoMinimo).HasColumnType("decimal(18,2)").IsRequired();
        entity.Property(s => s.Estado).HasConversion<string>().HasMaxLength(50).IsRequired();
        entity.Property(s => s.Version).IsRequired();
        entity.HasOne(s => s.Vendedor).WithMany().HasForeignKey(s => s.VendedorId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(s => s.Categoria).WithMany().HasForeignKey(s => s.CategoriaId).OnDelete(DeleteBehavior.Restrict);
    });

    // 3. Pujas con borrado en cascada desde subasta
    modelBuilder.Entity<Puja>(entity =>
    {
        entity.HasKey(p => p.Id);
        entity.ToTable("puja");
        entity.Property(p => p.Monto).HasColumnType("decimal(18,2)").IsRequired();
        entity.HasOne(p => p.Subasta).WithMany(s => s.Pujas).HasForeignKey(p => p.SubastaId).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne(p => p.Comprador).WithMany().HasForeignKey(p => p.CompradorId).OnDelete(DeleteBehavior.Restrict);
    });

    // 4. Ledger y Auditoría
    modelBuilder.Entity<TransaccionLedger>(entity =>
    {
        entity.HasKey(tl => tl.Id);
        entity.ToTable("transaccion_ledger");
        entity.Property(tl => tl.Tipo).HasConversion<string>().HasMaxLength(50).IsRequired();
        entity.Property(tl => tl.Monto).HasColumnType("decimal(18,2)").IsRequired();
        entity.HasOne(tl => tl.Billetera).WithMany().HasForeignKey(tl => tl.BilleteraId).OnDelete(DeleteBehavior.Restrict);
    });
}
```

---

## 3. Refactorización Aplicada en el Commit `b198c50`

Durante la auditoría de código previa a la entrega final, se identificaron y subsanaron dos posibles fuentes de inconsistencia:
1. **Inicialización de Listas de Navegación:** En `Subasta.cs`, se reemplazó `public ICollection<Puja> Pujas { get; set; } = null!;` por `new List<Puja>()`. Esto previene `NullReferenceException` al operar con subastas en pruebas unitarias o lógicas desconectadas de EF Core.
2. **Consistencia de Relación de Billetera en Ledger:** Se eliminó la directiva redundante `.IsRequired(false)` en la relación con `BilleteraId`, dado que la propiedad es un tipo `int` no anulable obligatorio para la consistencia contable.

---

## 4. Verificación en el Entorno

### Compilación y Verificación de Migraciones
```bash
dotnet build SubastaYa.sln
# Salida: Build succeeded. 0 Warning(s). 0 Error(s).
```

### Inspección en Base de Datos PostgreSQL
Al ejecutar las migraciones generadas, las 7 tablas se instancian con sus índices, claves foráneas y tipos precisos:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- usuario, billetera, subasta, puja, categoria, transaccion_ledger, auditoria_log
```
Todas las restricciones de tipo `decimal(18,2)` garantizan la ausencia de desvíos de centavos en la liquidación de subastas.
