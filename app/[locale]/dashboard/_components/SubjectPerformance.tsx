// _components/SubjectPerformanceAnalysis.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bar } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { SubjectPerformance } from "@/types/subjects";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SubjectPerformanceAnalysisProps {
  subjectPerformance: SubjectPerformance[];
}

export function SubjectPerformanceAnalysis({
  subjectPerformance,
}: SubjectPerformanceAnalysisProps) {
  const data = {
    labels: subjectPerformance.map((s) => s.subject_name),
    datasets: [
      {
        label: "Average Score",
        data: subjectPerformance.map((s) => s.average_score),
        backgroundColor: "rgba(75, 192, 192, 0.8)",
      },
    ],
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle>Subject Performance Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Bar
            data={data}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
