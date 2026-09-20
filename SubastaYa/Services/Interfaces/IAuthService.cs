using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;

namespace SubastaYa.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> ObtenerUsuarioActualAsync(int usuarioId);
}
