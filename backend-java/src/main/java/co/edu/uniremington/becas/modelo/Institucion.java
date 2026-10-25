package co.edu.uniremington.becas.modelo;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad ORM mapeada a la tabla 'instituciones' en MySQL.
 */
@Entity
@Table(name = "instituciones")
public class Institucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_institucion")
    private Integer idInstitucion;

    @Column(name = "nit", nullable = false, unique = true, length = 20)
    private String nit;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "sede", nullable = false, length = 100)
    private String sede;

    @Column(name = "municipio", nullable = false, length = 80)
    private String municipio;

    @Column(name = "codigo_dane_municipio", nullable = false, length = 10)
    private String codigoDaneMunicipio;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    @OneToMany(mappedBy = "institucion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Estudiante> estudiantes = new ArrayList<>();

    public Institucion() {
    }

    public Institucion(String nit, String nombre, String sede, String municipio, String codigoDaneMunicipio) {
        this.nit = nit;
        this.nombre = nombre;
        this.sede = sede;
        this.municipio = municipio;
        this.codigoDaneMunicipio = codigoDaneMunicipio;
    }

    public Integer getIdInstitucion() { return idInstitucion; }
    public void setIdInstitucion(Integer idInstitucion) { this.idInstitucion = idInstitucion; }
    public String getNit() { return nit; }
    public void setNit(String nit) { this.nit = nit; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getSede() { return sede; }
    public void setSede(String sede) { this.sede = sede; }
    public String getMunicipio() { return municipio; }
    public void setMunicipio(String municipio) { this.municipio = municipio; }
    public String getCodigoDaneMunicipio() { return codigoDaneMunicipio; }
    public void setCodigoDaneMunicipio(String codigoDaneMunicipio) { this.codigoDaneMunicipio = codigoDaneMunicipio; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }

    @Override
    public String toString() {
        return "Institucion{" +
                "id=" + idInstitucion +
                ", nit='" + nit + '\'' +
                ", nombre='" + nombre + '\'' +
                ", sede='" + sede + '\'' +
                ", municipio='" + municipio + '\'' +
                '}';
    }
}

