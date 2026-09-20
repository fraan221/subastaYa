using SubastaYa.Models.Entities;

namespace SubastaYa.Repositories.Interfaces;

public interface IPujaRepository
{
    Task<Subasta?> ObtenerSubastaConPujasAsync(int subastaId);
    Task<List<Puja>> ObtenerHistorialPorSubastaAsync(int subastaId, CancellationToken cancellationToken = default);
    Task<int> ContarExtensionesAntiSnipingAsync(int subastaId, CancellationToken cancellationToken = default);
    Task<Billetera?> ObtenerBilleteraPorUsuarioAsync(int usuarioId);
    Task<bool> ExisteUsuarioAsync(int usuarioId);
    void AgregarPuja(Puja puja);
    void AgregarTransaccion(TransaccionLedger transaccion);
    void AgregarAuditoria(AuditoriaLog auditoria);
    void LimpiarRastreador();
    Task GuardarCambiosAsync();
}
