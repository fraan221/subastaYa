using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Models.Entities;

namespace SubastaYa.Services.Interfaces;

public interface IBilleteraService
{
    Task<List<BalanceResponse>> ObtenerBalanceAsync();
    Task<BalanceResponse> ObtenerBalancePorUsuarioIdAsync(int usuarioId);
    Task<BalanceResponse> DepositarAsync(DepositarRequest request);
    Task<List<TransaccionResponse>> ObtenerTransaccionesPorUsuarioIdAsync(int usuarioId);
}