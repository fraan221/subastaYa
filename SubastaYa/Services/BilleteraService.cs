using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Repositories.Interfaces;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Services;

public class BilleteraService : IBilleteraService
{
    private readonly IBilleteraRepository _billeteraRepository;

    public BilleteraService(IBilleteraRepository billeteraRepository)
    {
        _billeteraRepository = billeteraRepository;
    }

    public async Task<List<BalanceResponse>> ObtenerBalanceAsync()
    {
        var billeteras = await _billeteraRepository.ObtenerTodosAsync();

        return billeteras.Select(b => new BalanceResponse
        {
            UsuarioId = b.UsuarioId,
            UsuarioNombre = b.Usuario.Nombre,
            SaldoTotal = b.SaldoTotal,
            SaldoRetenido = b.SaldoRetenido,
            SaldoDisponible = b.SaldoDisponible
        }).ToList();
    }
}