package co.edu.uniremington.becas.modelo;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entidad ORM mapeada a la tabla 'registros_auditoria' en MySQL.
 */
@Entity
@Table(name = "registros_auditoria")
public class RegistroAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_auditoria")
    private Integer idAuditoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud", nullable = false)
    private SolicitudBeca solicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_actor", nullable = false)
    private Usuario usuarioActor;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora = LocalDateTime.now();

    @Column(name = "etapa_evaluacion", nullable = false, length = 40)
    private String etapaEvaluacion;

    @Column(name = "accion_realizada", nullable = false, length = 150)
    private String accionRealizada;

    @Column(name = "comentario_dictamen", nullable = false, columnDefinition = "TEXT")
    private String comentarioDictamen;

    @Column(name = "hash_anterior", nullable = false, length = 64)
    private String hashAnterior;

    @Column(name = "hash_actual", nullable = false, length = 64)
    private String hashActual;

    public RegistroAuditoria() {
    }

    public Integer getIdAuditoria() { return idAuditoria; }
    public void setIdAuditoria(Integer idAuditoria) { this.idAuditoria = idAuditoria; }
    public SolicitudBeca getSolicitud() { return solicitud; }
    public void setSolicitud(SolicitudBeca solicitud) { this.solicitud = solicitud; }
    public Usuario getUsuarioActor() { return usuarioActor; }
    public void setUsuarioActor(Usuario usuarioActor) { this.usuarioActor = usuarioActor; }
    public String getEtapaEvaluacion() { return etapaEvaluacion; }
    public void setEtapaEvaluacion(String etapaEvaluacion) { this.etapaEvaluacion = etapaEvaluacion; }
    public String getAccionRealizada() { return accionRealizada; }
    public void setAccionRealizada(String accionRealizada) { this.accionRealizada = accionRealizada; }
    public String getComentarioDictamen() { return comentarioDictamen; }
    public void setComentarioDictamen(String comentarioDictamen) { this.comentarioDictamen = comentarioDictamen; }
    public String getHashAnterior() { return hashAnterior; }
    public void setHashAnterior(String hashAnterior) { this.hashAnterior = hashAnterior; }
    public String getHashActual() { return hashActual; }
    public void setHashActual(String hashActual) { this.hashActual = hashActual; }
}

