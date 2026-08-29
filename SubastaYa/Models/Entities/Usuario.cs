namespace SubastaYa.Models.Entities;

public class Usuario
{
    int id  {get; set;}
    string name {get; set;}
    string email {get; set;}
    string password_hash {get; set;}
    DateTime fecha_registro {get; set;}
}