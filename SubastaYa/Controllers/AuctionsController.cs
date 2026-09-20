using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Exceptions;
using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Models.Enums;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Controllers;

[ApiController]
[Route("api/auctions")]
public class AuctionsController : ControllerBase
{
    private readonly IPujaService _pujaService;
    private readonly ISubastaService _subastaService;

    public AuctionsController(IPujaService pujaService, ISubastaService subastaService)
    {
        _pujaService = pujaService;
        _subastaService = subastaService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PaginacionResponse<SubastaListadoResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListarSubastas(
        [FromQuery] int pagina = 1,
        [FromQuery] int tamaño = 10,
        [FromQuery] string? estado = null,
        [FromQuery] int? categoriaId = null,
        [FromQuery] string? busqueda = null,
        [FromQuery] decimal? precioMin = null,
        [FromQuery] decimal? precioMax = null,
        [FromQuery] string? ordenamiento = null)
    {
        if (precioMin.HasValue && precioMin.Value < 0)
        {
            return BadRequest(new { mensaje = "El precio mínimo no puede ser negativo." });
        }

        if (precioMax.HasValue && precioMax.Value < 0)
        {
            return BadRequest(new { mensaje = "El precio máximo no puede ser negativo." });
        }

        if (precioMin.HasValue && precioMax.HasValue && precioMin.Value > precioMax.Value)
        {
            return BadRequest(new { mensaje = "El precio mínimo no puede ser mayor al precio máximo." });
        }

        EstadoSubasta? estadoEnum = null;

        if (!string.IsNullOrWhiteSpace(estado))
        {
            if (!Enum.TryParse<EstadoSubasta>(estado, ignoreCase: true, out var parsed))
            {
                return BadRequest(new { mensaje = $"Estado '{estado}' no es válido. Valores permitidos: {string.Join(", ", Enum.GetNames<EstadoSubasta>())}." });
            }
            estadoEnum = parsed;
        }

        var resultado = await _subastaService.ListarSubastasAsync(
            pagina, tamaño, estadoEnum, categoriaId, busqueda, precioMin, precioMax, ordenamiento);
        return Ok(resultado);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SubastaDetalleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerSubasta(int id)
    {
        try
        {
            var resultado = await _subastaService.ObtenerSubastaAsync(id);
            return Ok(resultado);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(SubastaResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CrearSubasta([FromBody] CrearSubastaRequest request)
    {
        try
        {
            var usuarioId = ObtenerUsuarioId();
            if (usuarioId is null)
            {
                return Unauthorized(new { mensaje = "El token no contiene un identificador de usuario válido." });
            }

            request.VendedorId = usuarioId.Value;
            var resultado = await _subastaService.CrearSubastaAsync(request);
            return StatusCode(StatusCodes.Status201Created, resultado);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPost("{id}/bids")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PujaResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CrearPuja(int id, [FromBody] CrearPujaRequest request)
    {
        try
        {
            var usuarioId = ObtenerUsuarioId();
            if (usuarioId.HasValue)
            {
                request.CompradorId = usuarioId.Value;
            }
            else if (request.CompradorId <= 0)
            {
                return Unauthorized(new { mensaje = "Se requiere autenticación o un identificador de comprador válido." });
            }

            var resultado = await _pujaService.RealizarPujaAsync(id, request);
            return StatusCode(StatusCodes.Status201Created, resultado);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
        catch (ConcurrencyConflictException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    [HttpGet("{id:int}/bids")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<PujaHistorialResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerHistorialPujas(int id, CancellationToken cancellationToken)
    {
        try
        {
            var resultado = await _pujaService.ObtenerHistorialPujasAsync(id, cancellationToken);
            return Ok(resultado);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
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
