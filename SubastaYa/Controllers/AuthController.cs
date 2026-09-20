using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Exceptions;
using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpGet("ping")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Ping()
    {
        return Ok(new
        {
            status = "online",
            message = "Backend SubastaYa conectado exitosamente.",
            timestamp = DateTime.UtcNow
        });
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var resultado = await _authService.LoginAsync(request);
            return Ok(resultado);
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerUsuarioActual()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("usuario_id")?.Value;

        if (string.IsNullOrEmpty(idClaim) || !int.TryParse(idClaim, out var usuarioId))
        {
            return Unauthorized(new { mensaje = "Token inválido o sin identificador de usuario." });
        }

        try
        {
            var resultado = await _authService.ObtenerUsuarioActualAsync(usuarioId);
            return Ok(resultado);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }
}
