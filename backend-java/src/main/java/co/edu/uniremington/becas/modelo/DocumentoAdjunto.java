package co.edu.uniremington.becas.modelo;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entidad ORM Clave #4 mapeada a la tabla 'documentos_adjuntos' en MySQL.
 */
@Entity
@Table(name = "documentos_adjuntos")
public class DocumentoAdjunto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_documento")
    private Integer idDocumento;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_solicitud", nullable = false)
    private SolicitudBeca solicitud;

    @Column(name = "tipo_documento", nullable = false, length = 150)
    private String tipoDocumento;

    @Column(name = "nombre_archivo", nullable = false, length = 200)
    private String nombreArchivo;

    @Column(name = "es_obligatorio", nullable = false)
    private Boolean esObligatorio = true;

    @Column(name = "adjuntado", nullable = false)
    private Boolean adjuntado = false;

    @Column(name = "estado_validacion", nullable = false)
    private Boolean estadoValidacion = false;

    @Column(name = "fecha_carga", nullable = false)
    private LocalDateTime fechaCarga = LocalDateTime.now();

    public DocumentoAdjunto() {
    }

    public DocumentoAdjunto(SolicitudBeca solicitud, String tipoDocumento, String nombreArchivo, Boolean esObligatorio, Boolean adjuntado) {
        this.solicitud = solicitud;
        this.tipoDocumento = tipoDocumento;
        this.nombreArchivo = nombreArchivo;
        this.esObligatorio = esObligatorio;
        this.adjuntado = adjuntado;
    }

    public Integer getIdDocumento() { return idDocumento; }
    public void setIdDocumento(Integer idDocumento) { this.idDocumento = idDocumento; }
    public SolicitudBeca getSolicitud() { return solicitud; }
    public void setSolicitud(SolicitudBeca solicitud) { this.solicitud = solicitud; }
    public String getTipoDocumento() { return tipoDocumento; }
    public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }
    public String getNombreArchivo() { return nombreArchivo; }
    public void setNombreArchivo(String nombreArchivo) { this.nombreArchivo = nombreArchivo; }
    public Boolean getEsObligatorio() { return esObligatorio; }
    public void setEsObligatorio(Boolean esObligatorio) { this.esObligatorio = esObligatorio; }
    public Boolean getAdjuntado() { return adjuntado; }
    public void setAdjuntado(Boolean adjuntado) { this.adjuntado = adjuntado; }
    public Boolean getEstadoValidacion() { return estadoValidacion; }
    public void setEstadoValidacion(Boolean estadoValidacion) { this.estadoValidacion = estadoValidacion; }

    @Override
    public String toString() {
        return "DocumentoAdjunto{" +
                "idDocumento=" + idDocumento +
                ", tipo='" + tipoDocumento + '\'' +
                ", archivo='" + nombreArchivo + '\'' +
                ", validado=" + estadoValidacion +
                '}';
    }
}

