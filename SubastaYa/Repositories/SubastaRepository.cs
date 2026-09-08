using Microsoft.EntityFrameworkCore;
using SubastaYa.Data;
using SubastaYa.Models.Entities;
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
}