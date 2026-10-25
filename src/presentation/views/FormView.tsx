import { useEffect, useState } from "react";
import {
  Documento,
  ParametrosSistema,
  SolicitudBeca,
  TipoSubsidio,
  UsuarioSesion,
} from "../../domain/models";
import {
  DirectorPostulacion,
  ModuloCalculoVulnerabilidad,
  SolicitudBecaBuilder,
} from "../../business/builders/SolicitudBecaBuilder";

const DRAFT_STORAGE_KEY = "uniremington_borrador_postulacion_v1";

const steps = [
  "Datos Personales",
  "Datos Académicos",
  "Variables Socioeconómicas",
  "Tipo de Subsidio",
  "Documentos y Habeas Data",
];

const DOCUMENTOS_INICIALES: Documento[] = [
  {
    id: "doc-cedula",
    tipo: "Copia del documento de identidad",
    archivo: "cedula_ciudadania.pdf",
    requerido: true,
    adjuntado: true,
    estadoValidacion: false,
  },
  {
    id: "doc-sisben",
    tipo: "Certificado de ingresos del hogar (SISBEN o declaración juramentada)",
    archivo: "certificado_sisben_iv.pdf",
    requerido: true,
    adjuntado: true,
    estadoValidacion: false,
  },
  {
    id: "doc-matricula",
    tipo: "Certificado de matrícula vigente",
    archivo: "constancia_matricula_2026.pdf",
    requerido: true,
    adjuntado: true,
    estadoValidacion: false,
  },
  {
    id: "doc-servicios",
    tipo: "Recibo de servicios públicos (dirección de residencia)",
    archivo: "",
    requerido: false,
    adjuntado: false,
    estadoValidacion: false,
  },
  {
    id: "doc-especial",
    tipo: "Carta de situación especial (discapacidad, victimización u otro)",
    archivo: "",
    requerido: false,
    adjuntado: false,
    estadoValidacion: false,
  },
];

export function FormView({
  usuario,
  parametros,
  siguienteId,
  onCreateSolicitud,
  onGoToDashboard,
}: {
  usuario: UsuarioSesion;
  parametros: ParametrosSistema;
  siguienteId: string;
  onCreateSolicitud: (nueva: SolicitudBeca) => void;
  onGoToDashboard: () => void;
}) {
  const [step, setStep] = useState(0);
  const [createdSolicitud, setCreatedSolicitud] =
    useState<SolicitudBeca | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [aceptaHabeasData, setAceptaHabeasData] = useState(true);
  const [borradorSincronizado, setBorradorSincronizado] = useState(false);

  const [formData, setFormData] = useState(() => {
    try {
      const guardado = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (parsed.formData) return parsed.formData;
      }
    } catch {
      // Fallback
    }
    return {
      nombre: usuario.nombre || "Yulieth Córdoba Palacios",
      cedula: usuario.idDocumento || "1027890451",
      telefono: "312 458 9012",
      correo: usuario.correo || "yulieth.cordoba@uniremington.edu.co",
      municipio: "Turbo",
      programa: "Ingeniería de Sistemas",
      semestre: "6",
      promedio: "4.3",
      ingresos: "650000",
      dependientes: "3",
      estrato: "1",
      distancia: "32",
      subsidios: ["ALIMENTACION", "TRANSPORTE"] as TipoSubsidio[],
    };
  });

  const [documentos, setDocumentos] = useState<Documento[]>(
    DOCUMENTOS_INICIALES
  );

  // Guardado automático de borrador para tolerancia a desconexiones regionales (RNF Disponibilidad)
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ formData, step, timestamp: new Date().toLocaleTimeString() })
      );
      setBorradorSincronizado(true);
    } catch {
      // Ignorar
    }
  }, [formData, step]);

  const toggleSubsidio = (s: TipoSubsidio) => {
    setFormData((p: typeof formData) => ({
      ...p,
      subsidios: p.subsidios.includes(s)
        ? p.subsidios.filter((x: TipoSubsidio) => x !== s)
        : [...p.subsidios, s],
    }));
  };

  const toggleAdjuntarDocumento = (docId: string) => {
    setDocumentos((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d;
        const nuevoEstado = !d.adjuntado;
        return {
          ...d,
          adjuntado: nuevoEstado,
          archivo: nuevoEstado ? `${d.id}_soporte_2026.pdf` : "",
        };
      })
    );
  };

  // Cálculo explicable conectado a los pesos configurados por el Administrador (RF2)
  const desglose = ModuloCalculoVulnerabilidad.calcularDesglose(
    {
      ingresos: formData.ingresos,
      dependientes: formData.dependientes,
      estrato: formData.estrato,
      distancia: formData.distancia,
    },
    parametros
  );
  const puntaje = desglose.total;

  const handleEnviarPostulacion = () => {
    if (!formData.nombre.trim()) {
      setStep(0);
      setErrorMsg("Por favor ingresa el nombre completo del estudiante.");
      return;
    }
    if (formData.subsidios.length === 0) {
      setStep(3);
      setErrorMsg("Selecciona al menos un tipo de subsidio.");
      return;
    }
    if (!aceptaHabeasData) {
      setStep(4);
      setErrorMsg(
        "Debes autorizar expresamente el tratamiento de datos personales (Ley 1581 de 2012) para radicar la solicitud."
      );
      return;
    }

    // Construcción mediante el Patrón Builder (SolicitudBecaBuilder + DirectorPostulacion)
    const builder = new SolicitudBecaBuilder();
    const director = new DirectorPostulacion(builder);

    const nuevaSolicitud = director.construirSolicitudCompleta({
      id: siguienteId,
      datosPersonales: {
        id: formData.cedula.trim() || "1027900100",
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim() || "300 000 0000",
        correo:
          formData.correo.trim() ||
          `${formData.nombre.trim().split(" ")[0].toLowerCase()}@uniremington.edu.co`,
        municipio: formData.municipio.trim() || "Apartadó",
      },
      datosAcademicos: {
        programa: formData.programa || "Ingeniería de Sistemas",
        semestre: Number(formData.semestre) || 1,
        promedio: Number(formData.promedio) || 3.5,
        institucion: {
          nombre: "Corporación Universitaria Remington",
          sede: "Apartadó · Urabá",
        },
      },
      subsidios: formData.subsidios,
      ingresos: Number(formData.ingresos) || 0,
      dependientes: Number(formData.dependientes) || 0,
      estrato: Number(formData.estrato) || 1,
      distancia: Number(formData.distancia) || 0,
      documentos,
      pesos: parametros,
    });

    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignorar
    }

    onCreateSolicitud(nuevaSolicitud);
    setCreatedSolicitud(nuevaSolicitud);
  };

  if (createdSolicitud) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F2EC] p-6 sm:p-8">
        <div className="bg-white rounded-xl border border-stone-100 p-8 sm:p-10 max-w-md text-center shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-5 text-emerald-700">
            ✓
          </div>
          <h3
            className="font-display text-xl font-semibold text-[#1A2928] mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Postulación construida y radicada
          </h3>
          <p className="text-sm text-stone-500 mb-4">
            Tu solicitud{" "}
            <strong className="font-mono text-[#165C58]">
              {createdSolicitud.id}
            </strong>{" "}
            fue ensamblada con <code>SolicitudBecaBuilder</code> y pasó a la
            etapa de <strong>{createdSolicitud.etapaActual}</strong> (Estado:{" "}
            <strong>{createdSolicitud.estado}</strong>).
          </p>
          <div className="bg-[#165C58]/5 rounded-lg p-4 mb-5">
            <div className="text-xs text-stone-500 mb-1">
              Puntaje de vulnerabilidad auditable
            </div>
            <div className="text-3xl font-semibold text-[#165C58]">
              {createdSolicitud.puntajeVulnerabilidad}
              <span className="text-base font-normal text-stone-400">/100</span>
            </div>
            <div className="text-[10px] font-mono text-stone-400 mt-1">
              Hash Auditoría:{" "}
              {createdSolicitud.historialAuditoria[0]?.hashActual}
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onGoToDashboard}
              className="bg-[#165C58] text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-[#1A6E69] transition-colors"
            >
              Volver a Mis Solicitudes
            </button>
            <button
              onClick={() => {
                setCreatedSolicitud(null);
                setStep(0);
              }}
              className="border border-stone-200 text-stone-600 px-4 py-2.5 rounded text-sm font-medium hover:border-stone-400 transition-colors"
            >
              Otra postulación
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F2EC] px-4 sm:px-8 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header con indicador de tolerancia a desconexión */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              className="font-display text-2xl font-semibold text-[#1A2928]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Formulario de Postulación
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Construcción paso a paso (Patrón Builder) · Próximo radicado:{" "}
              <span className="font-mono font-semibold text-[#165C58]">
                {siguienteId}
              </span>
            </p>
          </div>

          {borradorSincronizado && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-full text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Borrador guardado localmente · Tolerante a desconexión
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-7 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setStep(i)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  i === step
                    ? "bg-[#165C58] text-white border-[#165C58]"
                    : i < step
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-stone-400 border-stone-200"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    i === step
                      ? "bg-white/20"
                      : i < step
                      ? "bg-emerald-100"
                      : "bg-stone-100"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                {s}
              </button>
              {i < steps.length - 1 && (
                <span className="text-stone-200 text-xs">›</span>
              )}
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700">
            ⚠ {errorMsg}
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-lg border border-stone-100 p-5 sm:p-7 mb-5">
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <h3 className="font-semibold text-sm text-[#1A2928]">
                1. Información Personal (<code>setDatosPersonales</code>)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: "nombre",
                    label: "Nombre completo *",
                    placeholder: "Ej. Yulieth Córdoba Palacios",
                    span: 2,
                  },
                  {
                    id: "cedula",
                    label: "Número de cédula",
                    placeholder: "1027890123",
                  },
                  {
                    id: "telefono",
                    label: "Celular",
                    placeholder: "300 000 0000",
                  },
                  {
                    id: "correo",
                    label: "Correo institucional",
                    placeholder: "nombre@uniremington.edu.co",
                    span: 2,
                  },
                  {
                    id: "municipio",
                    label: "Municipio de residencia (Urabá)",
                    placeholder: "Ej. Apartadó, Turbo, Carepa, Chigorodó",
                    span: 2,
                  },
                ].map((f) => (
                  <div
                    key={f.id}
                    className={f.span === 2 ? "sm:col-span-2" : ""}
                  >
                    <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                      {f.label}
                    </label>
                    <input
                      type="text"
                      value={
                        (formData as unknown as Record<string, string>)[f.id] ||
                        ""
                      }
                      onChange={(e) => {
                        setErrorMsg("");
                        setFormData((p: typeof formData) => ({
                          ...p,
                          [f.id]: e.target.value,
                        }));
                      }}
                      placeholder={f.placeholder}
                      className="w-full border border-stone-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/20 focus:border-[#165C58] placeholder:text-stone-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h3 className="font-semibold text-sm text-[#1A2928]">
                2. Información Académica (<code>setDatosAcademicos</code>)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                    Programa académico
                  </label>
                  <select
                    value={formData.programa}
                    onChange={(e) =>
                      setFormData((p: typeof formData) => ({
                        ...p,
                        programa: e.target.value,
                      }))
                    }
                    className="w-full border border-stone-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/20 focus:border-[#165C58] bg-white text-stone-700"
                  >
                    <option value="">Selecciona un programa</option>
                    <option value="Ingeniería de Sistemas">
                      Ingeniería de Sistemas
                    </option>
                    <option value="Administración de Empresas">
                      Administración de Empresas
                    </option>
                    <option value="Contaduría Pública">
                      Contaduría Pública
                    </option>
                    <option value="Derecho">Derecho</option>
                    <option value="Psicología">Psicología</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                    Semestre actual
                  </label>
                  <select
                    value={formData.semestre}
                    onChange={(e) =>
                      setFormData((p: typeof formData) => ({
                        ...p,
                        semestre: e.target.value,
                      }))
                    }
                    className="w-full border border-stone-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/20 focus:border-[#165C58] bg-white text-stone-700"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={String(n)}>
                        Semestre {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                    Promedio acumulado (Mín. reglamentario:{" "}
                    {parametros.promedioMinimoRequerido.toFixed(1)})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.promedio}
                    onChange={(e) =>
                      setFormData((p: typeof formData) => ({
                        ...p,
                        promedio: e.target.value,
                      }))
                    }
                    placeholder="Ej. 3.8"
                    className="w-full border border-stone-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/20 focus:border-[#165C58] placeholder:text-stone-300"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h3 className="font-semibold text-sm text-[#1A2928]">
                3. Variables Socioeconómicas (
                <code>setVariablesSocioeconomicas</code>)
              </h3>
              <p className="text-xs text-stone-400">
                Ponderación institucional vigente: Ingresos ({parametros.pesoIngresos}
                %), Estrato ({parametros.pesoEstrato}%), Dependientes (
                {parametros.pesoDependientes}%), Distancia ({parametros.pesoDistancia}
                %). Umbral mínimo: <strong>{parametros.umbralPuntajeMinimo} pts</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                    Ingresos mensuales del hogar (COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={formData.ingresos}
                    onChange={(e) =>
                      setFormData((p: typeof formData) => ({
                        ...p,
                        ingresos: e.target.value,
                      }))
                    }
                    placeholder="Ej. 750000"
                    className="w-full border border-stone-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/20 focus:border-[#165C58] placeholder:text-stone-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                    N.° de dependientes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={formData.dependientes}
                    onChange={(e) =>
                      setFormData((p: typeof formData) => ({
                        ...p,
                        dependientes: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full border border-stone-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/20 focus:border-[#165C58] placeholder:text-stone-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                    Estrato socioeconómico
                  </label>
                  <select
                    value={formData.estrato}
                    onChange={(e) =>
                      setFormData((p: typeof formData) => ({
                        ...p,
                        estrato: e.target.value,
                      }))
                    }
                    className="w-full border border-stone-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/20 focus:border-[#165C58] bg-white text-stone-700"
                  >
                    <option value="">Selecciona</option>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={String(n)}>
                        Estrato {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-stone-600 mb-1.5 block">
                    Distancia al campus Apartadó (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.distancia}
                    onChange={(e) =>
                      setFormData((p: typeof formData) => ({
                        ...p,
                        distancia: e.target.value,
                      }))
                    }
                    placeholder="Ej. 25"
                    className="w-full border border-stone-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#165C58]/20 focus:border-[#165C58] placeholder:text-stone-300"
                  />
                </div>
              </div>

              {/* Desglose explicable en vivo */}
              <div className="bg-[#165C58]/5 rounded-lg p-4 border border-[#165C58]/15">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <div className="text-xs text-stone-500">
                      Puntaje de vulnerabilidad auditable (RF2)
                    </div>
                    <div className="text-2xl font-semibold text-[#165C58]">
                      {puntaje}
                      <span className="text-sm font-normal text-stone-400">
                        /100 pts
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 max-w-xs h-2.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#165C58] rounded-full transition-all duration-300"
                      style={{ width: `${puntaje}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white px-2.5 py-1.5 rounded border border-stone-200/80">
                    <span className="text-stone-400 block">Ingresos:</span>
                    <strong className="font-mono text-[#1A2928]">
                      +{desglose.ptsIngresos}/{desglose.maxIngresos} pts
                    </strong>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded border border-stone-200/80">
                    <span className="text-stone-400 block">Estrato:</span>
                    <strong className="font-mono text-[#1A2928]">
                      +{desglose.ptsEstrato}/{desglose.maxEstrato} pts
                    </strong>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded border border-stone-200/80">
                    <span className="text-stone-400 block">Dependientes:</span>
                    <strong className="font-mono text-[#1A2928]">
                      +{desglose.ptsDependientes}/{desglose.maxDependientes} pts
                    </strong>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded border border-stone-200/80">
                    <span className="text-stone-400 block">Distancia:</span>
                    <strong className="font-mono text-[#1A2928]">
                      +{desglose.ptsDistancia}/{desglose.maxDistancia} pts
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h3 className="font-semibold text-sm text-[#1A2928]">
                4. Tipo de Subsidio Solicitado (<code>setTipoSubsidio</code>)
              </h3>
              <p className="text-xs text-stone-400">
                Puedes solicitar uno o varios tipos de auxilio socioeconómico.
              </p>
              <div className="flex flex-col gap-3">
                {(
                  [
                    {
                      id: "ALIMENTACION" as TipoSubsidio,
                      label: "Subsidio de Alimentación",
                      desc: "Apoyo para acceder al comedor universitario durante el semestre.",
                    },
                    {
                      id: "TRANSPORTE" as TipoSubsidio,
                      label: "Subsidio de Transporte",
                      desc: "Apoyo para desplazamiento desde municipios del eje bananero.",
                    },
                    {
                      id: "MATRICULA" as TipoSubsidio,
                      label: "Apoyo a Matrícula",
                      desc: "Apoyo parcial o total al pago de matrícula según vulnerabilidad.",
                    },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSubsidio(s.id)}
                    className={`text-left rounded-lg border p-4 transition-all ${
                      formData.subsidios.includes(s.id)
                        ? "border-[#165C58] bg-[#165C58]/5"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          formData.subsidios.includes(s.id)
                            ? "bg-[#165C58] border-[#165C58] text-white"
                            : "border-stone-300"
                        }`}
                      >
                        {formData.subsidios.includes(s.id) && (
                          <span className="text-[9px]">✓</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#1A2928]">
                          {s.label}
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          {s.desc}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <h3 className="font-semibold text-sm text-[#1A2928]">
                5. Documentos Requeridos (<code>adjuntarDocumento</code>) y
                Habeas Data
              </h3>
              <p className="text-xs text-stone-400">
                Haz clic en cada botón para adjuntar o retirar el soporte. Si
                dejas algún obligatorio pendiente, el Builder radicará la
                solicitud en estado <strong>Pendiente docs.</strong> para
                subsanación posterior.
              </p>
              <div className="flex flex-col gap-3">
                {documentos.map((d) => (
                  <div
                    key={d.id}
                    className={`flex items-center justify-between border rounded-lg px-4 py-3 transition-colors ${
                      d.adjuntado
                        ? "border-emerald-200 bg-emerald-50/40"
                        : "border-dashed border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div>
                      <div className="text-sm text-[#1A2928] flex items-center gap-2">
                        {d.tipo}
                        {d.requerido && (
                          <span className="text-[10px] text-red-500 font-semibold">
                            * Obligatorio
                          </span>
                        )}
                      </div>
                      {d.adjuntado && (
                        <div className="text-[11px] font-mono text-emerald-700 mt-0.5">
                          ✓ Archivo cargado: {d.archivo}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleAdjuntarDocumento(d.id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded transition-colors shrink-0 ml-4 ${
                        d.adjuntado
                          ? "bg-white text-stone-600 border border-stone-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          : "text-[#165C58] border border-[#165C58]/30 hover:bg-[#165C58]/5"
                      }`}
                    >
                      {d.adjuntado ? "Quitar archivo" : "Adjuntar PDF"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Consentimiento Expreso Habeas Data (Ley 1581 de 2012) */}
              <label className="flex items-start gap-3 p-4 rounded-lg bg-[#165C58]/5 border border-[#165C58]/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceptaHabeasData}
                  onChange={(e) => {
                    setAceptaHabeasData(e.target.checked);
                    setErrorMsg("");
                  }}
                  className="mt-1 w-4 h-4 accent-[#165C58] shrink-0"
                />
                <div className="text-xs text-stone-700 leading-relaxed">
                  <strong className="text-[#1A2928] block mb-0.5">
                    Autorización Expresa de Tratamiento de Datos Personales (Ley
                    1581 de 2012 — Habeas Data) *
                  </strong>
                  Autorizo de manera voluntaria, previa, explícita e informada a
                  la Corporación Universitaria Remington (Sede Urabá) para
                  recolectar, almacenar de forma encriptada y evaluar mis datos
                  socioeconómicos y soportes documentales con fines exclusivos
                  de adjudicación y auditoría de becas estudiantiles.
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-5 py-2.5 text-sm font-medium text-stone-500 border border-stone-200 rounded hover:border-stone-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
          >
            ← Anterior
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2.5 text-sm font-semibold bg-[#165C58] text-white rounded hover:bg-[#1A6E69] transition-colors"
            >
              Continuar →
            </button>
          ) : (
            <button
              onClick={handleEnviarPostulacion}
              className="px-5 py-2.5 text-sm font-semibold bg-[#C97B1A] text-white rounded hover:bg-[#B06A12] transition-colors"
            >
              Firmar Habeas Data y Enviar Postulación
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
