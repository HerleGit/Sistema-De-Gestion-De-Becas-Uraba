package co.edu.uniremington.becas.modelo;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Entidad ORM mapeada a la tabla 'tipos_subsidio_solicitud' en MySQL.
 */
@Entity
@Table(name = "tipos_subsidio_solicitud")
public class TipoSubsidioSolicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_subsidio_solicitud")
    private Integer idSubsidioSolicitud;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitud", nullable = false)
    private SolicitudBeca solicitud;

    @Column(name = "tipo_subsidio", nullable = false, length = 30)
    private String tipoSubsidio;

    @Column(name = "monto_estimado_cop", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoEstimadoCop = BigDecimal.ZERO;

    public TipoSubsidioSolicitud() {
    }

    public TipoSubsidioSolicitud(SolicitudBeca solicitud, String tipoSubsidio, BigDecimal montoEstimadoCop) {
        this.solicitud = solicitud;
        this.tipoSubsidio = tipoSubsidio;
        this.montoEstimadoCop = montoEstimadoCop;
    }

    public Integer getIdSubsidioSolicitud() { return idSubsidioSolicitud; }
    public void setIdSubsidioSolicitud(Integer idSubsidioSolicitud) { this.idSubsidioSolicitud = idSubsidioSolicitud; }
    public SolicitudBeca getSolicitud() { return solicitud; }
    public void setSolicitud(SolicitudBeca solicitud) { this.solicitud = solicitud; }
    public String getTipoSubsidio() { return tipoSubsidio; }
    public void setTipoSubsidio(String tipoSubsidio) { this.tipoSubsidio = tipoSubsidio; }
    public BigDecimal getMontoEstimadoCop() { return montoEstimadoCop; }
    public void setMontoEstimadoCop(BigDecimal montoEstimadoCop) { this.montoEstimadoCop = montoEstimadoCop; }
}

