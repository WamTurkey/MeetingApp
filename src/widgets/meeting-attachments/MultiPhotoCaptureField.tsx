import { useRef, useState } from "react";
import { Camera, Upload, Trash2, Eye, Download, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import type { AttachmentDto, AttachmentCategory } from "@/types/api";

interface MultiPhotoCaptureFieldProps {
  category: AttachmentCategory;
  title: string;
  description?: string;
  attachments?: AttachmentDto[];
  localFiles?: { file: File; previewUrl: string; id: string }[];
  isLoading?: boolean;
  editable?: boolean;
  onUpload?: (file: File) => Promise<void> | void;
  onDeleteAttachment?: (id: number) => Promise<void> | void;
  onAddLocalFile?: (file: File) => void;
  onRemoveLocalFile?: (id: string) => void;
}

export function MultiPhotoCaptureField({
  category,
  title,
  description,
  attachments = [],
  localFiles = [],
  isLoading = false,
  editable = true,
  onUpload,
  onDeleteAttachment,
  onAddLocalFile,
  onRemoveLocalFile,
}: MultiPhotoCaptureFieldProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    if (onUpload) {
      setIsUploading(true);
      try {
        for (const file of fileList) {
          await onUpload(file);
        }
      } finally {
        setIsUploading(false);
      }
    } else if (onAddLocalFile) {
      for (const file of fileList) {
        onAddLocalFile(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!editable) return;
    handleFiles(e.dataTransfer.files);
  };

  const totalCount = attachments.length + localFiles.length;

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-xs dark:border-surface-700 dark:bg-surface-800">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-surface-100 pb-4 dark:border-surface-700">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${category === "BUSINESS_CARD" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"}`}>
              {category === "BUSINESS_CARD" ? <ImageIcon className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
            </div>
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              {title}
            </h3>
            <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-semibold text-surface-600 dark:bg-surface-700 dark:text-surface-300">
              {totalCount}
            </span>
          </div>
          {description && (
            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
              {description}
            </p>
          )}
        </div>

        {editable && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Hidden file inputs */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Camera className="h-4 w-4" />}
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
            >
              Fotoğraf Çek
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Dosya Seç
            </Button>
          </div>
        )}
      </div>

      {/* Drag & Drop Zone (if editable) */}
      {editable && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            isDragging
              ? "border-brand-500 bg-brand-50/50 dark:border-brand-400 dark:bg-brand-950/20"
              : "border-surface-200 hover:border-surface-300 hover:bg-surface-50/60 dark:border-surface-700 dark:hover:border-surface-600 dark:hover:bg-surface-800/50"
          }`}
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-300">
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> : <Upload className="h-5 w-5" />}
          </div>
          <p className="mt-2 text-sm font-medium text-surface-700 dark:text-surface-300">
            {isUploading ? "Görseller yükleniyor..." : "Görselleri buraya sürükleyin veya tıklayarak seçin"}
          </p>
          <p className="mt-0.5 text-xs text-surface-400">
            PNG, JPG, JPEG, WEBP (Çoklu seçim desteklenir)
          </p>
        </div>
      )}

      {/* Photos Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
          <span className="ml-2 text-xs text-surface-500">Görseller yükleniyor...</span>
        </div>
      ) : totalCount === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-surface-400 italic">
            Bu başlık altında henüz kayıtlı görsel bulunmamaktadır.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {/* Server-persisted Attachments */}
          {attachments.map((att) => {
            const fileUrl = `/api/meetings/${att.meetingId}/attachments/${att.id}/file`;
            return (
              <div
                key={`att-${att.id}`}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-surface-200 bg-surface-50 shadow-2xs transition-all hover:shadow-sm dark:border-surface-700 dark:bg-surface-900"
              >
                <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-100 dark:bg-surface-800">
                  <img
                    src={fileUrl}
                    alt={att.fileName}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Overlay buttons */}
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setSelectedImage({ url: fileUrl, title: att.fileName })}
                      className="rounded-full bg-white/90 p-1.5 text-surface-800 shadow-sm transition hover:bg-white hover:scale-110"
                      title="Büyüt"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <a
                      href={fileUrl}
                      download={att.fileName}
                      className="rounded-full bg-white/90 p-1.5 text-surface-800 shadow-sm transition hover:bg-white hover:scale-110"
                      title="İndir"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    {editable && onDeleteAttachment && (
                      <button
                        type="button"
                        onClick={() => onDeleteAttachment(att.id)}
                        className="rounded-full bg-danger-500/90 p-1.5 text-white shadow-sm transition hover:bg-danger-600 hover:scale-110"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2">
                  <p className="truncate text-xs font-medium text-surface-800 dark:text-surface-200" title={att.fileName}>
                    {att.fileName}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between text-2xs text-surface-400">
                    <span>{(att.fileSizeBytes / 1024).toFixed(0)} KB</span>
                    <span>{new Date(att.createdAt).toLocaleDateString("tr-TR")}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Local draft files (before creation/save) */}
          {localFiles.map((lf) => (
            <div
              key={`local-${lf.id}`}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-brand-300 bg-brand-50/20 shadow-2xs dark:border-brand-700 dark:bg-brand-950/20"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-100 dark:bg-surface-800">
                <img
                  src={lf.previewUrl}
                  alt={lf.file.name}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute top-1 left-1 rounded bg-brand-600/90 px-1 py-0.5 text-3xs font-semibold text-white">
                  Yeni
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setSelectedImage({ url: lf.previewUrl, title: lf.file.name })}
                    className="rounded-full bg-white/90 p-1.5 text-surface-800 shadow-sm transition hover:bg-white hover:scale-110"
                    title="Büyüt"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {onRemoveLocalFile && (
                    <button
                      type="button"
                      onClick={() => onRemoveLocalFile(lf.id)}
                      className="rounded-full bg-danger-500/90 p-1.5 text-white shadow-sm transition hover:bg-danger-600 hover:scale-110"
                      title="Kaldır"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-2">
                <p className="truncate text-xs font-medium text-surface-800 dark:text-surface-200" title={lf.file.name}>
                  {lf.file.name}
                </p>
                <div className="mt-0.5 flex items-center justify-between text-2xs text-surface-400">
                  <span>{(lf.file.size / 1024).toFixed(0)} KB</span>
                  <span className="text-brand-600 dark:text-brand-400">Taslak</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedImage(null)}
          title={selectedImage.title}
          size="xl"
        >
          <div className="flex flex-col items-center justify-center p-2">
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="max-h-[75vh] w-auto rounded-lg object-contain shadow-md"
            />
            <div className="mt-3 flex items-center justify-between w-full text-xs text-surface-500">
              <span className="truncate">{selectedImage.title}</span>
              <a
                href={selectedImage.url}
                download={selectedImage.title}
                className="inline-flex items-center gap-1 rounded bg-brand-50 px-2.5 py-1 font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-300"
              >
                <Download className="h-3.5 w-3.5" /> İndir
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
