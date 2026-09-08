using SubastaYa.Models.Dtos.Responses;

namespace SubastaYa.Services.Interfaces;

public interface IBilleteraService
{
    Task<List<BalanceResponse>> ObtenerBalanceAsync();
}