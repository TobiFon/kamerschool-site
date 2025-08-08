"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { EducationSystem, Subject } from "../../../../../../queries/admin";

const SYSTEM_CODE_MAP: { [key: string]: string } = {
  en_gen: "ENGEN",
  en_tech: "ENTECH",
  fr_gen: "FRGEN",
  fr_tech: "FRTECH",
};

const LEVEL_CODE_MAP: { [key: string]: string } = {
  secondary: "SEC",
  high_school: "HGH",
};

const baseSchema = z.object({
  name: z.string().min(2, { message: "Subject name is required." }),
  abbreviation: z.string().optional(),
  description: z.string().optional(),
  education_system_id: z.coerce
    .number()
    .positive({ message: "Please select an education system." }),
  school_level: z.enum(["secondary", "high_school"], {
    required_error: "Please select a school level.",
  }),
  code: z.string().min(1, "Code is required."),
});

type SubjectFormData = z.infer<typeof baseSchema>;

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  educationSystems: EducationSystem[];
  onSubmit: (data: SubjectFormData) => void;
  isSubmitting: boolean;
}

export default function SubjectFormModal({
  isOpen,
  onClose,
  subject,
  educationSystems,
  onSubmit,
  isSubmitting,
}: SubjectFormModalProps) {
  const t = useTranslations("AdminSubjectManagement.modal");

  const systemIdToCodeMap = useMemo(() => {
    return new Map(educationSystems.map((sys) => [sys.id, sys.code]));
  }, [educationSystems]);

  const refinedSchema = baseSchema.superRefine((data, ctx) => {
    const systemCode = systemIdToCodeMap.get(data.education_system_id);
    if (!systemCode || !data.school_level) return;

    const systemPrefix = SYSTEM_CODE_MAP[systemCode];
    const levelPrefix = LEVEL_CODE_MAP[data.school_level];

    const expectedPrefix = `${systemPrefix}_${levelPrefix}_`;

    if (!data.code.startsWith(expectedPrefix)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["code"],
        message: `Code must start with the prefix '${expectedPrefix}'`,
      });
      return;
    }

    const numericPart = data.code.substring(expectedPrefix.length);
    if (!/^\d{4,}/.test(numericPart)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["code"],
        message: "The part after the prefix must be at least 4 digits.",
      });
    }
  });

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(refinedSchema),
    defaultValues: {
      name: "",
      code: "",
      abbreviation: "",
      description: "",
      education_system_id: undefined,
      school_level: "secondary",
    },
  });

  const watchedSystemId = form.watch("education_system_id");
  const watchedLevel = form.watch("school_level");

  useEffect(() => {
    if (isOpen) {
      if (subject) {
        // Populate form when editing an existing subject
        form.reset({
          name: subject.name ?? "",
          code: subject.code ?? "",
          abbreviation: subject.abbreviation ?? "",
          description: subject.description ?? "",
          education_system_id: subject.education_system?.id,
          school_level: subject.school_level ?? "secondary",
        });
      } else {
        // Reset to a clean slate when creating a new subject
        form.reset({
          name: "",
          code: "",
          abbreviation: "",
          description: "",
          education_system_id: undefined,
          school_level: "secondary",
        });
      }
    }
  }, [subject, isOpen, form]);

  useEffect(() => {
    // Auto-generate prefix only for NEW subjects when dependencies are ready
    if (!subject && watchedSystemId && watchedLevel) {
      const systemCode = systemIdToCodeMap.get(watchedSystemId);
      if (systemCode) {
        const systemPrefix = SYSTEM_CODE_MAP[systemCode];
        const levelPrefix = LEVEL_CODE_MAP[watchedLevel];
        const fullPrefix = `${systemPrefix}_${levelPrefix}_`;

        const currentCode = form.getValues("code");
        // Only set the value if it's not already correctly prefixed
        if (!currentCode.startsWith(fullPrefix)) {
          form.setValue("code", fullPrefix, { shouldValidate: true });
        }
      }
    }
  }, [watchedSystemId, watchedLevel, subject, form, systemIdToCodeMap]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {subject ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="education_system_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("systemLabel")}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value ? String(field.value) : ""}
                      disabled={!!subject}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("systemPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {educationSystems.map((system) => (
                          <SelectItem key={system.id} value={String(system.id)}>
                            {system.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="school_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("levelLabel")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!!subject}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("levelPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="high_school">High School</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nameLabel")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Advanced Robotics" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("codeLabel")}</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly={!!subject} />
                  </FormControl>
                  {!subject && (
                    <FormDescription>{t("codeDescription")}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="abbreviation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("abbreviationLabel")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., ARob" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("descriptionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {subject ? t("saveChanges") : t("createSubject")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
