using Microsoft.EntityFrameworkCore;
using SubastaYa.Data;
using SubastaYa.Models.Entities;
using SubastaYa.Repositories.Interfaces;

namespace SubastaYa.Repositories;

public class CategoriaRepository : ICategoriaRepository
{
    private readonly AppDbContext _context;

    public CategoriaRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Categoria>> ListarAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.Categorias
            .AsNoTracking()
            .OrderBy(categoria => categoria.Nombre)
            .ToListAsync(cancellationToken);
    }
}
