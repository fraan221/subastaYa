using Microsoft.EntityFrameworkCore;
using SubastaYa.Data;
using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;
using SubastaYa.Repositories.Interfaces;

namespace SubastaYa.Repositories;

public class SubastaRepository : ISubastaRepository
{
    private readonly AppDbContext _context;

    public SubastaRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> ExisteUsuarioAsync(int usuarioId)
    {
        return await _context.Usuarios.AnyAsync(u => u.Id == usuarioId);
    }

    public async Task<bool> ExisteCategoriaAsync(int categoriaId)
    {
        return await _context.Categorias.AnyAsync(c => c.Id == categoriaId);
    }

    public void AgregarSubasta(Subasta subasta)
    {
        _context.Subastas.Add(subasta);
    }

    public void AgregarAuditoria(AuditoriaLog auditoria)
    {
        _context.AuditoriaLogs.Add(auditoria);
    }

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task<(List<Subasta> Items, int TotalCount)> ListarSubastasAsync(
        int pagina, int tamaño, EstadoSubasta? estado, int? categoriaId, string? busqueda,
        decimal? precioMin = null, decimal? precioMax = null, string? ordenamiento = null)
    {
        var query = _context.Subastas.AsNoTracking().AsQueryable();

        if (estado.HasValue)
        {
            query = query.Where(s => s.Estado == estado.Value);
        }

        if (categoriaId.HasValue)
        {
            query = query.Where(s => s.CategoriaId == categoriaId.Value);
        }

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var busquedaLower = busqueda.ToLower();
            query = query.Where(s => s.Titulo.ToLower().Contains(busquedaLower));
        }

        if (precioMin.HasValue)
        {
            query = query.Where(s => s.PrecioBase >= precioMin.Value);
        }

        if (precioMax.HasValue)
        {
            query = query.Where(s => s.PrecioBase <= precioMax.Value);
        }

        var totalCount = await query.CountAsync();

        query = ordenamiento?.ToLower() switch
        {
            "tiempo" => query.OrderBy(s => s.FechaFin),
            "mayor_puja" => query.OrderByDescending(s => s.Pujas.Any() ? s.Pujas.Max(p => p.Monto) : s.PrecioBase),
            _ => query.OrderByDescending(s => s.FechaFin)
        };

        var items = await query
            .Skip((pagina - 1) * tamaño)
            .Take(tamaño)
            .Include(s => s.Categoria)
            .Include(s => s.Pujas)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Subasta?> ObtenerSubastaAsync(int id)
    {
        return await _context.Subastas
            .Include(s => s.Vendedor)
            .Include(s => s.Categoria)
            .Include(s => s.Pujas)
                .ThenInclude(p => p.Comprador)
            .FirstOrDefaultAsync(s => s.Id == id);
    }
}

