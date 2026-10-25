import { EstadoSolicitud } from "../../domain/models";

export const Badge = ({
  label,
  color,
}: {
  label: string;
  color: "green" | "yellow" | "red" | "blue" | "gray";
}) => {
  const map = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    gray: "bg-stone-100 text-stone-500 border-stone-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium border rounded-full ${map[color]}`}
    >
      {label}
    </span>
  );
};

export const estadoBadge = (estado: EstadoSolicitud | string) => {
  if (estado === "Aprobada") return <Badge label={estado} color="green" />;
  if (estado === "Rechazada") return <Badge label={estado} color="red" />;
  if (estado === "En revisión") return <Badge label={estado} color="blue" />;
  return <Badge label={estado} color="yellow" />;
};

