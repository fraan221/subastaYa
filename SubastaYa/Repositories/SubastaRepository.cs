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

    public async Task GuardarCambiosAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task<(List<Subasta> Items, int TotalCount)> ListarSubastasAsync(
        int pagina, int tamaño, EstadoSubasta? estado, int? categoriaId, string? busqueda)
    {
        var query = _context.Subastas.AsQueryable();

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

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.FechaFin)
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

