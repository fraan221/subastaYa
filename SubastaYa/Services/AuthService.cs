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

/// <summary>
/// Servicio responsable de la autenticación de usuarios, verificación de credenciales
/// y generación de tokens de acceso JWT.
/// Implementa <see cref="IAuthService"/>.
/// </summary>
public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;

    /// <summary>
    /// Inicializa una nueva instancia de <see cref="AuthService"/>.
    /// </summary>
    /// <param name="dbContext">Contexto de base de datos para consultar usuarios.</param>
    /// <param name="configuration">Configuración de la aplicación para leer parámetros de JWT.</param>
    public AuthService(AppDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    /// <summary>
    /// Autentica a un usuario mediante sus credenciales (correo electrónico y contraseña).
    /// </summary>
    /// <param name="request">Datos de inicio de sesión que contienen el correo y la contraseña en texto plano.</param>
    /// <returns>
    /// Un <see cref="LoginResponse"/> con el token JWT generado y los datos de perfil del usuario.
    /// </returns>
    /// <exception cref="BusinessRuleException">
    /// Se lanza cuando el correo no está registrado o la contraseña no coincide con el hash almacenado.
    /// </exception>
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

    /// <summary>
    /// Obtiene los datos del usuario autenticado y genera un nuevo token JWT actualizado.
    /// </summary>
    /// <param name="usuarioId">Identificador único del usuario a consultar.</param>
    /// <returns>
    /// Un <see cref="LoginResponse"/> con el token JWT renovado y la información del usuario.
    /// </returns>
    /// <exception cref="NotFoundException">
    /// Se lanza cuando no existe ningún usuario con el <paramref name="usuarioId"/> especificado.
    /// </exception>
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

    /// <summary>
    /// Construye y firma un token JWT con los claims identificatorios del usuario.
    /// </summary>
    /// <param name="usuarioId">Identificador único del usuario.</param>
    /// <param name="nombre">Nombre para mostrar del usuario.</param>
    /// <param name="email">Correo electrónico del usuario.</param>
    /// <returns>Token JWT firmado en formato string compacto.</returns>
    /// <exception cref="InvalidOperationException">
    /// Se lanza si la clave de firma <c>Jwt:Key</c> no está configurada.
    /// </exception>
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
