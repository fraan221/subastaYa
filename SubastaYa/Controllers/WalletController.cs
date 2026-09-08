using Microsoft.AspNetCore.Mvc;
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
}
