using SubastaYa.Models.Entities;

namespace SubastaYa.Repositories.Interfaces;

public interface IBilleteraRepository
{
    Task<List<Billetera>> ObtenerTodosAsync();
    Task<Billetera?> ObtenerPorUsuarioIdAsync(int usuarioId);
    Task<List<TransaccionLedger>> ObtenerTransaccionesPorUsuarioIdAsync(int usuarioId);
    void AgregarTransaccion(TransaccionLedger transaccion);
    void AgregarAuditoria(AuditoriaLog auditoria);
    Task GuardarCambiosAsync();
}