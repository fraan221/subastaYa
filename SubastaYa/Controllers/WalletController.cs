using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SubastaYa.Exceptions;
using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Controllers;

[ApiController]
[Route("api/wallet")]
public class WalletController : ControllerBase
{
    private readonly IBilleteraService _billeteraService;

    public WalletController(IBilleteraService billeteraService)
    {
        _billeteraService = billeteraService;
    }

    [HttpGet("balance")]
    [ProducesResponseType(typeof(BalanceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerBalance([FromQuery] int? usuarioId = null)
    {
        var targetUserId = usuarioId;

        if (!targetUserId.HasValue)
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("usuario_id")?.Value;

            if (int.TryParse(idClaim, out var claimUserId))
            {
                targetUserId = claimUserId;
            }
        }

        if (!targetUserId.HasValue)
        {
            return BadRequest(new { mensaje = "El ID del usuario es requerido para consultar el balance." });
        }

        try
        {
            var balance = await _billeteraService.ObtenerBalancePorUsuarioIdAsync(targetUserId.Value);
            return Ok(balance);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }

    [HttpGet("transactions")]
    [ProducesResponseType(typeof(List<TransaccionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerTransacciones([FromQuery] int? usuarioId = null)
    {
        var targetUserId = usuarioId;

        if (!targetUserId.HasValue)
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("usuario_id")?.Value;

            if (int.TryParse(idClaim, out var claimUserId))
            {
                targetUserId = claimUserId;
            }
        }

        if (!targetUserId.HasValue)
        {
            return BadRequest(new { mensaje = "El ID del usuario es requerido para consultar las transacciones." });
        }

        try
        {
            var transacciones = await _billeteraService.ObtenerTransaccionesPorUsuarioIdAsync(targetUserId.Value);
            return Ok(transacciones);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }

    [HttpPost("deposit")]
    [ProducesResponseType(typeof(BalanceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Depositar([FromBody] DepositarRequest request)
    {
        try
        {
            var resultado = await _billeteraService.DepositarAsync(request);
            return Ok(resultado);
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
}
