package co.edu.uniremington.becas.servicios;

import co.edu.uniremington.becas.modelo.SolicitudBeca;

/**
 * Principio SOLID:
 * - SRP (Single Responsibility): Responsable únicamente del cálculo matemático del puntaje RF2.
 * - OCP (Open/Closed): Abierta a extensión sin modificar el cliente.
 */
public class CalculadoraVulnerabilidadUraba implements ICalculadoraVulnerabilidad {

    @Override
    public int calcularPuntaje(SolicitudBeca s) {
        double ingresos = s.getIngresosMensualesCop() != null ? s.getIngresosMensualesCop().doubleValue() : 0;
        int dependientes = s.getNumeroDependientes() != null ? s.getNumeroDependientes() : 0;
        int estrato = s.getEstratoSocioeconomico() != null ? s.getEstratoSocioeconomico() : 1;
        double distancia = s.getDistanciaCampusKm() != null ? s.getDistanciaCampusKm().doubleValue() : 0;

        int ptsIngresos = (int) Math.round(Math.min(1.0, Math.max(0.0, (1500000.0 - ingresos) / 1500000.0)) * 40);
        int ptsDependientes = (int) Math.round(Math.min(1.0, Math.max(0.0, dependientes / 4.0)) * 20);
        int ptsEstrato = (int) Math.round(((7.0 - estrato) / 6.0) * 25);
        int ptsDistancia = (int) Math.round(Math.min(1.0, Math.max(0.0, distancia / 40.0)) * 15);

        return Math.min(100, Math.max(0, ptsIngresos + ptsDependientes + ptsEstrato + ptsDistancia));
    }
}

