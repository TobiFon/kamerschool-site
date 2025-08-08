"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { fetchSchoolById, updateSchool } from "@/queries/admin";
import { School } from "@/types/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building, Terminal } from "lucide-react";
import ProfileTab from "./_components/ProfileTab";
import { useState } from "react";
import SchoolFormModal from "../../_components/SchoolFormModal";
import InvoicesTab from "./_components/InvoiceTab";

// Header component remains the same
const SchoolDetailHeader = ({ school }: { school: School | undefined }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard/schools">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to schools</span>
          </Button>
        </Link>
        {school ? (
          <>
            <Avatar className="h-12 w-12">
              <AvatarImage src={school.logo} alt={school.name} />
              <AvatarFallback>
                <Building className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{school.name}</h1>
              <p className="text-sm text-muted-foreground">
                {school.school_id} · {school.city}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SchoolDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const schoolId = Number(params.schoolId);
  const queryClient = useQueryClient();
  const t = useTranslations("AdminSchoolManagement");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    data: school,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["schoolDetails", schoolId],
    queryFn: () => fetchSchoolById(schoolId),
    enabled: !!schoolId,
  });

  const updateMutation = useMutation({
    mutationFn: updateSchool,
    onSuccess: (updatedSchool) => {
      toast.success(t("toast.updateSuccess"));
      // Update the query cache for this specific school to instantly reflect changes
      queryClient.setQueryData(["schoolDetails", schoolId], updatedSchool);
      // Invalidate the list view to show changes there too
      queryClient.invalidateQueries({ queryKey: ["adminSchools"] });
      setIsEditModalOpen(false); // Close the modal on success
    },
    onError: (err: Error) => {
      toast.error(t("toast.operationError"), { description: err.message });
    },
  });

  const handleFormSubmit = (formData: FormData) => {
    updateMutation.mutate({ id: schoolId, data: formData });
  };

  const currentTab = searchParams.get("tab") || "profile";

  const onTabChange = (value: string) => {
    // Use replace to avoid polluting browser history with tab changes
    router.replace(`/admin/dashboard/schools/${schoolId}?tab=${value}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SchoolDetailHeader school={undefined} />
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !school) {
    return (
      <div className="space-y-6">
        <SchoolDetailHeader school={undefined} />
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Fetching School</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "The school could not be found or an unknown error occurred."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <SchoolDetailHeader school={school} />
        <Tabs value={currentTab} onValueChange={onTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="profile">At-a-Glance</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-4">
            <ProfileTab
              school={school}
              onEditClick={() => setIsEditModalOpen(true)}
            />
          </TabsContent>
          <TabsContent value="invoices" className="mt-4">
            <InvoicesTab schoolId={schoolId} />
          </TabsContent>
        </Tabs>
      </div>

      {isEditModalOpen && (
        <SchoolFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          school={school}
          onSubmit={handleFormSubmit}
          isSubmitting={updateMutation.isLoading}
        />
      )}
    </>
  );
}
