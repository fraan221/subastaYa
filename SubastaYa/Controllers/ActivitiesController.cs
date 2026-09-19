using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Controllers;

[ApiController]
[Authorize]
[Route("api/activities")]
public class ActivitiesController : ControllerBase
{
    private readonly IActivitiesService _activitiesService;

    public ActivitiesController(IActivitiesService activitiesService)
    {
        _activitiesService = activitiesService;
    }

    [HttpGet("bids")]
    [ProducesResponseType(typeof(PaginacionResponse<MiPujaActividadResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ObtenerMisPujas(
        [FromQuery] int pagina = 1,
        [FromQuery(Name = "tamaño")] int tamaño = 10)
    {
        var usuarioId = ObtenerUsuarioId();

        if (usuarioId is null)
        {
            return Unauthorized(new
            {
                mensaje = "El token no contiene un identificador de usuario válido."
            });
        }

        var resultado = await _activitiesService
            .ObtenerMisPujasAsync(usuarioId.Value, pagina, tamaño);

        return Ok(resultado);
    }

    [HttpGet("listings")]
    [ProducesResponseType(typeof(PaginacionResponse<MiPublicacionActividadResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ObtenerMisPublicaciones(
        [FromQuery] int pagina = 1,
        [FromQuery(Name = "tamaño")] int tamaño = 10)
    {
        var usuarioId = ObtenerUsuarioId();

        if (usuarioId is null)
        {
            return Unauthorized(new
            {
                mensaje = "El token no contiene un identificador de usuario válido."
            });
        }

        var resultado = await _activitiesService
            .ObtenerMisPublicacionesAsync(usuarioId.Value, pagina, tamaño);

        return Ok(resultado);
    }

    private int? ObtenerUsuarioId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("usuario_id");

        return int.TryParse(claim, out var usuarioId)
            ? usuarioId
            : null;
    }
}
