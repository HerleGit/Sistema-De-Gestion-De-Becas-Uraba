package co.edu.uniremington.becas.modelo;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entidad ORM Clave #1 mapeada a la tabla 'usuarios' en MySQL.
 */
@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(name = "nombre_completo", nullable = false, length = 120)
    private String nombreCompleto;

    @Column(name = "correo_institucional", nullable = false, unique = true, length = 120)
    private String correoInstitucional;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "rol", nullable = false, length = 20)
    private String rol;

    @Column(name = "cargo", nullable = false, length = 100)
    private String cargo;

    @Column(name = "etapa_comite_asignada", nullable = false, length = 40)
    private String etapaComiteAsignada = "NINGUNA";

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    public Usuario() {
    }

    public Usuario(String nombreCompleto, String correoInstitucional, String passwordHash, String rol, String cargo) {
        this.nombreCompleto = nombreCompleto;
        this.correoInstitucional = correoInstitucional;
        this.passwordHash = passwordHash;
        this.rol = rol;
        this.cargo = cargo;
    }

    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }
    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
    public String getCorreoInstitucional() { return correoInstitucional; }
    public void setCorreoInstitucional(String correoInstitucional) { this.correoInstitucional = correoInstitucional; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }
    public String getEtapaComiteAsignada() { return etapaComiteAsignada; }
    public void setEtapaComiteAsignada(String etapaComiteAsignada) { this.etapaComiteAsignada = etapaComiteAsignada; }
    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    @Override
    public String toString() {
        return "Usuario{" +
                "idUsuario=" + idUsuario +
                ", nombre='" + nombreCompleto + '\'' +
                ", correo='" + correoInstitucional + '\'' +
                ", rol='" + rol + '\'' +
                ", cargo='" + cargo + '\'' +
                ", activo=" + activo +
                '}';
    }
}

