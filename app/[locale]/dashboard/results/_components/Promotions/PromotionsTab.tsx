// promotions-tab.jsx
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // shadcn tabs component
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  managePromotionRules,
  createPromotionDecisions,
  initializeEnrollmentWorkflows,
  updateEnrollmentWorkflow,
  performBulkClassAssignments,
} from "@/queries/promotions"; // your provided api functions
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast, ToastContainer } from "@/components/ui/toast";

// this component is the main promotions tab, it expects academicYearId, classId, and schoolId from the parent (results page)
export function PromotionsTab({ academicYearId, classId, schoolId }) {
  // we use sub-tabs for different promotion aspects
  return (
    <Tabs defaultValue="students">
      <TabsList>
        <TabsTrigger value="students">Students</TabsTrigger>
        <TabsTrigger value="rules">Promotion Rules</TabsTrigger>
        <TabsTrigger value="apply">Apply Promotions</TabsTrigger>
        <TabsTrigger value="manual">Manual Override</TabsTrigger>
      </TabsList>
      <TabsContent value="students">
        <StudentsTab academicYearId={academicYearId} classId={classId} />
      </TabsContent>
      <TabsContent value="rules">
        <PromotionRulesTab schoolId={schoolId} />
      </TabsContent>
      <TabsContent value="apply">
        <ApplyPromotionsTab academicYearId={academicYearId} classId={classId} />
      </TabsContent>
      <TabsContent value="manual">
        <ManualOverrideTab academicYearId={academicYearId} classId={classId} />
      </TabsContent>
    </Tabs>
  );
}

// -------------------------------------------------------------------
// students tab: shows list of students with their promotion status and yearly results.
// assume we have an API endpoint that returns promotion decisions for a given academic year and class
async function fetchPromotionDecisions({ queryKey }) {
  // queryKey: ["promotionDecisions", academicYearId, classId]
  const [_key, academicYearId, classId] = queryKey;
  const url = `${process.env.NEXT_PUBLIC_API_URL}/promotions/decisions/?academic_year=${academicYearId}&previous_class=${classId}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch promotion decisions");
  }
  return res.json();
}

function StudentsTab({ academicYearId, classId }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["promotionDecisions", academicYearId, classId],
    queryFn: fetchPromotionDecisions,
  });

  if (isLoading) return <div>loading student data…</div>;
  if (error) return <div>error loading students: {error.message}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Student Promotion Status</h2>
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 border">Student Name</th>
            <th className="p-2 border">Promotion Status</th>
            <th className="p-2 border">Yearly Average</th>
            <th className="p-2 border">Passed Subjects</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((decision) => (
            <tr key={decision.id}>
              <td className="p-2 border">{decision.student.full_name}</td>
              <td className="p-2 border">{decision.promotion_status}</td>
              <td className="p-2 border">{decision.yearly_average || "N/A"}</td>
              <td className="p-2 border">
                {decision.passed_subjects || "N/A"}
              </td>
              <td className="p-2 border">
                {/* a button for manual override per student */}
                <ManualOverrideButton decision={decision} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// -------------------------------------------------------------------
// promotion rules tab: shows list of current rules and allows creation/editing.
function PromotionRulesTab({ schoolId }) {
  const queryClient = useQueryClient();
  // fetch promotion rules via managePromotionRules without ruleData (GET request)
  const { data, error, isLoading } = useQuery({
    queryKey: ["promotionRules", schoolId],
    queryFn: () => managePromotionRules(schoolId),
  });

  // local state for creating a new rule
  const [newRule, setNewRule] = useState({
    education_system: "",
    level: "",
    stream: "",
    min_average_for_promotion: "10.0",
    conditional_min_average: "8.0",
    min_subjects_passed: "",
  });

  const createRuleMutation = useMutation(
    (ruleData) => managePromotionRules(schoolId, ruleData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["promotionRules", schoolId]);
        Toast("Promotion rule created successfully!");
      },
      onError: (err) => {
        Toast(`Error creating rule: ${err.message}`, {
          variant: "destructive",
        });
      },
    }
  );

  const handleInputChange = (e) => {
    setNewRule((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateRule = () => {
    // clean up rule data if needed
    createRuleMutation.mutate(newRule);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Promotion Rules</h2>
      {isLoading ? (
        <div>loading rules…</div>
      ) : error ? (
        <div>error loading rules: {error.message}</div>
      ) : (
        <div>
          <ul className="mb-4">
            {data.map((rule) => (
              <li key={rule.id} className="p-2 border rounded my-2">
                <div>
                  <strong>{rule.education_system}</strong> - {rule.level}{" "}
                  {rule.stream && `(${rule.stream})`}
                </div>
                <div>
                  promotion average: {rule.min_average_for_promotion},
                  conditional average: {rule.conditional_min_average}, min
                  subjects: {rule.min_subjects_passed || "N/A"}
                </div>
              </li>
            ))}
          </ul>
          <div className="p-4 border rounded">
            <h3 className="font-bold mb-2">Create New Rule</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="education_system"
                value={newRule.education_system}
                onChange={handleInputChange}
                placeholder="Education System"
              />
              <Input
                name="level"
                value={newRule.level}
                onChange={handleInputChange}
                placeholder="Level"
              />
              <Input
                name="stream"
                value={newRule.stream}
                onChange={handleInputChange}
                placeholder="Stream (optional)"
              />
              <Input
                name="min_average_for_promotion"
                value={newRule.min_average_for_promotion}
                onChange={handleInputChange}
                placeholder="Min Average"
              />
              <Input
                name="conditional_min_average"
                value={newRule.conditional_min_average}
                onChange={handleInputChange}
                placeholder="Conditional Average"
              />
              <Input
                name="min_subjects_passed"
                value={newRule.min_subjects_passed}
                onChange={handleInputChange}
                placeholder="Min Subjects Passed (optional)"
              />
            </div>
            <Button onClick={handleCreateRule} className="mt-4">
              Create Rule
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------
// apply promotions tab: button to trigger promotion decisions creation.
function ApplyPromotionsTab({ academicYearId, classId }) {
  const mutation = useMutation(
    () => createPromotionDecisions(academicYearId, classId),
    {
      onSuccess: (data) => {
        Toast("Promotion decisions applied successfully!");
      },
      onError: (err) => {
        Toast(`Error applying promotions: ${err.message}`, {
          variant: "destructive",
        });
      },
    }
  );

  const handleApplyPromotions = () => {
    mutation.mutate();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Apply Promotions</h2>
      <p className="mb-4">
        Click the button below to evaluate student results and create promotion
        decisions.
      </p>
      <Button onClick={handleApplyPromotions} disabled={mutation.isLoading}>
        {mutation.isLoading ? "Processing…" : "Apply Promotions"}
      </Button>
    </div>
  );
}

// -------------------------------------------------------------------
// manual override tab: allows admins to override individual promotion decisions manually.
// this can list decisions with an inline edit or pop-up modal.
// for simplicity, we show a form to update a selected decision.
function ManualOverrideTab({ academicYearId, classId }) {
  // local state to hold the decision id and new status
  const [selectedDecisionId, setSelectedDecisionId] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const mutation = useMutation(
    ({ decisionId, status }) =>
      // we assume updateEnrollmentWorkflow can be used for manual overrides too
      updateEnrollmentWorkflow(decisionId, {
        update_type: "manual_override",
        promotion_status: status,
      }),
    {
      onSuccess: () => {
        Toast("Promotion decision updated!");
      },
      onError: (err) => {
        Toast(`Error updating decision: ${err.message}`, {
          variant: "destructive",
        });
      },
    }
  );

  const handleOverride = () => {
    if (!selectedDecisionId || !newStatus) {
      Toast("Please fill in both fields", { variant: "destructive" });
      return;
    }
    mutation.mutate({ decisionId: selectedDecisionId, status: newStatus });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manual Override</h2>
      <div className="mb-4">
        <Input
          placeholder="Promotion Decision ID"
          value={selectedDecisionId}
          onChange={(e) => setSelectedDecisionId(e.target.value)}
          className="mb-2"
        />
        <Input
          placeholder="New Promotion Status (promoted, conditional, repeated, graduated)"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
        />
      </div>
      <Button onClick={handleOverride} disabled={mutation.isLoading}>
        {mutation.isLoading ? "Updating…" : "Update Decision"}
      </Button>
    </div>
  );
}

// -------------------------------------------------------------------
// a button component to trigger manual override for a specific decision,
// could open a modal with the ManualOverrideTab pre-filled with the decision data.
function ManualOverrideButton({ decision }) {
  // for simplicity, we reuse the ManualOverrideTab logic inline
  const [isEditing, setIsEditing] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState(
    decision.promotion_status
  );
  const mutation = useMutation(
    ({ decisionId, status }) =>
      updateEnrollmentWorkflow(decision.id, {
        update_type: "manual_override",
        promotion_status: status,
      }),
    {
      onSuccess: () => {
        Toast("Decision updated!");
        setIsEditing(false);
      },
      onError: (err) => {
        Toast(`Error updating decision: ${err.message}`, {
          variant: "destructive",
        });
      },
    }
  );

  const handleSave = () => {
    mutation.mutate({ decisionId: decision.id, status: overrideStatus });
  };

  return isEditing ? (
    <div className="flex items-center gap-2">
      <Input
        value={overrideStatus}
        onChange={(e) => setOverrideStatus(e.target.value)}
        placeholder="New status"
      />
      <Button size="sm" onClick={handleSave}>
        Save
      </Button>
      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
        Cancel
      </Button>
    </div>
  ) : (
    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
      Override
    </Button>
  );
}
