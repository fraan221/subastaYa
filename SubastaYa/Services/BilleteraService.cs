using System.Text.Json;
using SubastaYa.Exceptions;
using SubastaYa.Models.Dtos.Requests;
using SubastaYa.Models.Dtos.Responses;
using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;
using SubastaYa.Repositories.Interfaces;
using SubastaYa.Services.Interfaces;

namespace SubastaYa.Services;

/// <summary>
/// Proporciona la lógica de negocio para la gestión financiera de los usuarios,
/// administrando depósitos, consulta de saldos y trazabilidad contable mediante ledger y auditoría.
/// Implementa <see cref="IBilleteraService"/>.
/// </summary>
public class BilleteraService : IBilleteraService
{
    private readonly IBilleteraRepository _billeteraRepository;

    /// <summary>
    /// Inicializa una nueva instancia de <see cref="BilleteraService"/>.
    /// </summary>
    /// <param name="billeteraRepository">Repositorio para persistencia y consulta de billeteras y movimientos contables.</param>
    public BilleteraService(IBilleteraRepository billeteraRepository)
    {
        _billeteraRepository = billeteraRepository;
    }

    /// <summary>
    /// Obtiene el balance financiero de todas las billeteras registradas en el sistema.
    /// </summary>
    /// <returns>Lista de <see cref="BalanceResponse"/> con el desglose de saldos por usuario.</returns>
    public async Task<List<BalanceResponse>> ObtenerBalanceAsync()
    {
        var billeteras = await _billeteraRepository.ObtenerTodosAsync();

        return billeteras.Select(b => new BalanceResponse
        {
            UsuarioId = b.UsuarioId,
            UsuarioNombre = b.Usuario.Nombre,
            SaldoTotal = b.SaldoTotal,
            SaldoRetenido = b.SaldoRetenido,
            SaldoDisponible = b.SaldoDisponible
        }).ToList();
    }

    /// <summary>
    /// Procesa una acreditación de fondos (depósito) en la billetera de un usuario,
    /// registrando la transacción en el ledger y generando una traza de auditoría.
    /// </summary>
    /// <param name="request">Datos del depósito que incluyen el identificador del usuario y el monto a acreditar.</param>
    /// <returns>El estado actualizado del balance del usuario en un <see cref="BalanceResponse"/>.</returns>
    /// <exception cref="BusinessRuleException">
    /// Se lanza cuando el monto ingresado es menor o igual a cero.
    /// </exception>
    /// <exception cref="NotFoundException">
    /// Se lanza cuando no se encuentra la billetera asociada al usuario indicado.
    /// </exception>
    public async Task<BalanceResponse> DepositarAsync(DepositarRequest request)
    {
        if (request.Monto <= 0)
        {
            throw new BusinessRuleException("El monto a depositar tiene que ser mayor a $0");
        }

        var billetera = await _billeteraRepository.ObtenerPorUsuarioIdAsync(request.UsuarioId);

        if (billetera == null)
        {
            throw new NotFoundException($"Billetera no encontrada, para usuario con ID {request.UsuarioId}");
        }

        var saldoTotalPrevio = billetera.SaldoTotal;
        var saldoDisponiblePrevio = billetera.SaldoDisponible;

        billetera.SaldoTotal += request.Monto;
        billetera.SaldoDisponible += request.Monto;
        billetera.Version++;

        var transaccion = new TransaccionLedger
        {
            BilleteraId = billetera.Id,
            Tipo = TipoTransaccion.Deposito,
            Monto = request.Monto,
            Fecha = DateTime.UtcNow,
            SubastaId = null
        };
        _billeteraRepository.AgregarTransaccion(transaccion);

        var auditoria = new AuditoriaLog
        {
            Entidad = nameof(Billetera),
            EntidadId = billetera.Id,
            Accion = "AcreditacionManual",
            UsuarioId = billetera.UsuarioId,
            DetalleJson = JsonSerializer.Serialize(new
            {
                Monto = request.Monto,
                SaldoTotalPrevio = saldoTotalPrevio,
                SaldoTotalNuevo = billetera.SaldoTotal,
                SaldoDisponiblePrevio = saldoDisponiblePrevio,
                SaldoDisponibleNuevo = billetera.SaldoDisponible
            }),
            Fecha = DateTime.UtcNow
        };
        _billeteraRepository.AgregarAuditoria(auditoria);

        await _billeteraRepository.GuardarCambiosAsync();

        return new BalanceResponse
        {
            UsuarioId = billetera.UsuarioId,
            UsuarioNombre = billetera.Usuario?.Nombre ?? string.Empty,
            SaldoTotal = billetera.SaldoTotal,
            SaldoRetenido = billetera.SaldoRetenido,
            SaldoDisponible = billetera.SaldoDisponible
        };
    }

    /// <summary>
    /// Consulta el saldo total, disponible y retenido de la billetera de un usuario específico.
    /// </summary>
    /// <param name="usuarioId">Identificador único del usuario titular.</param>
    /// <returns>Un <see cref="BalanceResponse"/> con el desglose financiero del usuario.</returns>
    /// <exception cref="NotFoundException">
    /// Se lanza cuando no existe una billetera vinculada al <paramref name="usuarioId"/>.
    /// </exception>
    public async Task<BalanceResponse> ObtenerBalancePorUsuarioIdAsync(int usuarioId)
    {
        var billetera = await _billeteraRepository.ObtenerPorUsuarioIdAsync(usuarioId);
        if (billetera == null)
        {
            throw new NotFoundException($"Billetera no encontrada para el usuario con ID {usuarioId}");
        }

        return new BalanceResponse
        {
            UsuarioId = billetera.UsuarioId,
            UsuarioNombre = billetera.Usuario?.Nombre ?? string.Empty,
            SaldoTotal = billetera.SaldoTotal,
            SaldoRetenido = billetera.SaldoRetenido,
            SaldoDisponible = billetera.SaldoDisponible
        };
    }

    /// <summary>
    /// Obtiene el historial cronológico de transacciones contables registradas en la billetera de un usuario.
    /// </summary>
    /// <param name="usuarioId">Identificador único del usuario titular.</param>
    /// <returns>Lista de <see cref="TransaccionResponse"/> con los movimientos registrados.</returns>
    public async Task<List<TransaccionResponse>> ObtenerTransaccionesPorUsuarioIdAsync(int usuarioId)
    {
        var transacciones = await _billeteraRepository.ObtenerTransaccionesPorUsuarioIdAsync(usuarioId);

        return transacciones.Select(t => new TransaccionResponse
        {
            Id = t.Id,
            BilleteraId = t.BilleteraId,
            Tipo = t.Tipo.ToString(),
            Monto = t.Monto,
            Fecha = t.Fecha,
            SubastaId = t.SubastaId,
            SubastaTitulo = t.Subasta?.Titulo
        }).ToList();
    }
}
