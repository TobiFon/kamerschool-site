import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";

interface SubjectConfigFormProps {
  weight: number;
  setWeight: (value: number) => void;
  baseScore: number;
  setBaseScore: (value: number) => void;
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  exists: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: any;
}

const SubjectConfigForm: React.FC<SubjectConfigFormProps> = ({
  weight,
  setWeight,
  baseScore,
  setBaseScore,
  isActive,
  setIsActive,
  exists,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const t = useTranslations("Results");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("sequenceSubjectConfiguration")}</CardTitle>
        <CardDescription>{t("configureSubjectForSequence")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="weight">{t("weight")}</Label>
          <Input
            id="weight"
            type="number"
            min="0"
            max="100"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          />
          <p className="text-sm text-gray-500">{t("weightDescription")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="baseScore">{t("baseScore")}</Label>
          <Input
            id="baseScore"
            type="number"
            min="1"
            value={baseScore}
            onChange={(e) => setBaseScore(Number(e.target.value))}
            disabled={exists}
          />
          <p className="text-sm text-gray-500">
            {exists ? t("baseScoreCannotBeChanged") : t("baseScoreDescription")}
          </p>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-0.5">
            <Label htmlFor="active">{t("active")}</Label>
            <p className="text-sm text-gray-500">{t("activeDescription")}</p>
          </div>
          <Switch
            id="active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        {error && (
          <p className="text-sm text-red-500">
            {t("errorSavingConfiguration")}
          </p>
        )}
        <Button onClick={onSubmit} disabled={isSubmitting} className="ml-auto">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {exists ? t("updateConfiguration") : t("saveConfiguration")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubjectConfigForm;
