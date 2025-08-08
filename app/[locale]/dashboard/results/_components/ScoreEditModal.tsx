import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, Save, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  fetchSequenceClassSubjectConfig,
  submitSequenceClassSubjectConfig,
  submitBulkSubjectScores,
} from "@/queries/results";
import SubjectConfigForm from "./_SequenceResults/SubjectConfigForm";
import CsvImportExport from "./_SequenceResults/CsvImportExport";
import StudentScoresInput from "./_SequenceResults/StudentsScoreInput";

interface ScoresEditModalProps {
  sequenceId: number;
  classId: number;
  classSubjectId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentResults: any[];
}

interface StudentScore {
  student_subject_id: number;
  student_id: number;
  student_name: string;
  score: number | null;
  is_absent: boolean;
  error?: string;
}

interface CacheData {
  timestamp: number;
  studentIds: string;
  scores: StudentScore[];
}

// Constants for validation
const MAX_SCORE = 20;
const MIN_SCORE = 0;
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

const ScoresEditModal: React.FC<ScoresEditModalProps> = ({
  sequenceId,
  classId,
  classSubjectId,
  isOpen,
  onClose,
  onSuccess,
  studentResults,
}) => {
  const t = useTranslations("Results");
  const queryClient = useQueryClient();

  const [weight, setWeight] = useState<number>(50);
  const [baseScore, setBaseScore] = useState<number>(20);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState("setup");
  const [studentScores, setStudentScores] = useState<StudentScore[]>([]);
  const [hasValidationErrors, setHasValidationErrors] =
    useState<boolean>(false);
  const [isDataChanged, setIsDataChanged] = useState<boolean>(false);
  const [originalData, setOriginalData] = useState<any>(null);

  // Generate cache key with student IDs hash for better cache invalidation
  const generateCacheKey = () => {
    if (!studentResults?.length) return null;
    const studentIds = studentResults
      .map((r) => r.student_id)
      .sort()
      .join(",");
    const studentIdsHash = btoa(studentIds).slice(0, 8);
    return `scoresEditModal_${sequenceId}_${classSubjectId}_${studentIdsHash}`;
  };

  const storageKey = generateCacheKey();

  const {
    data: configData,
    isLoading: isLoadingConfig,
    error: configError,
    refetch,
  } = useQuery({
    queryKey: ["sequenceClassSubjectConfig", sequenceId, classSubjectId],
    queryFn: () => fetchSequenceClassSubjectConfig(sequenceId, classSubjectId),
    enabled: isOpen && !!sequenceId && !!classSubjectId,
  });

  const {
    mutate: submitConfig,
    isPending: isSubmittingConfig,
    error: submitConfigError,
  } = useMutation({
    mutationFn: submitSequenceClassSubjectConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sequenceClassSubjectConfig"],
      });
      if (!configData?.exists) setActiveTab("scores");
      toast.success(t("configurationSaved"), {
        description: t("configurationSavedDescription"),
      });
      setIsDataChanged(false);
    },
  });

  const {
    mutate: submitScores,
    isPending: isSubmittingScores,
    error: submitScoresError,
  } = useMutation({
    mutationFn: (scores: any[]) =>
      submitBulkSubjectScores(sequenceId, classId, classSubjectId, scores),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjectSequenceScores"] });
      // Clear cache on successful submission
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
      // Also clear any old cache entries for this subject
      clearOldCacheEntries();
      toast.success(t("scoresSaved"), {
        description: t("scoresSavedDescription"),
      });
      onSuccess();
      onClose();
      setIsDataChanged(false);
    },
  });

  // Clear old cache entries for this subject to prevent storage bloat
  const clearOldCacheEntries = () => {
    const prefix = `scoresEditModal_${sequenceId}_${classSubjectId}_`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && key !== storageKey) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  };

  // Check if cached data is valid and not expired
  const isValidCache = (cacheData: CacheData): boolean => {
    if (!cacheData || !cacheData.timestamp || !cacheData.scores) {
      return false;
    }

    // Check if cache has expired
    const now = Date.now();
    if (now - cacheData.timestamp > CACHE_EXPIRY) {
      return false;
    }

    // Check if student list matches
    const currentStudentIds =
      studentResults
        ?.map((r) => r.student_id)
        .sort()
        .join(",") || "";
    if (cacheData.studentIds !== currentStudentIds) {
      return false;
    }

    return true;
  };

  // Load and validate cached scores
  useEffect(() => {
    if (isOpen && studentResults?.length && storageKey) {
      const storedData = localStorage.getItem(storageKey);

      if (storedData) {
        try {
          const cacheData: CacheData = JSON.parse(storedData);

          if (isValidCache(cacheData)) {
            // Use valid cached data
            setStudentScores(cacheData.scores);
            setOriginalData(JSON.parse(JSON.stringify(cacheData.scores)));
            validateScores(cacheData.scores);
            return;
          } else {
            // Remove invalid/expired cache
            localStorage.removeItem(storageKey);
          }
        } catch (error) {
          console.error("Error parsing stored scores:", error);
          localStorage.removeItem(storageKey);
        }
      }

      // Initialize with fresh data if no valid cache
      initializeStudentScores();

      // Clear old cache entries when modal opens
      clearOldCacheEntries();
    }
  }, [isOpen, studentResults, storageKey]);

  // Save to localStorage when scores change (with improved caching)
  useEffect(() => {
    if (isOpen && studentScores.length > 0 && storageKey) {
      const currentStudentIds =
        studentResults
          ?.map((r) => r.student_id)
          .sort()
          .join(",") || "";

      const cacheData: CacheData = {
        timestamp: Date.now(),
        studentIds: currentStudentIds,
        scores: studentScores,
      };

      localStorage.setItem(storageKey, JSON.stringify(cacheData));

      // Don't call validateScores here, which would trigger state updates
      const hasErrors = checkForValidationErrors(studentScores);
      setHasValidationErrors(hasErrors);

      // Check if data has changed from original
      if (
        originalData &&
        JSON.stringify(originalData) !== JSON.stringify(studentScores)
      ) {
        setIsDataChanged(true);
      }
    }
  }, [studentScores, isOpen, storageKey, originalData, studentResults]);

  const checkForValidationErrors = (scores: StudentScore[]): boolean => {
    return scores.some((score) => {
      if (!score.is_absent && score.score !== null) {
        // Check if score is within valid range
        if (score.score < MIN_SCORE || score.score > MAX_SCORE) {
          return true;
        }
        // Check if score is a valid number
        if (isNaN(score.score)) {
          return true;
        }
      }
      return false;
    });
  };

  // Set up form based on config data
  useEffect(() => {
    if (configData) {
      setWeight(
        configData.exists ? configData.sequence_class_subject.weight : 50
      );
      setBaseScore(
        configData.exists ? configData.sequence_class_subject.base_score : 20
      );
      setIsActive(
        configData.exists ? configData.sequence_class_subject.is_active : true
      );
      if (configData.exists && studentResults?.length) setActiveTab("scores");
    }
  }, [configData, studentResults]);

  // Track if config data has changed
  useEffect(() => {
    if (configData?.exists) {
      const originalWeight = configData.sequence_class_subject.weight;
      const originalBaseScore = configData.sequence_class_subject.base_score;
      const originalIsActive = configData.sequence_class_subject.is_active;

      setIsDataChanged(
        weight !== originalWeight ||
          baseScore !== originalBaseScore ||
          isActive !== originalIsActive
      );
    }
  }, [weight, baseScore, isActive, configData]);

  // Initialize student scores
  const initializeStudentScores = () => {
    if (studentResults?.length) {
      const initialScores = studentResults.map((result: any) => ({
        student_subject_id: result.student_subject_id,
        student_id: result.student_id,
        student_name: result.student_name,
        score: result.original_score,
        is_absent: result.is_absent,
      }));

      setStudentScores(initialScores);
      setOriginalData(JSON.parse(JSON.stringify(initialScores)));
      validateScores(initialScores);
    }
  };

  const validateScores = (scores: StudentScore[]) => {
    let hasErrors = false;

    const validatedScores = scores.map((score) => {
      const updatedScore = { ...score };

      if (!score.is_absent && score.score !== null) {
        // Check if score is within valid range
        if (score.score < MIN_SCORE || score.score > MAX_SCORE) {
          updatedScore.error = t("scoreOutOfRange", {
            min: MIN_SCORE,
            max: MAX_SCORE,
          });
          hasErrors = true;
        } else if (isNaN(score.score)) {
          // Check if score is a valid number
          updatedScore.error = t("invalidScore");
          hasErrors = true;
        } else {
          delete updatedScore.error;
        }
      } else {
        delete updatedScore.error;
      }

      return updatedScore;
    });

    setHasValidationErrors(hasErrors);

    // Return the validated scores instead of updating state directly
    return { isValid: !hasErrors, validatedScores };
  };

  const handleConfigSubmit = () => {
    if (weight < 0 || weight > 100) {
      toast.error(t("invalidWeight"), {
        description: t("weightMustBeBetween", { min: 0, max: 100 }),
      });
      return;
    }

    if (baseScore <= 0) {
      toast.error(t("invalidBaseScore"), {
        description: t("baseScoreMustBePositive"),
      });
      return;
    }

    submitConfig({ sequenceId, classSubjectId, weight, baseScore, isActive });
  };

  const handleScoreChange = (studentSubjectId: number, value: string) => {
    setStudentScores((prev) => {
      const newScores = prev.map((item) => {
        if (item.student_subject_id === studentSubjectId) {
          const newScore = value === "" ? null : parseFloat(value);
          const updatedItem = {
            ...item,
            score: newScore,
            is_absent: false,
          };

          // Validate the new score
          if (newScore !== null) {
            if (newScore < MIN_SCORE || newScore > MAX_SCORE) {
              updatedItem.error = t("scoreOutOfRange", {
                min: MIN_SCORE,
                max: MAX_SCORE,
                score: newScore,
              });
            } else {
              delete updatedItem.error;
            }
          } else {
            delete updatedItem.error;
          }

          return updatedItem;
        }
        return item;
      });

      return newScores;
    });
  };

  const handleAbsenceToggle = (studentSubjectId: number, isAbsent: boolean) => {
    setStudentScores((prev) =>
      prev.map((item) => {
        if (item.student_subject_id === studentSubjectId) {
          const updatedItem = {
            ...item,
            is_absent: isAbsent,
            score: isAbsent ? null : item.score,
          };

          // Clear errors when marked as absent
          if (isAbsent) {
            delete updatedItem.error;
          } else if (updatedItem.score !== null) {
            // Re-validate the score if not absent
            if (
              updatedItem.score < MIN_SCORE ||
              updatedItem.score > MAX_SCORE
            ) {
              updatedItem.error = t("scoreOutOfRange", {
                min: MIN_SCORE,
                max: MAX_SCORE,
              });
            }
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleSubmitScores = () => {
    // Check for any empty scores that aren't marked as absent
    const incompleteScores = studentScores.filter(
      (score) => score.score === null && !score.is_absent
    );

    if (incompleteScores.length > 0) {
      const confirm = window.confirm(
        t("incompleteScoresConfirmation", { count: incompleteScores.length })
      );
      if (!confirm) return;
    }

    // Final validation before submission
    const validation = validateScores(studentScores);
    if (!validation.isValid) {
      toast.error(t("validationErrors"), {
        description: t("pleaseFixErrors"),
      });
      return;
    }

    const scoresToSubmit = studentScores.map((item) => ({
      student_subject_id: item.student_subject_id,
      score: item.score,
      is_absent: item.is_absent,
    }));

    submitScores(scoresToSubmit);
  };

  const normalizeAbsenceValue = (value: string): boolean => {
    // Allow variations of "yes" to be treated as true
    if (typeof value === "string") {
      const normalizedValue = value.trim().toLowerCase();
      return (
        normalizedValue === "yes" ||
        normalizedValue === "true" ||
        normalizedValue === "y"
      );
    }
    return Boolean(value);
  };

  const handleImport = (
    importedScores: Array<{
      studentId: number;
      score: number | null;
      isAbsent: boolean | string;
    }>
  ) => {
    // Validate student IDs before importing
    const validStudentIds = new Set(studentScores.map((s) => s.student_id));
    const invalidEntries = importedScores.filter(
      (imp) => !validStudentIds.has(imp.studentId)
    );

    if (invalidEntries.length > 0) {
      toast.warning(t("importWarning"), {
        description: t("invalidStudentIds", { count: invalidEntries.length }),
      });
    }

    setStudentScores((prev) =>
      prev.map((student) => {
        const importedScore = importedScores.find(
          (imp) => imp.studentId === student.student_id
        );

        if (importedScore) {
          const isAbsent =
            typeof importedScore.isAbsent === "string"
              ? normalizeAbsenceValue(importedScore.isAbsent)
              : importedScore.isAbsent;

          const newScore = isAbsent ? null : importedScore.score;

          const updatedStudent = {
            ...student,
            score: newScore,
            is_absent: isAbsent,
          };

          // Validate the imported score
          if (!isAbsent && newScore !== null) {
            if (newScore < MIN_SCORE || newScore > MAX_SCORE) {
              updatedStudent.error = t("scoreOutOfRange", {
                min: MIN_SCORE,
                max: MAX_SCORE,
              });
            } else {
              delete updatedStudent.error;
            }
          } else {
            delete updatedStudent.error;
          }

          return updatedStudent;
        }
        return student;
      })
    );
  };

  const getFileName = () => {
    if (!configData) return "student-scores.csv";
    const subjectName = configData.subject_name || "subject";
    const className = configData.class_name || "class";
    const safeSubjectName = subjectName
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase();
    const safeClassName = className.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    return `scores-${safeClassName}-${safeSubjectName}-${sequenceId}.csv`;
  };

  // Handle unsaved changes when closing
  const handleClose = () => {
    if (isDataChanged) {
      const confirm = window.confirm(t("unsavedChangesConfirmation"));
      if (!confirm) return;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">
                {configData?.exists
                  ? t("editSubjectScores")
                  : t("recordNewSubjectScores")}
              </DialogTitle>
              <div className="space-y-1">
                {configData?.subject_name && (
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 px-3 py-1">
                      {t("subject")}
                    </Badge>
                    <span className="text-lg font-medium">
                      {configData.subject_name}
                    </span>
                  </div>
                )}
                {configData?.class_name && (
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 px-3 py-1">
                      {t("class")}
                    </Badge>
                    <span className="text-lg font-medium">
                      {configData.class_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {hasValidationErrors && (
              <Badge variant="destructive" className="px-3 py-1">
                {t("validationErrors")}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoadingConfig ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>{t("loadingConfiguration")}</p>
          </div>
        ) : configError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("errorLoadingConfiguration")}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => refetch()}
              >
                {t("tryAgain")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs
            defaultValue="setup"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setup">{t("setup")}</TabsTrigger>
              <TabsTrigger value="scores" disabled={!configData?.exists}>
                {t("scores")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="setup" className="space-y-4 py-4">
              <SubjectConfigForm
                weight={weight}
                setWeight={setWeight}
                baseScore={baseScore}
                setBaseScore={setBaseScore}
                isActive={isActive}
                setIsActive={setIsActive}
                exists={configData?.exists || false}
                onSubmit={handleConfigSubmit}
                isSubmitting={isSubmittingConfig}
                error={submitConfigError}
              />
            </TabsContent>
            <TabsContent value="scores">
              <div className="space-y-4 py-4">
                {submitScoresError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t("errorSavingScores")}
                    </AlertDescription>
                  </Alert>
                )}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t("enterScoresOutOf")} {baseScore}
                  </AlertDescription>
                </Alert>
                {hasValidationErrors && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t("validationErrorsExist")}
                    </AlertDescription>
                  </Alert>
                )}
                <CsvImportExport
                  studentScores={studentScores}
                  onImport={handleImport}
                  fileName={getFileName()}
                />
                <StudentScoresInput
                  studentScores={studentScores}
                  baseScore={baseScore}
                  onScoreChange={handleScoreChange}
                  onAbsenceToggle={handleAbsenceToggle}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t mt-4">
          <Button variant="outline" onClick={handleClose}>
            <X className="mr-2 h-4 w-4" /> {t("cancel")}
          </Button>
          {activeTab === "scores" && (
            <Button
              onClick={handleSubmitScores}
              disabled={isSubmittingScores || hasValidationErrors}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmittingScores ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("saveScores")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScoresEditModal;
