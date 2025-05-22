"use client";
import React from "react";
import ClassPerformance from "./ClassPerformance";

const ClassDetails = ({ data }) => {
  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg shadow-sm">
        <p>No data available. Please select a class and appropriate filters.</p>
      </div>
    );
  }

  return <ClassPerformance data={data} />;
};

export default ClassDetails;
