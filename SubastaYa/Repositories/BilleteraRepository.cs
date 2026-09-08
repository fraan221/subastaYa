using Microsoft.EntityFrameworkCore;
using SubastaYa.Data;
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
}