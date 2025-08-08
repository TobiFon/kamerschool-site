"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { format, formatDistanceToNow } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  HardDriveDownload,
  Download,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  FileArchive,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  fetchBulkReportJobs,
  fetchBulkReportJobById,
  fetchBulkResultsData,
  BulkReportCardJob,
  BulkResultsData,
} from "@/queries/results";
import { exportReportCardToPDF } from "@/lib/exportReportCard";
import { StudentDetailedResultsResponse } from "@/types/students";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EnhancedJobRow: React.FC<{ initialJob: BulkReportCardJob }> = ({
  initialJob,
}) => {
  const t = useTranslations("ExportsPage");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const { data: job } = useQuery<BulkReportCardJob>({
    queryKey: ["bulkReportJob", initialJob.id],
    queryFn: () => fetchBulkReportJobById(initialJob.id),
    initialData: initialJob,
    refetchInterval: (data) =>
      data?.status === "PROCESSING" || data?.status === "PENDING"
        ? 5000
        : false,
    staleTime: 5000,
  });

  const handleDownloadAndGenerate = async () => {
    if (!job?.result_file_url) {
      toast.error(t("errors.noFileUrl"));
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    const toastId = toast.loading(t("toasts.downloadingData"), {
      description: t("toasts.downloadingDataDesc"),
    });

    try {
      const bulkData: BulkResultsData = await fetchBulkResultsData(
        job.result_file_url
      );

      const studentsToProcess = bulkData.students.filter((s) => s.results);
      if (studentsToProcess.length === 0) {
        toast.info(t("toasts.noStudentsWithResults"), { id: toastId });
        setIsGenerating(false);
        return;
      }

      toast.loading(t("toasts.generatingPdfs"), {
        id: toastId,
        description: `0 / ${studentsToProcess.length}`,
      });

      const zip = new JSZip();

      for (let i = 0; i < studentsToProcess.length; i++) {
        const studentResult = studentsToProcess[i];
        const filename = `${studentResult.student_info.full_name.replace(/\s+/g, "_")}_${studentResult.student_info.matricule}.pdf`;

        const pdfBlob = await exportReportCardToPDF(
          t,
          studentResult,
          studentResult.student_info,
          filename,
          bulkData.school_info,
          10
        );

        zip.file(filename, pdfBlob, { binary: true });

        const newProgress = ((i + 1) / studentsToProcess.length) * 100;
        setProgress(newProgress);
        toast.loading(t("toasts.generatingPdfs"), {
          id: toastId,
          description: `${i + 1} / ${studentsToProcess.length}`,
        });
      }

      toast.loading(t("toasts.creatingZip"), {
        id: toastId,
        description: t("toasts.creatingZipDesc"),
      });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(
        zipBlob,
        `report_cards_${job.school_class_name.replace(/\s+/g, "_")}.zip`
      );

      toast.success(t("toasts.downloadComplete"), {
        id: toastId,
        duration: 5000,
      });
    } catch (error) {
      console.error("Failed to generate zip:", error);
      toast.error(t("errors.generationFailed"), {
        id: toastId,
        description: (error as Error).message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const StatusIcon = () => {
    switch (job.status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "PROCESSING":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-gray-400" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-start space-x-4 p-4 border-b dark:border-gray-700">
      <div className="mt-1">
        <StatusIcon />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <p
              className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate"
              title={job.school_class_name}
            >
              {job.school_class_name}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              {t("requestedBy", { name: job.requested_by_name })}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            {isGenerating ? (
              <div className="flex items-center gap-2 justify-end text-sm">
                <span className="font-semibold tabular-nums">
                  {Math.round(progress)}%
                </span>
                <Progress value={progress} className="w-16 h-1.5" />
              </div>
            ) : job.status === "COMPLETED" ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={handleDownloadAndGenerate}
              >
                <Download className="h-4 w-4 mr-2" />
                {t("downloadButton")}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {formatDistanceToNow(new Date(job.created_at), {
                  addSuffix: true,
                  locale: locale === "fr" ? fr : enUS,
                })}
              </p>
            )}
          </div>
        </div>

        {job.status === "FAILED" && (
          <div className="mt-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded-md border border-red-200 dark:border-red-800">
            <strong>{t("errors.jobFailed")}:</strong> {job.error_message}
          </div>
        )}
      </div>
    </div>
  );
};

const ExportsSheetContent = () => {
  const t = useTranslations("ExportsPage");
  const {
    data: jobs,
    isLoading,
    isError,
    error,
  } = useQuery<BulkReportCardJob[], Error>({
    queryKey: ["bulkReportJobs"],
    queryFn: fetchBulkReportJobs,
  });

  return (
    <div>
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <HardDriveDownload className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">{t("title")}</h3>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        {/* The close button is part of the SheetContent from shadcn, so we don't add it here */}
      </div>
      <div className="h-[calc(100vh-80px)] overflow-y-auto">
        {isLoading && (
          <div className="p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300 dark:text-gray-600" />
          </div>
        )}
        {isError && (
          <div className="p-10 text-center text-red-500 flex flex-col items-center gap-3">
            <AlertCircle className="h-8 w-8" />
            <p className="font-semibold">{t("errors.fetchError")}</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        )}
        {jobs && jobs.length > 0 && (
          <div>
            {jobs.map((job) => (
              <EnhancedJobRow key={job.id} initialJob={job} />
            ))}
          </div>
        )}
        {jobs && jobs.length === 0 && (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center gap-4 mt-8">
            <FileArchive className="h-16 w-16 text-gray-300 dark:text-gray-700" />
            <p className="font-medium">{t("noJobsTitle")}</p>
            <p className="text-sm max-w-xs mx-auto">{t("noJobsDescription")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportsSheetContent;
