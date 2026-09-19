using Microsoft.EntityFrameworkCore;
using SubastaYa.Data;
using SubastaYa.Models.Entities;
using SubastaYa.Repositories.Interfaces;

namespace SubastaYa.Repositories;

public class ActivitiesRepository : IActivitiesRepository
{
    private readonly AppDbContext _context;

    public ActivitiesRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(List<Subasta> Items, int TotalCount)> ObtenerSubastasConMisPujasAsync(
        int usuarioId,
        int pagina,
        int tamaño)
    {
        var query = _context.Subastas
            .AsNoTracking()
            .Where(subasta => subasta.Pujas.Any(puja => puja.CompradorId == usuarioId));

        var totalCount = await query.CountAsync();

        var items = await query
            .Include(subasta => subasta.Categoria)
            .Include(subasta => subasta.Pujas)
                .ThenInclude(puja => puja.Comprador)
            .OrderByDescending(subasta => subasta.FechaFin)
            .Skip((pagina - 1) * tamaño)
            .Take(tamaño)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<(List<Subasta> Items, int TotalCount)> ObtenerMisPublicacionesAsync(
        int usuarioId,
        int pagina,
        int tamaño)
    {
        var query = _context.Subastas
            .AsNoTracking()
            .Where(subasta => subasta.VendedorId == usuarioId);

        var totalCount = await query.CountAsync();

        var items = await query
            .Include(subasta => subasta.Categoria)
            .Include(subasta => subasta.Pujas)
                .ThenInclude(puja => puja.Comprador)
            .OrderByDescending(subasta => subasta.FechaFin)
            .Skip((pagina - 1) * tamaño)
            .Take(tamaño)
            .ToListAsync();

        return (items, totalCount);
    }
}
