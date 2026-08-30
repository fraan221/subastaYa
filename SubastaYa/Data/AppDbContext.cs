using Microsoft.EntityFrameworkCore;
namespace SubastaYa.Models.Entities;

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
    public DbSet<Transaccion_Ledger> Transacciones => Set<Transaccion_Ledger>();
    public DbSet<Auditoria_log> AuditoriaLogs => Set<Auditoria_log>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Usuario ──
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.id);
            entity.ToTable("usuarios");
            entity.Property(e => e.id).HasColumnName("id");
            entity.Property(e => e.nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(e => e.email).HasColumnName("email").HasMaxLength(150).IsRequired();
            entity.Property(e => e.password_hash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
            entity.Property(e => e.fecha_registro).HasColumnName("fecha_registro").IsRequired();
            entity.HasIndex(e => e.email).IsUnique();
        });

        // ── Categoria ──
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.HasKey(e => e.id);
            entity.ToTable("categorias");
            entity.Property(e => e.id).HasColumnName("id");
            entity.Property(e => e.nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
            entity.Property(e => e.url_icono).HasColumnName("url_icono").HasMaxLength(255).IsRequired();
        });

        // ── Billetera ──
        modelBuilder.Entity<Billetera>(entity =>
        {
            entity.HasKey(e => e.id);
            entity.ToTable("billeteras");
            entity.Property(e => e.id).HasColumnName("id");
            entity.Property(e => e.usuario_id).HasColumnName("usuario_id").IsRequired();
            entity.Property(e => e.saldo_total).HasColumnName("saldo_total").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(e => e.saldo_retenido).HasColumnName("saldo_retenido").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(e => e.saldo_disponible).HasColumnName("saldo_disponible").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(e => e.version).HasColumnName("version").IsRequired();
        });

        // ── Subasta ──
        modelBuilder.Entity<Subasta>(entity =>
        {
            entity.HasKey(e => e.id);
            entity.ToTable("subastas");
            entity.Property(e => e.id).HasColumnName("id");
            entity.Property(e => e.vendedor_id).HasColumnName("vendedor_id").IsRequired();
            entity.Property(e => e.categoria_id).HasColumnName("categoria_id").IsRequired();
            entity.Property(e => e.titulo).HasColumnName("titulo").HasMaxLength(200).IsRequired();
            entity.Property(e => e.descripcion).HasColumnName("descripcion").HasMaxLength(1000).IsRequired();
            entity.Property(e => e.url_imagen).HasColumnName("url_imagen").HasMaxLength(255).IsRequired();
            entity.Property(e => e.precio_base).HasColumnName("precio_base").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(e => e.incremento_minimo).HasColumnName("incremento_minimo").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(e => e.fecha_inicio).HasColumnName("fecha_inicio").IsRequired();
            entity.Property(e => e.fecha_fin).HasColumnName("fecha_fin").IsRequired();
            entity.Property(e => e.estado).HasColumnName("estado").HasMaxLength(50).IsRequired();
            entity.Property(e => e.version).HasColumnName("version").IsRequired();
        });

        // ── Puja ──
        modelBuilder.Entity<Puja>(entity =>
        {
            entity.HasKey(e => e.id);
            entity.ToTable("pujas");
            entity.Property(e => e.id).HasColumnName("id");
            entity.Property(e => e.subasta_id).HasColumnName("subasta_id").IsRequired();
            entity.Property(e => e.comprador_id).HasColumnName("comprador_id").IsRequired();
            entity.Property(e => e.monto).HasColumnName("monto").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(e => e.fecha_puja).HasColumnName("fecha_puja").IsRequired();
        });

        // ── Transaccion_Ledger ──
        modelBuilder.Entity<Transaccion_Ledger>(entity =>
        {
            entity.HasKey(e => e.id);
            entity.ToTable("transacciones_ledger");
            entity.Property(e => e.id).HasColumnName("id");
            entity.Property(e => e.billetera_id).HasColumnName("billetera_id").IsRequired();
            entity.Property(e => e.tipo).HasColumnName("tipo").HasMaxLength(50).IsRequired();
            entity.Property(e => e.monto).HasColumnName("monto").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(e => e.fecha).HasColumnName("fecha").IsRequired();
            entity.Property(e => e.subasta_id).HasColumnName("subasta_id").IsRequired();
        });

        // ── Auditoria_log ──
        modelBuilder.Entity<Auditoria_log>(entity =>
        {
            entity.HasKey(e => e.id);
            entity.ToTable("auditoria_logs");
            entity.Property(e => e.id).HasColumnName("id");
            entity.Property(e => e.entidad).HasColumnName("entidad").HasMaxLength(100).IsRequired();
            entity.Property(e => e.entidad_id).HasColumnName("entidad_id").IsRequired();
            entity.Property(e => e.accion).HasColumnName("accion").HasMaxLength(50).IsRequired();
            entity.Property(e => e.usuario_id).HasColumnName("usuario_id").IsRequired();
            entity.Property(e => e.detalle_json).HasColumnName("detalle_json").HasMaxLength(2000).IsRequired();
            entity.Property(e => e.Fecha).HasColumnName("fecha").IsRequired();
        });
    }
}