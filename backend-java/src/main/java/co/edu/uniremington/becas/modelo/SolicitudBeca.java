package co.edu.uniremington.becas.modelo;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad ORM Clave #3 mapeada a la tabla 'solicitudes_beca' en MySQL.
 * Relacionada con Estudiante (@ManyToOne) y con Subsidios, Documentos y Auditoría (@OneToMany).
 */
@Entity
@Table(name = "solicitudes_beca")
public class SolicitudBeca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_solicitud")
    private Integer idSolicitud;

    @Column(name = "codigo_radicado", nullable = false, unique = true, length = 20)
    private String codigoRadicado;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_estudiante", nullable = false)
    private Estudiante estudiante;

    @Column(name = "semestre_convocatoria", nullable = false, length = 15)
    private String semestreConvocatoria = "2026-II";

    @Column(name = "fecha_radicacion", nullable = false)
    private LocalDate fechaRadicacion = LocalDate.now();

    @Column(name = "ingresos_mensuales_cop", nullable = false, precision = 12, scale = 2)
    private BigDecimal ingresosMensualesCop;

    @Column(name = "numero_dependientes", nullable = false)
    private Integer numeroDependientes;

    @Column(name = "estrato_socioeconomico", nullable = false)
    private Integer estratoSocioeconomico;

    @Column(name = "distancia_campus_km", nullable = false, precision = 6, scale = 2)
    private BigDecimal distanciaCampusKm;

    @Column(name = "puntaje_vulnerabilidad", nullable = false)
    private Integer puntajeVulnerabilidad;

    @Column(name = "etapa_actual", nullable = false, length = 40)
    private String etapaActual = "VALIDACION_DOCUMENTAL";

    @Column(name = "estado_solicitud", nullable = false, length = 25)
    private String estadoSolicitud = "EN_REVISION";

    @Column(name = "autorizacion_habeas_data", nullable = false)
    private Boolean autorizacionHabeasData = true;

    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TipoSubsidioSolicitud> subsidios = new ArrayList<>();

    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentoAdjunto> documentos = new ArrayList<>();

    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RegistroAuditoria> historialAuditoria = new ArrayList<>();

    public SolicitudBeca() {
    }

    public SolicitudBeca(String codigoRadicado, Estudiante estudiante, BigDecimal ingresosMensualesCop,
                         Integer numeroDependientes, Integer estratoSocioeconomico,
                         BigDecimal distanciaCampusKm, Integer puntajeVulnerabilidad) {
        this.codigoRadicado = codigoRadicado;
        this.estudiante = estudiante;
        this.ingresosMensualesCop = ingresosMensualesCop;
        this.numeroDependientes = numeroDependientes;
        this.estratoSocioeconomico = estratoSocioeconomico;
        this.distanciaCampusKm = distanciaCampusKm;
        this.puntajeVulnerabilidad = puntajeVulnerabilidad;
    }

    public Integer getIdSolicitud() { return idSolicitud; }
    public void setIdSolicitud(Integer idSolicitud) { this.idSolicitud = idSolicitud; }
    public String getCodigoRadicado() { return codigoRadicado; }
    public void setCodigoRadicado(String codigoRadicado) { this.codigoRadicado = codigoRadicado; }
    public Estudiante getEstudiante() { return estudiante; }
    public void setEstudiante(Estudiante estudiante) { this.estudiante = estudiante; }
    public String getSemestreConvocatoria() { return semestreConvocatoria; }
    public void setSemestreConvocatoria(String semestreConvocatoria) { this.semestreConvocatoria = semestreConvocatoria; }
    public LocalDate getFechaRadicacion() { return fechaRadicacion; }
    public void setFechaRadicacion(LocalDate fechaRadicacion) { this.fechaRadicacion = fechaRadicacion; }
    public BigDecimal getIngresosMensualesCop() { return ingresosMensualesCop; }
    public void setIngresosMensualesCop(BigDecimal ingresosMensualesCop) { this.ingresosMensualesCop = ingresosMensualesCop; }
    public Integer getNumeroDependientes() { return numeroDependientes; }
    public void setNumeroDependientes(Integer numeroDependientes) { this.numeroDependientes = numeroDependientes; }
    public Integer getEstratoSocioeconomico() { return estratoSocioeconomico; }
    public void setEstratoSocioeconomico(Integer estratoSocioeconomico) { this.estratoSocioeconomico = estratoSocioeconomico; }
    public BigDecimal getDistanciaCampusKm() { return distanciaCampusKm; }
    public void setDistanciaCampusKm(BigDecimal distanciaCampusKm) { this.distanciaCampusKm = distanciaCampusKm; }
    public Integer getPuntajeVulnerabilidad() { return puntajeVulnerabilidad; }
    public void setPuntajeVulnerabilidad(Integer puntajeVulnerabilidad) { this.puntajeVulnerabilidad = puntajeVulnerabilidad; }
    public String getEtapaActual() { return etapaActual; }
    public void setEtapaActual(String etapaActual) { this.etapaActual = etapaActual; }
    public String getEstadoSolicitud() { return estadoSolicitud; }
    public void setEstadoSolicitud(String estadoSolicitud) { this.estadoSolicitud = estadoSolicitud; }
    public Boolean getAutorizacionHabeasData() { return autorizacionHabeasData; }
    public void setAutorizacionHabeasData(Boolean autorizacionHabeasData) { this.autorizacionHabeasData = autorizacionHabeasData; }

    @Override
    public String toString() {
        return "SolicitudBeca{" +
                "idSolicitud=" + idSolicitud +
                ", radicado='" + codigoRadicado + '\'' +
                ", puntaje=" + puntajeVulnerabilidad +
                ", etapa='" + etapaActual + '\'' +
                ", estado='" + estadoSolicitud + '\'' +
                '}';
    }
}

