using Microsoft.EntityFrameworkCore;
using SubastaYa.Models.Entities;
using SubastaYa.Models.Enums;

namespace SubastaYa.Data;

public static class DbSeeder
{
    public static async Task SeederAsync(AppDbContext  dbContext)
    {
        if (await dbContext.Usuarios.AnyAsync())
        {
            return;
        }
        
        var pswdHash = BCrypt.Net.BCrypt.HashPassword("password12345");
        
        // Creacion usuarios
        var vendedor = new Usuario()
        {
            Nombre = "Vendedor",
            Email = "vendedor@test.com",
            PasswordHash = pswdHash,
            FechaRegistro = DateTime.UtcNow,
        };

        var comprador1 = new Usuario()
        {
            Nombre = "Comprador1",
            Email = "comprador1@test.com",
            PasswordHash = pswdHash,
            FechaRegistro = DateTime.UtcNow,
        };

        var comprador2 = new Usuario()
        {
            Nombre = "Comprador2",
            Email = "comprador2@test.com",
            PasswordHash = pswdHash,
            FechaRegistro = DateTime.UtcNow,
        };

        var sinFondos = new Usuario()
        {
            Nombre = "Sin Fondos",
            Email = "sinfondos@test.com",
            PasswordHash = pswdHash,
            FechaRegistro = DateTime.UtcNow,
        };

        dbContext.Usuarios.AddRange(vendedor, comprador1, comprador2, sinFondos);
        await dbContext.SaveChangesAsync();
        
        // Creacion billeteras
        var billeteraVendedor = new Billetera()
        {
            UsuarioId = vendedor.Id,
            SaldoTotal = 0,
            SaldoRetenido = 0,
            SaldoDisponible = 0,
            Version = 0
        };

        var billeteraComprador1 = new Billetera()
        {
            UsuarioId = comprador1.Id,
            SaldoTotal = 150000,
            SaldoRetenido = 45000,
            SaldoDisponible = 105000,
            Version = 0
        };

        var billeteraComprador2 = new Billetera()
        {
            UsuarioId = comprador2.Id,
            SaldoTotal = 200000,
            SaldoRetenido = 55000,
            SaldoDisponible = 145000,
            Version = 0
        };

        var billeteraSinFondos = new Billetera()
        {
            UsuarioId = sinFondos.Id,
            SaldoTotal = 500,
            SaldoRetenido = 0,
            SaldoDisponible = 500,
            Version = 0
        };
        
        dbContext.Billeteras.AddRange(billeteraVendedor, billeteraComprador1,  billeteraComprador2, billeteraSinFondos);
        await dbContext.SaveChangesAsync();

        // Creacion categorias
        var tecnologia = new Categoria()
        {
            Nombre = "Tecnologia",
            UrlIcono = "icon-tech.svg"
        };

        var coleccionables = new Categoria()
        {
            Nombre = "Coleccionables",
            UrlIcono = "icon-collection.svg"
        };

        var indumentaria = new Categoria()
        {
            Nombre = "Indumentaria",
            UrlIcono = "icon-clothing.svg"
        };

        var vehiculos = new Categoria()
        {
            Nombre = "Vehiculos",
            UrlIcono = "icon-vehicles.svg"
        };
        
        dbContext.Categorias.AddRange(tecnologia, coleccionables, indumentaria, vehiculos);
        await dbContext.SaveChangesAsync();

        // Creacion subastas
        var ahora = DateTime.UtcNow;
        
        var activaEstandar = new Subasta()
        {
            VendedorId = vendedor.Id,
            CategoriaId = tecnologia.Id,
            Titulo = "Notebook Gamer Usada",
            Descripcion = "Notebook en buen estado, poco uso.",
            UrlImagen = "placeholder.jpg",
            PrecioBase = 30000,
            IncrementoMinimo = 5000,
            FechaInicio = ahora.AddHours(-1),
            FechaFin = ahora.AddMinutes(25),
            Version = 0,
            Estado = EstadoSubasta.Activa
        };

        var activaCritica = new Subasta()
        {
            VendedorId = vendedor.Id,
            CategoriaId = coleccionables.Id,
            Titulo = "Figura de coleccion edicion limitada",
            Descripcion = "Pieza rara",
            UrlImagen = "placeholder.jpg",
            PrecioBase = 10000,
            IncrementoMinimo = 1000,
            FechaInicio = ahora.AddHours(-30),
            FechaFin = ahora.AddSeconds(90),
            Version = 0,
            Estado = EstadoSubasta.Activa
        };

        var proxima = new Subasta()
        {
            VendedorId = vendedor.Id,
            CategoriaId = indumentaria.Id,
            Titulo = "Campera de cuero",
            Descripcion = "Talle M - Nueva",
            UrlImagen = "placeholder.jpg",
            PrecioBase = 15000,
            IncrementoMinimo = 2000,
            FechaInicio = ahora.AddHours(24),
            FechaFin = ahora.AddHours(48),
            Version = 0,
            Estado = EstadoSubasta.Programada
        };

        var vencidaConGanador = new Subasta()
        {
            VendedorId = vendedor.Id,
            CategoriaId = vehiculos.Id,
            Titulo = "Bicicleta rodado 29",
            Descripcion = "Color negro, ruedas nuevas",
            UrlImagen = "placeholder.jpg",
            PrecioBase = 50000,
            IncrementoMinimo = 5000,
            FechaInicio = ahora.AddHours(-3),
            FechaFin = ahora.AddMinutes(-10),
            Version = 0,
            Estado = EstadoSubasta.Activa
        };

        var vencidaDesierta = new Subasta()
        {
            VendedorId = vendedor.Id,
            CategoriaId = tecnologia.Id,
            Titulo = "Teclado mecanico",
            Descripcion = "Sin uso, removedor de switches, teclas extra",
            UrlImagen = "placeholder.jpg",
            PrecioBase = 20000,
            IncrementoMinimo = 1000,
            FechaInicio = ahora.AddHours(-3),
            FechaFin = ahora.AddMinutes(-5),
            Version = 0,
            Estado = EstadoSubasta.Activa
        };
        
        dbContext.Subastas.AddRange(activaEstandar, activaCritica, proxima, vencidaConGanador, vencidaDesierta);
        await dbContext.SaveChangesAsync();

        // Creacion puja
        var puja1 = new Puja()
        {
            SubastaId = activaEstandar.Id,
            CompradorId = comprador1.Id,
            Monto = 45000,
            FechaPuja = DateTime.UtcNow.AddMinutes(-20)
        };

        var puja2 = new Puja()
        {
            SubastaId = activaEstandar.Id,
            CompradorId = comprador2.Id,
            Monto = 35000,
            FechaPuja = DateTime.UtcNow.AddMinutes(-30)
        };

        var pujaGanadora = new Puja()
        {
            SubastaId = vencidaConGanador.Id,
            CompradorId = comprador2.Id,
            Monto = 55000,
            FechaPuja = DateTime.UtcNow.AddHours(-1),
        };
        
        dbContext.Pujas.AddRange(puja1, puja2, pujaGanadora);
        await dbContext.SaveChangesAsync();
        
        // Creacion ledger

        var depositoComprador1 = new TransaccionLedger()
        {
            BilleteraId = billeteraComprador1.Id,
            Tipo = TipoTransaccion.Deposito,
            Monto = 150000,
            Fecha = DateTime.UtcNow.AddDays(-5),
            SubastaId = null
        };

        var depositoComprador2 = new TransaccionLedger()
        {
            BilleteraId = billeteraComprador2.Id,
            Tipo = TipoTransaccion.Deposito,
            Monto = 200000,
            Fecha = DateTime.UtcNow.AddDays(-10),
            SubastaId = null
        };

        var depositoSinFondos = new TransaccionLedger()
        {
            BilleteraId = billeteraSinFondos.Id,
            Tipo = TipoTransaccion.Deposito,
            Monto = 500,
            Fecha = DateTime.UtcNow.AddDays(-20),
            SubastaId = null
        };
        
        var retencionSaldoComprador1 = new TransaccionLedger()
        {
            BilleteraId = billeteraComprador1.Id,
            Tipo = TipoTransaccion.Retencion,
            Monto = 45000,
            Fecha = DateTime.UtcNow.AddMinutes(-20),
            SubastaId = activaEstandar.Id
        };

        var liberacionSaldoComprador2 = new TransaccionLedger()
        {
            BilleteraId = billeteraComprador2.Id,
            Tipo = TipoTransaccion.Liberacion,
            Monto = 35000,
            Fecha = DateTime.UtcNow.AddMinutes(-20),
            SubastaId = activaEstandar.Id
        };

        var retencionSaldoComprador2 = new TransaccionLedger()
        {
            BilleteraId = billeteraComprador2.Id,
            Tipo = TipoTransaccion.Retencion,
            Monto = 55000,
            Fecha = DateTime.UtcNow.AddHours(-1),
            SubastaId = vencidaConGanador.Id
        };
        
        dbContext.TransaccionLedgers.AddRange(depositoComprador1, depositoComprador2, depositoSinFondos, retencionSaldoComprador1, liberacionSaldoComprador2, retencionSaldoComprador2);
        await dbContext.SaveChangesAsync();
    }
}
