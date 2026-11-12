package co.edu.uniremington.becas.servicios;

import co.edu.uniremington.becas.modelo.SolicitudBeca;

/**
 * Segunda estrategia de cálculo socioeconómico para estudiantes provenientes de municipios
 * rurales dispersos del Urabá (Mutatá, Necoclí, San Juan de Urabá, Arboletes, San Pedro de Urabá).
 *
 * Principios SOLID demostrados:
 * - OCP (Open/Closed Principle): Extiende el comportamiento del sistema agregando una nueva regla
 *   de ponderación regional sin modificar el código de GestionBecasCrudService ni CalculadoraVulnerabilidadUraba.
 * - LSP (Liskov Substitution Principle): Puede sustituir de forma transparente a cualquier implementación
 *   de ICalculadoraVulnerabilidad sin alterar la semántica del rango [0..100].
 * - SRP (Single Responsibility Principle): Se encarga exclusivamente del cálculo ponderado rural.
 */
public class CalculadoraVulnerabilidadRuralPrioritaria implements ICalculadoraVulnerabilidad {

    @Override
    public int calcularPuntaje(SolicitudBeca s) {
        double ingresos = s.getIngresosMensualesCop() != null ? s.getIngresosMensualesCop().doubleValue() : 0;
        int dependientes = s.getNumeroDependientes() != null ? s.getNumeroDependientes() : 0;
        int estrato = s.getEstratoSocioeconomico() != null ? s.getEstratoSocioeconomico() : 1;
        double distancia = s.getDistanciaCampusKm() != null ? s.getDistanciaCampusKm().doubleValue() : 0;

        // En zona rural prioritaria, la distancia vial al campus pesa 25% y los ingresos 35%
        int ptsIngresos = (int) Math.round(Math.min(1.0, Math.max(0.0, (1500000.0 - ingresos) / 1500000.0)) * 35);
        int ptsDependientes = (int) Math.round(Math.min(1.0, Math.max(0.0, dependientes / 4.0)) * 20);
        int ptsEstrato = (int) Math.round(((7.0 - estrato) / 6.0) * 20);
        int ptsDistancia = (int) Math.round(Math.min(1.0, Math.max(0.0, distancia / 50.0)) * 25);

        return Math.min(100, Math.max(0, ptsIngresos + ptsDependientes + ptsEstrato + ptsDistancia));
    }
}
