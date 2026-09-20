using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoriaService _categoriaService;

    public CategoriesController(ICategoriaService categoriaService)
    {
        _categoriaService = categoriaService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(
        typeof(IReadOnlyList<CategoriaResponse>),
        StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CategoriaResponse>>> Listar(
        CancellationToken cancellationToken)
    {
        var categorias = await _categoriaService.ListarAsync(
            cancellationToken);

        return Ok(categorias);
    }
}
