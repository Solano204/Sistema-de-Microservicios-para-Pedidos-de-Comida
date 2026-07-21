const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  APPROVED: "Aprobado",
  CANCELLING: "Cancelando",
  CANCELLED: "Cancelado",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge--${status.toLowerCase()}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
