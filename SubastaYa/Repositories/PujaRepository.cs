using Microsoft.EntityFrameworkCore;
using SubastaYa.Data;
using SubastaYa.Exceptions;
using SubastaYa.Models.Entities;
using SubastaYa.Repositories.Interfaces;

namespace SubastaYa.Repositories;

public class PujaRepository : IPujaRepository
{
    private readonly AppDbContext _context;

    public PujaRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Subasta?> ObtenerSubastaConPujasAsync(int subastaId)
    {
        return await _context.Subastas
            .Include(s => s.Pujas)
            .FirstOrDefaultAsync(s => s.Id == subastaId);
    }

    public async Task<Billetera?> ObtenerBilleteraPorUsuarioAsync(int usuarioId)
    {
        return await _context.Billeteras
            .FirstOrDefaultAsync(b => b.UsuarioId == usuarioId);
    }

    public async Task<bool> ExisteUsuarioAsync(int usuarioId)
    {
        return await _context.Usuarios.AnyAsync(u => u.Id == usuarioId);
    }

    public void AgregarPuja(Puja puja)
    {
        _context.Pujas.Add(puja);
    }

    public void AgregarTransaccion(TransaccionLedger transaccion)
    {
        _context.TransaccionLedgers.Add(transaccion);
    }

    public async Task GuardarCambiosAsync()
    {
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConcurrencyConflictException(
                "Conflicto de concurrencia: otro usuario modificó los datos simultáneamente. Por favor, intentá nuevamente.");
        }
    }
}
