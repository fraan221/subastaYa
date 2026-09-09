using Microsoft.EntityFrameworkCore;
using SubastaYa.Data;
using SubastaYa.Repositories;
using SubastaYa.Repositories.Interfaces;
using SubastaYa.Services;
using SubastaYa.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IPujaRepository, PujaRepository>();
builder.Services.AddScoped<IPujaService, PujaService>();
builder.Services.AddScoped<ISubastaRepository, SubastaRepository>();
builder.Services.AddScoped<ISubastaService, SubastaService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

using var scope = app.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
db.Database.Migrate();
await DbSeeder.SeederAsync(db);

app.MapControllers();
app.Run();