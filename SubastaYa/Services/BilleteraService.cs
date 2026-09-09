using SubastaYa.Exceptions;
using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;
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

    public async Task<BalanceResponse> DepositarAsync(DepositarRequest request)
    {
        if (request.Monto <= 0)
        {
            throw new BusinessRuleException("El monto a depositar tiene que ser mayor a $0");
        }

        var billetera = await _billeteraRepository.ObtenerPorUsuarioIdAsync(request.UsuarioId);

        if (billetera == null)
        {
            throw new NotFoundException($"Billetera no encontrada, para usuario con ID {request.UsuarioId}");
        }

        billetera.SaldoTotal += request.Monto;
        billetera.SaldoDisponible += request.Monto;

        var transaccion = new TransaccionLedger
        {
            BilleteraId = billetera.Id,
            Tipo = TipoTransaccion.Deposito,
            Monto = request.Monto,
            Fecha = DateTime.UtcNow,
            SubastaId = null
        };
        
        _billeteraRepository.AgregarTransaccion(transaccion);
        await _billeteraRepository.GuardarCambiosAsync();

        return new BalanceResponse
        {
            UsuarioId = billetera.UsuarioId,
            UsuarioNombre = billetera.Usuario?.Nombre ?? string.Empty,
            SaldoTotal = billetera.SaldoTotal,
            SaldoRetenido = billetera.SaldoRetenido,
            SaldoDisponible = billetera.SaldoDisponible
        };
    }
}