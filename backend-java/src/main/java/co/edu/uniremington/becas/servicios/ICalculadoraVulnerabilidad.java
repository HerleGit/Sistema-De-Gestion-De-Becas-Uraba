package co.edu.uniremington.becas.servicios;

import co.edu.uniremington.becas.modelo.SolicitudBeca;

/**
 * Principio SOLID:
 * - ISP (Segregation of Interfaces) y DIP (Dependency Inversion Principle):
 *   Los servicios y controladores dependen de esta abstracción.
 */
public interface ICalculadoraVulnerabilidad {
    int calcularPuntaje(SolicitudBeca solicitud);
}

