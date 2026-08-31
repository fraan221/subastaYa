using Microsoft.EntityFrameworkCore;
using SubastaYa.Models.Entities;

namespace SubastaYa.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Subasta> Subastas => Set<Subasta>();
    public DbSet<Puja> Pujas => Set<Puja>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Billetera> Billeteras => Set<Billetera>();
    public DbSet<TransaccionLedger> TransaccionLedgers => Set<TransaccionLedger>();
    public DbSet<AuditoriaLog> AuditoriaLogs => Set<AuditoriaLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Usuario ──
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.ToTable("usuario");
            entity.Property(u => u.Id).HasColumnName("id");
            entity.Property(u => u.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(u => u.Email).HasColumnName("email").HasMaxLength(150).IsRequired();
            entity.Property(u => u.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
            entity.Property(u => u.FechaRegistro).HasColumnName("fecha_registro").IsRequired();
            entity.HasIndex(u => u.Email).IsUnique();
        });
        
        // ── Billetera ──
        modelBuilder.Entity<Billetera>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.ToTable("billetera");
            entity.Property(b => b.Id).HasColumnName("id");
            entity.Property(b => b.UsuarioId).HasColumnName("usuario_id").IsRequired();
            entity.Property(b => b.SaldoTotal).HasColumnName("saldo_total").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(b => b.SaldoRetenido).HasColumnName("saldo_retenido").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(b => b.SaldoDisponible).HasColumnName("saldo_disponible").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(b => b.Version).HasColumnName("version").IsRequired();
            entity.HasOne(b => b.Usuario).WithOne(u => u.Billetera).HasForeignKey<Billetera>(b => b.UsuarioId).OnDelete(DeleteBehavior.Restrict);
        });
        
        // ── Puja ──
        modelBuilder.Entity<Puja>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.ToTable("puja");
            entity.Property(p => p.Id).HasColumnName("id");
            entity.Property(p => p.SubastaId).HasColumnName("subasta_id").IsRequired();
            entity.Property(p => p.CompradorId).HasColumnName("comprador_id").IsRequired();
            entity.Property(p => p.Monto).HasColumnName("monto").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(p => p.FechaPuja).HasColumnName("fecha_puja").IsRequired();
            entity.HasOne(p => p.Subasta).WithMany(s => s.Pujas).HasForeignKey(p => p.SubastaId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(p => p.Comprador).WithMany().HasForeignKey(p => p.CompradorId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // ── Subasta ──
        modelBuilder.Entity<Subasta>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.ToTable("subasta");
            entity.Property(s => s.Id).HasColumnName("id");
            entity.Property(s => s.VendedorId).HasColumnName("vendedor_id").IsRequired();
            entity.Property(s => s.CategoriaId).HasColumnName("categoria_id").IsRequired();
            entity.Property(s => s.Titulo).HasColumnName("titulo").HasMaxLength(200).IsRequired();
            entity.Property(s => s.Descripcion).HasColumnName("descripcion").HasMaxLength(1000).IsRequired();
            entity.Property(s => s.UrlImagen).HasColumnName("url_imagen").HasMaxLength(255).IsRequired();
            entity.Property(s => s.PrecioBase).HasColumnName("precio_base").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(s => s.IncrementoMinimo).HasColumnName("incremento_minimo").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(s => s.FechaInicio).HasColumnName("fecha_inicio").IsRequired();
            entity.Property(s => s.FechaFin).HasColumnName("fecha_fin").IsRequired();
            entity.Property(s => s.Estado).HasColumnName("estado").HasConversion<string>().HasMaxLength(50).IsRequired();
            entity.Property(s => s.Version).HasColumnName("version").IsRequired();
            entity.HasOne(s => s.Vendedor).WithMany().HasForeignKey(s => s.VendedorId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(s => s.Categoria).WithMany().HasForeignKey(s => s.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        
        // ── Categoria ──
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.ToTable("categoria");
            entity.Property(c => c.Id).HasColumnName("id");
            entity.Property(c => c.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(c => c.UrlIcono).HasColumnName("url_icono").HasMaxLength(255).IsRequired();
        });

        // ── Transaccion Ledger ──
        modelBuilder.Entity<TransaccionLedger>(entity =>
        {
            entity.HasKey(tl => tl.Id);
            entity.ToTable("transaccion_ledger");
            entity.Property(tl => tl.Id).HasColumnName("id");
            entity.Property(tl => tl.BilleteraId).HasColumnName("billetera_id").IsRequired();
            entity.Property(tl => tl.Tipo).HasColumnName("tipo").HasConversion<string>().HasMaxLength(50).IsRequired();
            entity.Property(tl => tl.Monto).HasColumnName("monto").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(tl => tl.Fecha).HasColumnName("fecha").IsRequired();
            entity.Property(tl => tl.SubastaId).HasColumnName("subasta_id").IsRequired();
            entity.HasOne(tl => tl.Billetera).WithMany().HasForeignKey(tl => tl.BilleteraId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(tl => tl.Subasta).WithMany().HasForeignKey(tl => tl.SubastaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Auditoria Log ──
        modelBuilder.Entity<AuditoriaLog>(entity =>
        {
            entity.HasKey(al => al.Id);
            entity.ToTable("auditoria_log");
            entity.Property(al => al.Id).HasColumnName("id");
            entity.Property(al => al.Entidad).HasColumnName("entidad").HasMaxLength(100).IsRequired();
            entity.Property(al => al.EntidadId).HasColumnName("entidad_id").IsRequired();
            entity.Property(al => al.Accion).HasColumnName("accion").HasMaxLength(50).IsRequired();
            entity.Property(al => al.UsuarioId).HasColumnName("usuario_id");
            entity.Property(al => al.DetalleJson).HasColumnName("detalle_json").HasMaxLength(2000).IsRequired();
            entity.Property(al => al.Fecha).HasColumnName("fecha").IsRequired();
            entity.HasOne(al => al.Usuario).WithMany().HasForeignKey(al => al.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}