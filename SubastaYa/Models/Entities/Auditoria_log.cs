namespace SubastaYa.Models.Entities;

public class Auditoria_log
{
    public int id { get; set; }
    public string entidad { get; set; }
    public int entidad_id { get; set; }
    public string accion { get; set; }
    public int usuario_id { get; set; }
    public string detalle_json { get; set; }
    public DateTime Fecha{ get; set; }
}
