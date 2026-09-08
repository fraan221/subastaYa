using SubastaYa.Models.Entities;

namespace SubastaYa.Repositories.Interfaces;

public interface IBilleteraRepository
{
    Task<List<Billetera>> ObtenerTodosAsync();    
}