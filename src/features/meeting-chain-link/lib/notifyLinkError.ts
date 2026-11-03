import { toast } from "sonner";

/** Backend bağlantı hatalarını kullanıcı dostu toast'a çevirir. */
export function notifyLinkError(error: unknown) {
  const err = error as {
    response?: { status?: number; data?: string | { message?: string; code?: string } };
  };
  const status = err.response?.status;
  const data = err.response?.data;
  const message = (typeof data === "string" ? data : data?.message) ?? "";
  const code = typeof data === "object" && data ? data.code : undefined;
  const isCyclic =
    code === "CYCLIC_LINK" ||
    /döngü|dongu|cycl|circular/i.test(message) ||
    (status === 500 && /link/i.test(message));

  if (isCyclic) {
    toast.error("Döngüsel bağlı toplantı oluşturulamaz", {
      description: "Seçilen toplantı zaten bu zincirde yer alıyor.",
    });
  } else if (status === 409) {
    toast.warning("Bu toplantı zaten bağlı.");
  } else if (status === 400 && message) {
    toast.error(message);
  } else {
    toast.error("Toplantı bağlanırken bir hata oluştu.");
  }
}
