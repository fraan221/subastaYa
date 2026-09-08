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
    private readonly ISubastaService _subastaService;

    public AuctionsController(ISubastaService subastaService)
    {
        _subastaService = subastaService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PaginacionResponse<SubastaListadoResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListarSubastas(
        [FromQuery] int pagina = 1,
        [FromQuery] int tamaño = 10,
        [FromQuery] string? estado = null,
        [FromQuery] int? categoriaId = null,
        [FromQuery] string? busqueda = null)
    {
        EstadoSubasta? estadoEnum = null;

        if (!string.IsNullOrWhiteSpace(estado))
        {
            if (!Enum.TryParse<EstadoSubasta>(estado, ignoreCase: true, out var parsed))
            {
                return BadRequest(new { mensaje = $"Estado '{estado}' no es válido. Valores permitidos: {string.Join(", ", Enum.GetNames<EstadoSubasta>())}." });
            }
            estadoEnum = parsed;
        }

        var resultado = await _subastaService.ListarSubastasAsync(pagina, tamaño, estadoEnum, categoriaId, busqueda);
        return Ok(resultado);
    }

    [HttpPost]
    [ProducesResponseType(typeof(SubastaResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CrearSubasta([FromBody] CrearSubastaRequest request)
    {
        try
        {
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
}
