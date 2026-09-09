using SubastaYa.Models.Entities;

namespace SubastaYa.Repositories.Interfaces;

public interface IPujaRepository
{
    Task<Subasta?> ObtenerSubastaConPujasAsync(int subastaId);
    Task<Billetera?> ObtenerBilleteraPorUsuarioAsync(int usuarioId);
    Task<bool> ExisteUsuarioAsync(int usuarioId);
    void AgregarPuja(Puja puja);
    void AgregarTransaccion(TransaccionLedger transaccion);
    Task GuardarCambiosAsync();
}
