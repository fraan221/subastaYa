namespace SubastaYa.Models.Entities;

public class Subasta
{
    public int id { get; set; }
    public int vendedor_id { get; set; }
    public int categoria_id { get; set; }
    public string titulo { get; set; } = string.Empty;
    public string descripcion { get; set; } = string.Empty;
    public string url_imagen { get; set; } = string.Empty;
    public decimal precio_base { get; set; }
    public decimal incremento_minimo { get; set; }
    public DateTime fecha_inicio { get; set; }
    public DateTime fecha_fin { get; set; }
    public string estado { get; set; } = string.Empty;
    public int version { get; set; }
}
