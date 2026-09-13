using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SubastaYa.Data;
using SubastaYa.Exceptions;
using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var emailNormalizado = request.Email.Trim().ToLowerInvariant();
        var usuario = await _dbContext.Usuarios
            .FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado);

        if (usuario == null)
        {
            throw new BusinessRuleException("Credenciales inválidas.");
        }

        var passwordValido = BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash);
        if (!passwordValido)
        {
            throw new BusinessRuleException("Credenciales inválidas.");
        }

        var token = GenerarJwtToken(usuario.Id, usuario.Nombre, usuario.Email);

        return new LoginResponse
        {
            Token = token,
            UsuarioId = usuario.Id,
            Nombre = usuario.Nombre,
            Email = usuario.Email
        };
    }

    public async Task<LoginResponse> ObtenerUsuarioActualAsync(int usuarioId)
    {
        var usuario = await _dbContext.Usuarios
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        if (usuario == null)
        {
            throw new NotFoundException($"Usuario con ID {usuarioId} no encontrado.");
        }

        var token = GenerarJwtToken(usuario.Id, usuario.Nombre, usuario.Email);

        return new LoginResponse
        {
            Token = token,
            UsuarioId = usuario.Id,
            Nombre = usuario.Nombre,
            Email = usuario.Email
        };
    }

    private string GenerarJwtToken(int usuarioId, string nombre, string email)
    {
        var secretKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("La clave secreta de JWT no está configurada.");
        var issuer = _configuration["Jwt:Issuer"] ?? "SubastaYaBackend";
        var audience = _configuration["Jwt:Audience"] ?? "SubastaYaFrontend";
        var expireMinutes = int.TryParse(_configuration["Jwt:ExpireMinutes"], out var minutes) ? minutes : 1440;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuarioId.ToString()),
            new Claim(ClaimTypes.Name, nombre),
            new Claim(ClaimTypes.Email, email),
            new Claim("usuario_id", usuarioId.ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expireMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
