"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { managePromotionRules } from "@/queries/promotions";

const PromotionRules = ({ schoolId }) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const { data: educationSystems, isLoading: systemsLoading } = useQuery({
    queryKey: ["educationSystems", schoolId],
    queryFn: () => fetchEducationSystems(schoolId),
  });

  const { data: promotionRules, isLoading: rulesLoading } = useQuery({
    queryKey: ["promotionRules", schoolId],
    queryFn: () => managePromotionRules(schoolId),
  });

  const createRuleMutation = useMutation({
    mutationFn: (ruleData) => managePromotionRules(schoolId, ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries(["promotionRules", schoolId]);
      toast({ title: "Success", description: "Promotion rule created." });
      setIsDialogOpen(false);
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to create rule.",
        variant: "destructive",
      }),
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, ruleData }) => updatePromotionRule(ruleId, ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries(["promotionRules", schoolId]);
      toast({ title: "Success", description: "Promotion rule updated." });
      setIsDialogOpen(false);
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to update rule.",
        variant: "destructive",
      }),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId) => deletePromotionRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries(["promotionRules", schoolId]);
      toast({ title: "Success", description: "Promotion rule deleted." });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to delete rule.",
        variant: "destructive",
      }),
  });

  const handleAddRule = () => {
    setEditingRule(null);
    setIsDialogOpen(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleDeleteRule = (ruleId) => {
    if (window.confirm("Are you sure you want to delete this rule?")) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  if (systemsLoading || rulesLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Promotion Rules</CardTitle>
        <CardDescription>
          Manage promotion criteria for your school.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mb-4" onClick={handleAddRule}>
              Add New Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Edit Rule" : "Add New Rule"}
              </DialogTitle>
            </DialogHeader>
            {/* Placeholder for RuleForm component */}
            <div>
              Form goes here (educationSystems: {educationSystems.length})
            </div>
          </DialogContent>
        </Dialog>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Education System</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Stream</TableHead>
              <TableHead>Min Average</TableHead>
              <TableHead>Min Subjects</TableHead>
              <TableHead>Conditional Min</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotionRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.education_system.name}</TableCell>
                <TableCell>{rule.level}</TableCell>
                <TableCell>{rule.stream || "N/A"}</TableCell>
                <TableCell>{rule.min_average_for_promotion}</TableCell>
                <TableCell>{rule.min_subjects_passed || "N/A"}</TableCell>
                <TableCell>{rule.conditional_min_average}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PromotionRules;
