using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;

namespace SubastaYa.Services.Interfaces;

public interface ISubastaService
{
    Task<SubastaResponse> CrearSubastaAsync(CrearSubastaRequest request);
}