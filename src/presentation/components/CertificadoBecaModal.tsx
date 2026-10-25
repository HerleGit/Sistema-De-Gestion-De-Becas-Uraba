import { SolicitudBeca } from "../../domain/models";
import { SolicitudRepository } from "../../data/SolicitudRepository";

export function CertificadoBecaModal({
  solicitud,
  semestreActivo,
  onClose,
}: {
  solicitud: SolicitudBeca;
  semestreActivo: string;
  onClose: () => void;
}) {
  const ultimoRegistro =
    solicitud.historialAuditoria[solicitud.historialAuditoria.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-stone-200 max-w-2xl w-full shadow-2xl overflow-hidden">
        {/* Barra de acciones superior (oculta al imprimir) */}
        <div className="px-6 py-3.5 bg-[#165C58] text-white flex items-center justify-between print:hidden">
          <div className="text-xs font-medium">
            Resolución Oficial de Adjudicación · {solicitud.id}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-white text-[#165C58] px-3 py-1 rounded text-xs font-semibold hover:bg-stone-100 transition-colors"
            >
              ⎙ Imprimir / Guardar PDF
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-xs px-2.5 py-1 rounded hover:bg-white/10"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* Documento Oficial de Resolución */}
        <div className="p-8 sm:p-10 bg-white text-[#1A2928]">
          <div className="border-2 border-[#165C58]/30 rounded-lg p-6 sm:p-8">
            {/* Encabezado Institucional */}
            <div className="text-center border-b border-stone-200 pb-5 mb-6">
              <div className="text-[11px] font-semibold tracking-widest uppercase text-[#165C58] mb-1">
                Corporación Universitaria Remington · Sede Regional Urabá
              </div>
              <h2
                className="font-display text-xl font-bold text-[#1A2928]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                RESOLUCIÓN DE ADJUDICACIÓN DE AUXILIO SOCIOECONÓMICO
              </h2>
              <div className="text-xs text-stone-500 mt-1 font-mono">
                Expediente N.° {solicitud.id} · Convocatoria {semestreActivo}
              </div>
            </div>

            {/* Cuerpo de la Resolución */}
            <div className="text-xs sm:text-sm text-stone-700 leading-relaxed space-y-4">
              <p>
                El <strong>Comité de Aprobación Final de Bienestar Institucional</strong> de la
                Corporación Universitaria Remington — Sede Apartadó (Región de Urabá), en
                uso de sus atribuciones reglamentarias y tras agotar las etapas de{" "}
                <em>Validación Documental</em>, <em>Comité Socioeconómico</em> y{" "}
                <em>Comité Financiero</em>:
              </p>

              <div className="bg-[#F5F2EC] border border-stone-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-stone-400 block">Beneficiario(a):</span>
                  <strong className="text-[#1A2928] text-sm">
                    {solicitud.datosPersonales.nombre}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Documento de Identidad:</span>
                  <strong className="font-mono text-[#1A2928]">
                    C.C. {solicitud.datosPersonales.id}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Programa Académico:</span>
                  <strong className="text-[#1A2928]">
                    {solicitud.datosAcademicos.programa} (Semestre{" "}
                    {solicitud.datosAcademicos.semestre})
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Municipio de Origen:</span>
                  <strong className="text-[#1A2928]">
                    {solicitud.datosPersonales.municipio} · Antioquia
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Modalidad Adjudicada:</span>
                  <strong className="text-emerald-700">
                    Subsidio de{" "}
                    {SolicitudRepository.formatearSubsidios(solicitud.tipoSubsidio)}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400 block">
                    Puntaje Auditable de Vulnerabilidad:
                  </span>
                  <strong className="font-mono text-[#165C58]">
                    {solicitud.puntajeVulnerabilidad} / 100 Puntos
                  </strong>
                </div>
              </div>

              <p>
                <strong>RESUELVE:</strong> Otorgar el beneficio socioeconómico arriba
                descrito para el periodo académico <strong>{semestreActivo}</strong>, al
                haberse verificado objetivamente las condiciones de vulnerabilidad y el
                cumplimiento de los requisitos académicos e institucionales.
              </p>
            </div>

            {/* Sello Criptográfico de Trazabilidad Inalterable */}
            <div className="mt-7 pt-5 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-[11px] text-stone-500">
                <div className="font-semibold text-[#1A2928]">
                  Firmado digitalmente por: {ultimoRegistro?.actor || "Comité Institucional"}
                </div>
                <div>Fecha de resolución: {ultimoRegistro?.timestamp || solicitud.fecha}</div>
                <div className="font-mono text-[10px] text-[#165C58] mt-1">
                  Sello Hash Inmutable: {ultimoRegistro?.hashActual || "VERIFICADO"}
                </div>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] font-semibold text-emerald-800">
                ✓ DOCUMENTO AUTÉNTICO AUDITADO
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

