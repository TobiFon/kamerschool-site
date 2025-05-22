import { authFetch } from "@/lib/auth";
import { ClassPerformance } from "@/types/class";

// 1. Update the fetchClasses function to map the code values to the actual filter values
export async function fetchClasses({
  education_system,
}: {
  education_system?: string;
}) {
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/classes/`);

  // Map the tab values to the actual values in the database
  if (education_system) {
    // Convert code to name format used in the database
    const systemMapping = {
      en_gen: "english_general",
      en_tech: "english_technical",
      fr_gen: "french_general",
      fr_tech: "french_technical",
    };

    const mappedSystem = systemMapping[education_system];
    if (mappedSystem) {
      url.searchParams.append("education_system", mappedSystem);
    }
  }

  const res = await authFetch(url.toString());
  if (!res.ok) {
    throw new Error("Failed to fetch classes list");
  }
  return res.json();
}
export async function fetchAllClasses() {
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/classes/`);

  const res = await authFetch(url.toString());
  if (!res.ok) {
    throw new Error("Failed to fetch classes list");
  }
  return res.json();
}

// Fetch a single class by ID
export async function fetchClassById(id: string): Promise<any> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/classes/${id}/`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch class details");
  }
  return res.json();
}

// Create a new class
export async function createClass(classData: any): Promise<any> {
  try {
    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/classes/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(classData),
    });

    console.log("Response status:", res.status);
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.detail || "Failed to create class");
    }

    const data = await res.json();

    return data;
  } catch (error) {
    throw error;
  }
}

export async function updateClass(
  classId: string,
  classData: any
): Promise<any> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/classes/${classId}/`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(classData),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to update class");
  }

  return res.json();
}

// Delete a class
export async function deleteClass(id: string): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/classes/${id}/`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to delete class");
  }
}
