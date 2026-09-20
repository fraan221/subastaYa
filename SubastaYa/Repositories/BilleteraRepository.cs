using Microsoft.EntityFrameworkCore;
using SubastaYa.Data;
using SubastaYa.Exceptions;
using SubastaYa.Models.Entities;
using SubastaYa.Repositories.Interfaces;

namespace SubastaYa.Repositories;

public class BilleteraRepository : IBilleteraRepository
{
    private readonly AppDbContext _context;
    
    public BilleteraRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Billetera>> ObtenerTodosAsync()
    {
        return await _context.Billeteras.Include(b => b.Usuario).ToListAsync();
    }

    public async Task<Billetera?> ObtenerPorUsuarioIdAsync(int usuarioId)
    {
        return await _context.Billeteras
            .Include(b => b.Usuario)
            .FirstOrDefaultAsync(b => b.UsuarioId == usuarioId);
    }

    public async Task<List<TransaccionLedger>> ObtenerTransaccionesPorUsuarioIdAsync(int usuarioId)
    {
        return await _context.TransaccionLedgers
            .Include(t => t.Subasta)
            .Where(t => t.Billetera.UsuarioId == usuarioId)
            .OrderByDescending(t => t.Fecha)
            .ToListAsync();
    }

    public void AgregarTransaccion(TransaccionLedger transaccion)
    {
        _context.Add(transaccion);
    }

    public void AgregarAuditoria(AuditoriaLog auditoria)
    {
        _context.AuditoriaLogs.Add(auditoria);
    }

    public async Task GuardarCambiosAsync()
    {
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            _context.ChangeTracker.Clear();
            throw new ConcurrencyConflictException(
                "Conflicto de concurrencia: la billetera fue modificada al mismo tiempo por otra operacion. Intente de nuevo.");
        }
    }
}
