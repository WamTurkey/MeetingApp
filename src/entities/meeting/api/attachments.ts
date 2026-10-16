import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import type { AttachmentDto, AttachmentCategory } from "@/types/api";
import { toast } from "sonner";

export const attachmentKeys = {
  all: ["attachments"] as const,
  byMeeting: (meetingId: number, category?: AttachmentCategory) =>
    ["attachments", meetingId, category ?? "all"] as const,
};

export function useMeetingAttachments(meetingId: number, category?: AttachmentCategory) {
  return useQuery<AttachmentDto[]>({
    queryKey: attachmentKeys.byMeeting(meetingId, category),
    queryFn: async () => {
      const url = category
        ? `/meetings/${meetingId}/attachments?category=${encodeURIComponent(category)}`
        : `/meetings/${meetingId}/attachments`;
      const { data } = await apiClient.get<AttachmentDto[]>(url);
      return data;
    },
    enabled: meetingId > 0,
  });
}

export function useUploadAttachment(meetingId: number) {
  const qc = useQueryClient();
  return useMutation<
    AttachmentDto,
    Error,
    { file: File; category: AttachmentCategory; description?: string }
  >({
    mutationFn: async ({ file, category, description }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      if (description) formData.append("description", description);

      const { data } = await apiClient.post<AttachmentDto>(
        `/meetings/${meetingId}/attachments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: attachmentKeys.byMeeting(meetingId) });
      qc.invalidateQueries({ queryKey: attachmentKeys.byMeeting(meetingId, vars.category) });
      toast.success(
        vars.category === "BUSINESS_CARD"
          ? "Kartvizit görseli başarıyla yüklendi"
          : "Toplantı görseli başarıyla yüklendi"
      );
    },
    onError: (err) => {
      console.error("Upload attachment error:", err);
      toast.error("Görsel yüklenirken bir hata oluştu");
    },
  });
}

export function useDeleteAttachment(meetingId: number) {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (attachmentId: number) => {
      await apiClient.delete(`/meetings/${meetingId}/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attachmentKeys.byMeeting(meetingId) });
      toast.success("Görsel silindi");
    },
    onError: (err) => {
      console.error("Delete attachment error:", err);
      toast.error("Görsel silinirken hata oluştu");
    },
  });
}
