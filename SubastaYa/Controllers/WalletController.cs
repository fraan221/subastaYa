using Microsoft.AspNetCore.Mvc;
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
    [ProducesResponseType(typeof(List<BalanceResponse>), 200)]
    public async Task<IActionResult> ObtenerBalances()
    {
        var resultado = await _billeteraService.ObtenerBalanceAsync();
        return Ok(resultado);
    }

    [HttpPost("deposit")]
    [ProducesResponseType(typeof(BalanceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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
    }
}
