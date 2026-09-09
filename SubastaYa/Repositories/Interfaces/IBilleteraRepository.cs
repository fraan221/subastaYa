using SubastaYa.Models.Entities;

namespace SubastaYa.Repositories.Interfaces;

public interface IBilleteraRepository
{
    Task<List<Billetera>> ObtenerTodosAsync();
    Task<Billetera?> ObtenerPorUsuarioIdAsync(int usuarioId);
    void AgregarTransaccion(TransaccionLedger transaccion);
    Task GuardarCambiosAsync();
}