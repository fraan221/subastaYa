using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;

namespace SubastaYa.Services.Interfaces;

public interface IPujaService
{
    Task<PujaResponse> RealizarPujaAsync(int subastaId, CrearPujaRequest request);
}
