import { MultiPhotoCaptureField } from "./MultiPhotoCaptureField";
import { useMeetingAttachments, useUploadAttachment, useDeleteAttachment } from "@/entities/meeting/api/attachments";

interface MeetingAttachmentsPanelProps {
  meetingId: number;
  editable?: boolean;
}

export function MeetingAttachmentsPanel({
  meetingId,
  editable = true,
}: MeetingAttachmentsPanelProps) {
  const { data: allAttachments = [], isLoading } = useMeetingAttachments(meetingId);
  const uploadMutation = useUploadAttachment(meetingId);
  const deleteMutation = useDeleteAttachment(meetingId);

  const isImage = (a: typeof allAttachments[number]) => a.mimeType.startsWith("image/");
  const businessCards = allAttachments.filter((a) => a.category === "BUSINESS_CARD" && isImage(a));
  const meetingPhotos = allAttachments.filter((a) => a.category === "MEETING_PHOTO" && isImage(a));

  const handleUploadBusinessCard = async (file: File) => {
    await uploadMutation.mutateAsync({
      file,
      category: "BUSINESS_CARD",
    });
  };

  const handleUploadMeetingPhoto = async (file: File) => {
    await uploadMutation.mutateAsync({
      file,
      category: "MEETING_PHOTO",
    });
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="min-w-0 max-w-full space-y-6">
      {/* 1. Başlık: Kartvizit */}
      <MultiPhotoCaptureField
        category="BUSINESS_CARD"
        title="Kartvizit Görselleri"
        description="Toplantı katılımcılarına ait kartvizit fotoğrafları veya kartvizit taramaları."
        attachments={businessCards}
        isLoading={isLoading}
        editable={editable}
        onUpload={handleUploadBusinessCard}
        onDeleteAttachment={handleDelete}
      />

      {/* 2. Başlık: Toplantı Görselleri */}
      <MultiPhotoCaptureField
        category="MEETING_PHOTO"
        title="Toplantı Görselleri"
        description="Toplantı anı, sunum ekranı, teknik çizimler veya beyaz tahta notlarının fotoğrafları."
        attachments={meetingPhotos}
        isLoading={isLoading}
        editable={editable}
        onUpload={handleUploadMeetingPhoto}
        onDeleteAttachment={handleDelete}
      />
    </div>
  );
}
