"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, Building } from "lucide-react";

export interface SchoolMetrics {
  school_name: string;
  class_metrics?: {
    total_classes: number;
    average_students_per_class: number;
  };
  student_metrics?: {
    total_students: number;
    male_students: number;
    female_students: number;
  };
  teacher_metrics?: {
    total_teachers: number;
  };
  education_system_breakdown?: {
    [key: string]: {
      classes: number;
      students: number;
    };
  };
}

export interface MetricsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  percentage?: number;
  details: Array<{
    label: string;
    value: number | string;
    color?: string;
  }>;
  borderColor?: string;
}

const MetricCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  percentage,
  details,
  borderColor,
}) => {
  return (
    <Card
      className={`overflow-hidden bg-white border border-gray-100 shadow hover:shadow-md transition-shadow duration-300 h-full ${
        borderColor ? `border-t-4 ${borderColor}` : ""
      }`}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center mb-4">
          <div className={`p-3 rounded-lg ${iconBgColor} ${iconColor} mb-3`}>
            {icon}
          </div>
          <h3 className="text-sm font-medium text-gray-500 text-center">
            {title}
          </h3>
          <p className="text-4xl font-bold text-gray-900 mt-2">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        <div className="h-px w-full bg-gray-100 my-3"></div>
        {details && details.length > 0 && (
          <div className="space-y-3">
            {details.map((detail, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{detail.label}</span>
                <span
                  className={`text-sm font-medium ${
                    detail.color ? detail.color : "text-gray-700"
                  }`}
                >
                  {typeof detail.value === "number"
                    ? detail.value.toLocaleString()
                    : detail.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function EnhancedMetricsGrid({ metrics }: { metrics?: SchoolMetrics }) {
  const t = useTranslations("metrics");

  // early return if no metrics at all
  if (!metrics) {
    return (
      <div className="text-center text-gray-500">
        {t("noDataAvailable", { value: "no data available yet" })}
      </div>
    );
  }

  // use defaults if nested properties are missing
  const studentMetrics = metrics.student_metrics || {
    total_students: 0,
    male_students: 0,
    female_students: 0,
  };

  const teacherMetrics = metrics.teacher_metrics || {
    total_teachers: 0,
  };

  const classMetrics = metrics.class_metrics || {
    total_classes: 0,
    average_students_per_class: 0,
  };

  const educationBreakdown = metrics.education_system_breakdown || {};

  // Get only the education systems that exist for this school
  const availableEducationSystems = Object.keys(educationBreakdown);

  const malePercentage =
    studentMetrics.total_students > 0
      ? Math.round(
          (studentMetrics.male_students / studentMetrics.total_students) * 100
        )
      : 0;
  const femalePercentage =
    studentMetrics.total_students > 0
      ? Math.round(
          (studentMetrics.female_students / studentMetrics.total_students) * 100
        )
      : 0;

  const studentTeacherRatio =
    teacherMetrics.total_teachers > 0
      ? Math.round(
          studentMetrics.total_students / teacherMetrics.total_teachers
        )
      : 0;

  // Generate education system detail items based on available systems
  const generateEducationSystemDetails = () => {
    return availableEducationSystems
      .map((system) => ({
        label: t(system.replace("_", "")), // Convert keys to match translation format
        value: educationBreakdown[system]?.students || t("nA", "n/a"),
        color: "text-emerald-600",
      }))
      .slice(0, 4); // Limit to 4 to avoid overcrowding
  };

  // If there are no education systems available, provide a default
  const educationSystemDetails =
    availableEducationSystems.length > 0
      ? generateEducationSystemDetails()
      : [
          {
            label: t("noSystems"),
            value: t("nA", "n/a"),
            color: "text-emerald-600",
          },
        ];

  const metricCards: MetricsCardProps[] = [
    {
      title: t("totalStudents"),
      value: studentMetrics.total_students,
      icon: <Users className="h-5 w-5" />,
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      details: [
        {
          label: t("male"),
          value: `${studentMetrics.male_students} (${malePercentage}%)`,
          color: "text-blue-600",
        },
        {
          label: t("female"),
          value: `${studentMetrics.female_students} (${femalePercentage}%)`,
          color: "text-pink-600",
        },
      ],
      borderColor: "border-blue-500",
    },
    {
      title: t("totalTeachers"),
      value: teacherMetrics.total_teachers,
      icon: <GraduationCap className="h-5 w-5" />,
      iconBgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      details: [
        {
          label: t("studentTeacherRatio"),
          value:
            teacherMetrics.total_teachers > 0
              ? `${studentTeacherRatio}:1`
              : t("nA"),
          color: "text-purple-600",
        },
        {
          label: t("avgPerClass"),
          value:
            classMetrics.total_classes > 0
              ? (
                  teacherMetrics.total_teachers / classMetrics.total_classes
                ).toFixed(1)
              : t("nA"),
          color: "text-purple-600",
        },
      ],
      borderColor: "border-purple-500",
    },
    {
      title: t("totalClasses"),
      value: classMetrics.total_classes,
      icon: <BookOpen className="h-5 w-5" />,
      iconBgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      details: [
        {
          label: t("avgClassSize"),
          value:
            classMetrics.total_classes > 0
              ? classMetrics.average_students_per_class.toFixed(1)
              : t("nA"),
          color: "text-orange-600",
        },
        {
          label: t("totalCapacity"),
          value:
            classMetrics.total_classes > 0
              ? Math.round(
                  classMetrics.total_classes *
                    classMetrics.average_students_per_class
                )
              : t("nA"),
          color: "text-orange-600",
        },
      ],
      borderColor: "border-orange-500",
    },
    {
      title: t("educationSystems"),
      value: availableEducationSystems.length || t("nA", "n/a"),
      icon: <Building className="h-5 w-5" />,
      iconBgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
      details: educationSystemDetails,
      borderColor: "border-emerald-500",
    },
  ];

  return (
    <div className="w-full">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, index) => (
          <MetricCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconBgColor={card.iconBgColor}
            iconColor={card.iconColor}
            percentage={card.percentage}
            details={card.details}
          />
        ))}
      </div>
    </div>
  );
}

export default EnhancedMetricsGrid;
