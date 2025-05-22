// pages/dashboard/students/[id]/_components/Header.tsx
"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, GraduationCap, UserCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { StudentOverview } from "@/types/students"; // Import the overview type

interface HeaderProps {
  studentData: StudentOverview;
  onEditClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ studentData, onEditClick }) => {
  const t = useTranslations("Students");
  const tStatus = useTranslations("Status"); // For status display potentially

  const getStatusProps = (statusDisplay: string | undefined) => {
    const lowerStatus = statusDisplay?.toLowerCase() ?? "unknown";
    switch (lowerStatus) {
      case "active":
        return {
          variant: "success",
          icon: <UserCheck className="h-3 w-3" />,
          label: tStatus("active"),
        };
      case "inactive":
        return {
          variant: "destructive",
          icon: <UserX className="h-3 w-3" />,
          label: tStatus("inactive"),
        };
      case "graduated":
        return {
          variant: "outline",
          icon: <GraduationCap className="h-3 w-3" />,
          label: tStatus("graduated"),
        };
      default:
        return {
          variant: "secondary",
          icon: null,
          label: statusDisplay || tStatus("unknown"),
        };
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const statusProps = getStatusProps(studentData.status_display);

  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 pb-28 pt-8 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center md:flex-row md:items-start md:justify-between gap-6 pt-8 md:pt-4 relative z-10">
          {/* Left Side: Avatar & Info */}
          <div className="flex flex-col items-center md:flex-row md:items-center gap-5 text-center md:text-left">
            <Avatar className="h-20 w-20 border-4 border-white/50 shadow-xl">
              {studentData.profile_picture ? (
                <AvatarImage
                  src={studentData.profile_picture}
                  alt={studentData.full_name}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-semibold">
                  {getInitials(studentData.first_name, studentData.last_name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="mt-2 md:mt-0">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {studentData.full_name}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-2">
                {studentData.matricule && (
                  <Badge
                    variant="secondary"
                    className="text-xs font-mono bg-white/10 text-white/90 border-none px-2.5 py-1 rounded-full"
                  >
                    ID: {studentData.matricule}
                  </Badge>
                )}
                {studentData.class_name && (
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium bg-white/10 text-white/90 border-none px-2.5 py-1 rounded-full"
                  >
                    {studentData.class_name}
                  </Badge>
                )}
                <Badge
                  variant={statusProps.variant}
                  className={`capitalize text-xs font-medium px-2.5 py-1 rounded-full border-none flex items-center gap-1
                    ${
                      statusProps.variant === "success"
                        ? "bg-green-500/90 text-white"
                        : statusProps.variant === "destructive"
                        ? "bg-red-500/90 text-white"
                        : statusProps.variant === "outline"
                        ? "bg-gray-500/80 text-white"
                        : "bg-white/20 text-white/90"
                    }`}
                >
                  {statusProps.icon}
                  {statusProps.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="flex flex-shrink-0 gap-3 mt-4 md:mt-0">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-blue-700 hover:bg-blue-50 focus:ring-blue-500 shadow-sm"
              onClick={onEditClick}
            >
              <Edit className="mr-1.5 h-4 w-4" />
              {t("editStudent")}
            </Button>
            {/* Add other relevant action buttons here (e.g., Print Report) */}
          </div>
        </div>
      </div>
      {/* Optional: Subtle pattern or wave effect at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
    </div>
  );
};

export default Header;
