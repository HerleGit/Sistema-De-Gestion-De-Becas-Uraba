package co.edu.uniremington.becas.modelo;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad ORM Clave #2 mapeada a la tabla 'estudiantes' en MySQL.
 * Incluye relaciones @OneToOne con Usuario y @ManyToOne con Institucion.
 */
@Entity
@Table(name = "estudiantes")
public class Estudiante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_estudiante")
    private Integer idEstudiante;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario", nullable = false, unique = true)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_institucion", nullable = false)
    private Institucion institucion;

    @Column(name = "documento_identidad", nullable = false, unique = true, length = 20)
    private String documentoIdentidad;

    @Column(name = "telefono", nullable = false, length = 25)
    private String telefono;

    @Column(name = "municipio_residencia", nullable = false, length = 80)
    private String municipioResidencia;

    @Column(name = "programa_academico", nullable = false, length = 120)
    private String programaAcademico;

    @Column(name = "semestre_actual", nullable = false)
    private Integer semestreActual;

    @Column(name = "promedio_acumulado", nullable = false, precision = 3, scale = 2)
    private BigDecimal promedioAcumulado;

    @OneToMany(mappedBy = "estudiante", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<SolicitudBeca> solicitudes = new ArrayList<>();

    public Estudiante() {
    }

    public Estudiante(Usuario usuario, Institucion institucion, String documentoIdentidad,
                      String telefono, String municipioResidencia, String programaAcademico,
                      Integer semestreActual, BigDecimal promedioAcumulado) {
        this.usuario = usuario;
        this.institucion = institucion;
        this.documentoIdentidad = documentoIdentidad;
        this.telefono = telefono;
        this.municipioResidencia = municipioResidencia;
        this.programaAcademico = programaAcademico;
        this.semestreActual = semestreActual;
        this.promedioAcumulado = promedioAcumulado;
    }

    public Integer getIdEstudiante() { return idEstudiante; }
    public void setIdEstudiante(Integer idEstudiante) { this.idEstudiante = idEstudiante; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public Institucion getInstitucion() { return institucion; }
    public void setInstitucion(Institucion institucion) { this.institucion = institucion; }
    public String getDocumentoIdentidad() { return documentoIdentidad; }
    public void setDocumentoIdentidad(String documentoIdentidad) { this.documentoIdentidad = documentoIdentidad; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getMunicipioResidencia() { return municipioResidencia; }
    public void setMunicipioResidencia(String municipioResidencia) { this.municipioResidencia = municipioResidencia; }
    public String getProgramaAcademico() { return programaAcademico; }
    public void setProgramaAcademico(String programaAcademico) { this.programaAcademico = programaAcademico; }
    public Integer getSemestreActual() { return semestreActual; }
    public void setSemestreActual(Integer semestreActual) { this.semestreActual = semestreActual; }
    public BigDecimal getPromedioAcumulado() { return promedioAcumulado; }
    public void setPromedioAcumulado(BigDecimal promedioAcumulado) { this.promedioAcumulado = promedioAcumulado; }

    @Override
    public String toString() {
        return "Estudiante{" +
                "idEstudiante=" + idEstudiante +
                ", cedula='" + documentoIdentidad + '\'' +
                ", municipio='" + municipioResidencia + '\'' +
                ", programa='" + programaAcademico + '\'' +
                ", semestre=" + semestreActual +
                ", promedio=" + promedioAcumulado +
                '}';
    }
}

