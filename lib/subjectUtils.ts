// subjectUtils.ts

// --- Interfaces (Ensure these match your API and component usage) ---
export interface EducationSystemRef {
  id: string | number; // Adjust type based on your backend PK
  code: string; // e.g., 'en_gen', 'fr_tech'
  name: string; // e.g., 'English General'
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  abbreviation?: string;
  // Expecting the nested object or at least the key fields
  education_system: EducationSystemRef | null;
  school_level: "secondary" | "high_school" | null;
}

export interface ClassSubject {
  id?: string; // ID of the ClassSubject link itself (if editing existing)
  subject_id: string; // FK to the Subject model
  subject_name: string; // Denormalized for display
  subject_code: string; // Denormalized for display
  coefficient: number;
  mandatory: boolean;
  isNew?: boolean; // Frontend state tracking
}

// --- Subject Code Patterns (Used for Badge Coloring and potentially Category Key mapping) ---

// English General (en_gen) - Based on original codes
export const EN_GEN_SECONDARY_CORE_CODES = ["0530", "0545", "0570"]; // Example core codes
export const EN_GEN_SECONDARY_SCI_CODES = ["0510", "0565", "0515", "0580"]; // Example science codes
export const EN_GEN_SECONDARY_HUM_CODES = [
  "0560",
  "0550",
  "0525",
  "0520",
  "0505",
  "0562",
]; // Example humanities/commerce
export const EN_GEN_SECONDARY_LANG_CODES = ["0535"]; // Example language/lit
export const EN_GEN_SECONDARY_OPT_CODES = [
  "0595",
  "2001",
  "0585",
  "0590",
  "0540",
  "2002",
  "2005",
  "2004",
]; // Example other/optional

export const EN_GEN_HIGH_CORE_CODES = ["GP01", "0730", "0745", "0770", "0775"]; // Example core
export const EN_GEN_HIGH_SCI_CODES = ["0710", "0715", "0780", "0755"]; // Example science
export const EN_GEN_HIGH_HUM_CODES = [
  "0760",
  "0750",
  "0725",
  "0705",
  "0790",
  "0791",
]; // Example humanities/commerce
export const EN_GEN_HIGH_LANG_CODES = ["0735"]; // Example lang/lit
export const EN_GEN_HIGH_OPT_CODES = ["0795", "0796", "0785", "0740", "2102"]; // Example other/optional

// English Technical (en_tech) - Based on your example codes
export const EN_TECH_CORE_PATTERN = /^(T05|T07|3011|GP02|TMAN01|TCOMP01|TPM01)/; // General tech subjects
export const EN_TECH_BUILDING_PATTERN = /^(50|60|TBC01|TPL01|3002)/; // Building/Civil
export const EN_TECH_ELECTRICAL_PATTERN = /^(51|61|TEL01)/; // Electrical
export const EN_TECH_MECHANICAL_PATTERN = /^(52|62|TME01|3003)/; // Mechanical/Auto
export const EN_TECH_BUSINESS_PATTERN = /^(53|63|T0725)/; // Business/Accounting/Marketing
export const EN_TECH_HOME_ECON_PATTERN = /^(54|65|3013)/; // Home Econ/Fashion/Agric

// French General (fr_gen) - Based on your example codes
export const FR_GEN_SECONDARY_CORE_PATTERN =
  /^(1001|1002|1003A|1003B|4002|1005|1501)/; // Tronc commun examples
export const FR_GEN_SECONDARY_SCI_PATTERN = /^(4001A|4001B)/; // Sciences examples
export const FR_GEN_SECONDARY_LANG_PATTERN = /^(1006|1007|1008)/; // LV2/Latin examples
export const FR_GEN_SECONDARY_HUM_PATTERN = /^(1010)/; // LCN example
export const FR_GEN_SECONDARY_OPT_PATTERN = /^(4004|1504|1505|1011)/; // Technologie, Arts etc examples

export const FR_GEN_HIGH_CORE_PATTERN =
  /^(F1001|F1002|F1003|F1005|F1501|F4002|1004|GP01)/; // High school common core/Philo/GP
export const FR_GEN_HIGH_SCI_PATTERN =
  /^(1101|1102|F1105|1103|1101C|1102D|F1103XP|F1104CP)/; // PC, SVT, SNT, Spé Maths, etc
export const FR_GEN_HIGH_LANG_PATTERN = /^(F1006|F1001SP|F1005SP|F1008OPT)/; // LV2, HLP, LLCE, Latin Opt
export const FR_GEN_HIGH_HUM_PATTERN = /^(F1202|F1003SP|1202|F1203XP)/; // SES, HGGSP, DGEMC
// No specific "Optional" pattern for High School French General, often overlaps

// French Technical (fr_tech) - Based on your example codes
export const FR_TECH_SECONDARY_CORE_PATTERN = /^(FT10|FT15|FT40|FT1506)/; // General subjects in Tech Secondary
export const FR_TECH_SECONDARY_SERVICES_PATTERN = /^(CAP53|CAP54|CAP56)/; // CAP Tertiaire/Services/Hotel
export const FR_TECH_SECONDARY_BUILDING_PATTERN =
  /^(CAP50|CAP5501|CAP5206|CAP5109T|CAP5105)/; // CAP Batiment/Menuisier/Serrurier/Electricien etc
export const FR_TECH_SECONDARY_MAINTENANCE_PATTERN =
  /^(CAP5209|CAP5212|CAP5107)/; // CAP Maintenance Vehicule/Industriel/Carrosserie
export const FR_TECH_SECONDARY_FASHION_PATTERN = /^(CAP5408|CAP5409)/; // CAP Mode
export const FR_TECH_SECONDARY_AGRICULTURE_PATTERN = /^(CAPA)/; // CAP Agricole

export const FR_TECH_HIGH_CORE_PATTERN =
  /^(BPF1001|BPF1003|BPF1002|BPLVA|BPLVB|BPEPS|BPECDRT|BPECGEST|BPARTAP|BPPSE|BTECH1101)/; // Common subjects Bac Pro/Techno
export const FR_TECH_HIGH_STMG_PATTERN = /^(STMG)/; // STMG specific
export const FR_TECH_HIGH_STHR_PATTERN = /^(STHR)/; // STHR specific
export const FR_TECH_HIGH_STI2D_PATTERN = /^(STI2D)/; // STI2D specific
export const FR_TECH_HIGH_STL_PATTERN = /^(STL)/; // STL specific
export const FR_TECH_HIGH_ST2S_PATTERN = /^(ST2S)/; // ST2S specific
export const FR_TECH_HIGH_BACPRO_PATTERN = /^(BP\d+|BT\d+)/; // General Bac Pro / BT identifier

// --- Badge Coloring Function ---
export const getSubjectBadgeColor = (subject: Subject | null): string => {
  const defaultColor = "bg-gray-100 text-gray-800 border-gray-200";
  if (!subject || !subject.education_system || !subject.code)
    return defaultColor;

  const code = subject.code;
  const educationSystem = subject.education_system.code;
  const schoolLevel = subject.school_level;

  try {
    // English General System
    if (educationSystem === "en_gen") {
      if (schoolLevel === "secondary") {
        if (EN_GEN_SECONDARY_CORE_CODES.includes(code))
          return "bg-blue-100 text-blue-800 border-blue-200"; // Core
        if (EN_GEN_SECONDARY_SCI_CODES.includes(code))
          return "bg-green-100 text-green-800 border-green-200"; // Sciences
        if (EN_GEN_SECONDARY_HUM_CODES.includes(code))
          return "bg-amber-100 text-amber-800 border-amber-200"; // Humanities/Commerce
        if (EN_GEN_SECONDARY_LANG_CODES.includes(code))
          return "bg-purple-100 text-purple-800 border-purple-200"; // Language/Lit
        if (EN_GEN_SECONDARY_OPT_CODES.includes(code))
          return "bg-pink-100 text-pink-800 border-pink-200"; // Other/Optional
      } else if (schoolLevel === "high_school") {
        if (EN_GEN_HIGH_CORE_CODES.includes(code))
          return "bg-blue-200 text-blue-900 border-blue-300"; // Core (darker)
        if (EN_GEN_HIGH_SCI_CODES.includes(code))
          return "bg-green-200 text-green-900 border-green-300"; // Sciences (darker)
        if (EN_GEN_HIGH_HUM_CODES.includes(code))
          return "bg-amber-200 text-amber-900 border-amber-300"; // Humanities (darker)
        if (EN_GEN_HIGH_LANG_CODES.includes(code))
          return "bg-purple-200 text-purple-900 border-purple-300"; // Language (darker)
        if (EN_GEN_HIGH_OPT_CODES.includes(code))
          return "bg-pink-200 text-pink-900 border-pink-300"; // Other (darker)
      }
    }
    // English Technical System
    else if (educationSystem === "en_tech") {
      if (EN_TECH_CORE_PATTERN.test(code))
        return "bg-indigo-100 text-indigo-800 border-indigo-200"; // Core Tech
      if (EN_TECH_BUILDING_PATTERN.test(code))
        return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Building/Civil
      if (EN_TECH_ELECTRICAL_PATTERN.test(code))
        return "bg-cyan-100 text-cyan-800 border-cyan-200"; // Electrical
      if (EN_TECH_MECHANICAL_PATTERN.test(code))
        return "bg-orange-100 text-orange-800 border-orange-200"; // Mechanical
      if (EN_TECH_BUSINESS_PATTERN.test(code))
        return "bg-sky-100 text-sky-800 border-sky-200"; // Business
      if (EN_TECH_HOME_ECON_PATTERN.test(code))
        return "bg-rose-100 text-rose-800 border-rose-200"; // Home Econ/Fashion/Agric
    }
    // French General System
    else if (educationSystem === "fr_gen") {
      if (schoolLevel === "secondary") {
        if (FR_GEN_SECONDARY_CORE_PATTERN.test(code))
          return "bg-teal-100 text-teal-800 border-teal-200"; // Core Secondary
        if (FR_GEN_SECONDARY_SCI_PATTERN.test(code))
          return "bg-lime-100 text-lime-800 border-lime-200"; // Science Secondary
        if (FR_GEN_SECONDARY_LANG_PATTERN.test(code))
          return "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200"; // Language Secondary
        if (FR_GEN_SECONDARY_HUM_PATTERN.test(code))
          return "bg-stone-200 text-stone-800 border-stone-300"; // Humanities Secondary
        if (FR_GEN_SECONDARY_OPT_PATTERN.test(code))
          return "bg-violet-100 text-violet-800 border-violet-200"; // Optional Secondary
      } else if (schoolLevel === "high_school") {
        if (FR_GEN_HIGH_CORE_PATTERN.test(code))
          return "bg-teal-200 text-teal-900 border-teal-300"; // Core High
        if (FR_GEN_HIGH_SCI_PATTERN.test(code))
          return "bg-lime-200 text-lime-900 border-lime-300"; // Science High
        if (FR_GEN_HIGH_LANG_PATTERN.test(code))
          return "bg-fuchsia-200 text-fuchsia-900 border-fuchsia-300"; // Language High
        if (FR_GEN_HIGH_HUM_PATTERN.test(code))
          return "bg-stone-300 text-stone-900 border-stone-400"; // Humanities High
        // Use a general high school color if no specific pattern matches but level is high
        return "bg-gray-200 text-gray-900 border-gray-300";
      }
    }
    // French Technical System
    else if (educationSystem === "fr_tech") {
      if (schoolLevel === "secondary") {
        if (FR_TECH_SECONDARY_CORE_PATTERN.test(code))
          return "bg-red-100 text-red-800 border-red-200"; // Core Tech Sec
        if (FR_TECH_SECONDARY_SERVICES_PATTERN.test(code))
          return "bg-blue-100 text-blue-800 border-blue-200"; // Services Sec
        if (FR_TECH_SECONDARY_BUILDING_PATTERN.test(code))
          return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Building Sec
        if (FR_TECH_SECONDARY_MAINTENANCE_PATTERN.test(code))
          return "bg-orange-100 text-orange-800 border-orange-200"; // Maintenance Sec
        if (FR_TECH_SECONDARY_FASHION_PATTERN.test(code))
          return "bg-pink-100 text-pink-800 border-pink-200"; // Fashion Sec
        if (FR_TECH_SECONDARY_AGRICULTURE_PATTERN.test(code))
          return "bg-green-100 text-green-800 border-green-200"; // Agric Sec
      } else if (schoolLevel === "high_school") {
        if (FR_TECH_HIGH_CORE_PATTERN.test(code))
          return "bg-red-200 text-red-900 border-red-300"; // Core Tech High
        if (FR_TECH_HIGH_STMG_PATTERN.test(code))
          return "bg-sky-200 text-sky-900 border-sky-300"; // STMG High
        if (FR_TECH_HIGH_STHR_PATTERN.test(code))
          return "bg-rose-200 text-rose-900 border-rose-300"; // STHR High
        if (FR_TECH_HIGH_STI2D_PATTERN.test(code))
          return "bg-indigo-200 text-indigo-900 border-indigo-300"; // STI2D High
        if (FR_TECH_HIGH_STL_PATTERN.test(code))
          return "bg-cyan-200 text-cyan-900 border-cyan-300"; // STL High
        if (FR_TECH_HIGH_ST2S_PATTERN.test(code))
          return "bg-purple-200 text-purple-900 border-purple-300"; // ST2S High
        if (FR_TECH_HIGH_BACPRO_PATTERN.test(code))
          return "bg-amber-200 text-amber-900 border-amber-300"; // BacPro High
      }
    }
  } catch (error) {
    console.error("Error applying badge color:", error, "Subject:", subject);
  }

  // Fallback color if no specific rule matches
  return defaultColor;
};

// --- Category Key Function (matches keys used in getSubjectCategories in the component) ---
export const getSubjectCategoryKey = (
  subject: Subject,
  classEducationSystemCode: string,
  classSchoolLevel: "secondary" | "high_school"
): string => {
  if (!subject || !subject.code || !subject.name) return "all"; // Default category

  const code = subject.code;
  const nameLower = subject.name.toLowerCase();
  const isEnglish = classEducationSystemCode.startsWith("en_");
  const isFrench = classEducationSystemCode.startsWith("fr_");
  const isGeneral = classEducationSystemCode.includes("_gen");
  const isTechnical = classEducationSystemCode.includes("_tech");

  try {
    // --- English General ---
    if (isEnglish && isGeneral) {
      if (classSchoolLevel === "secondary") {
        if (
          ["english language", "mathematics", "french"].some((core) =>
            nameLower.includes(core)
          )
        )
          return "core";
        if (
          ["biology", "chemistry", "physics", "science"].some((sci) =>
            nameLower.includes(sci)
          )
        )
          return "sciences";
        if (
          ["english", "french", "language", "literature"].some((lang) =>
            nameLower.includes(lang)
          ) &&
          !nameLower.includes("english language")
        )
          return "languages";
        if (
          [
            "history",
            "geography",
            "religious",
            "citizenship",
            "economics",
            "commerce",
            "accounting",
            "logic",
          ].some((hum) => nameLower.includes(hum))
        )
          return "humanities";
        if (
          [
            "art",
            "music",
            "physical education",
            "food and nutrition",
            "ict",
            "computer science",
          ].some((opt) => nameLower.includes(opt))
        )
          return "optional";
      } else {
        // High School
        if (
          [
            "general paper",
            "english language",
            "mathematics",
            "further mathematics",
            "french",
          ].some((core) => nameLower.includes(core))
        )
          return "core";
        if (
          ["biology", "chemistry", "physics", "geology"].some((sci) =>
            nameLower.includes(sci)
          )
        )
          return "sciences";
        if (["literature in english"].some((lang) => nameLower.includes(lang)))
          return "languages";
        if (
          [
            "history",
            "geography",
            "economics",
            "accounting",
            "philosophy",
            "sociology",
          ].some((hum) => nameLower.includes(hum))
        )
          return "humanities";
        if (
          [
            "food science",
            "computer science",
            "ict",
            "religious studies",
            "physical education",
          ].some((opt) => nameLower.includes(opt))
        )
          return "optional";
      }
    }
    // --- English Technical ---
    else if (isEnglish && isTechnical) {
      if (EN_TECH_CORE_PATTERN.test(code)) return "core";
      if (classSchoolLevel === "secondary") {
        if (EN_TECH_BUILDING_PATTERN.test(code)) return "building";
        if (EN_TECH_ELECTRICAL_PATTERN.test(code)) return "electrical";
        if (EN_TECH_MECHANICAL_PATTERN.test(code)) return "mechanical";
        if (EN_TECH_BUSINESS_PATTERN.test(code)) return "business";
        if (EN_TECH_HOME_ECON_PATTERN.test(code)) return "homeeconomics";
      } else {
        // High School
        if (EN_TECH_BUILDING_PATTERN.test(code)) return "civil"; // Map to High School category
        if (EN_TECH_ELECTRICAL_PATTERN.test(code)) return "electrical";
        if (EN_TECH_MECHANICAL_PATTERN.test(code)) return "mechanical";
        if (EN_TECH_BUSINESS_PATTERN.test(code)) return "business";
        if (EN_TECH_HOME_ECON_PATTERN.test(code)) return "homeeconomics";
      }
    }
    // --- French General ---
    else if (isFrench && isGeneral) {
      if (
        FR_GEN_SECONDARY_CORE_PATTERN.test(code) ||
        FR_GEN_HIGH_CORE_PATTERN.test(code)
      )
        return "core";
      if (
        FR_GEN_SECONDARY_SCI_PATTERN.test(code) ||
        FR_GEN_HIGH_SCI_PATTERN.test(code)
      )
        return "sciences";
      if (
        FR_GEN_SECONDARY_LANG_PATTERN.test(code) ||
        FR_GEN_HIGH_LANG_PATTERN.test(code)
      )
        return "languages";
      if (
        FR_GEN_SECONDARY_HUM_PATTERN.test(code) ||
        FR_GEN_HIGH_HUM_PATTERN.test(code)
      )
        return "humanities";
      if (
        FR_GEN_SECONDARY_OPT_PATTERN.test(code) ||
        nameLower.includes("option")
      )
        return "optional";
    }
    // --- French Technical ---
    else if (isFrench && isTechnical) {
      if (classSchoolLevel === "secondary") {
        if (FR_TECH_SECONDARY_CORE_PATTERN.test(code)) return "core";
        if (FR_TECH_SECONDARY_SERVICES_PATTERN.test(code)) return "services";
        if (FR_TECH_SECONDARY_BUILDING_PATTERN.test(code)) return "building";
        if (FR_TECH_SECONDARY_MAINTENANCE_PATTERN.test(code))
          return "maintenance";
        if (FR_TECH_SECONDARY_FASHION_PATTERN.test(code)) return "fashion";
        if (FR_TECH_SECONDARY_AGRICULTURE_PATTERN.test(code))
          return "agriculture";
      } else {
        // High School
        if (FR_TECH_HIGH_CORE_PATTERN.test(code)) return "core";
        if (FR_TECH_HIGH_STMG_PATTERN.test(code)) return "stmg";
        if (FR_TECH_HIGH_STHR_PATTERN.test(code)) return "sthr";
        if (FR_TECH_HIGH_STI2D_PATTERN.test(code)) return "sti2d";
        if (FR_TECH_HIGH_STL_PATTERN.test(code)) return "stl";
        if (FR_TECH_HIGH_ST2S_PATTERN.test(code)) return "st2s";
        if (FR_TECH_HIGH_BACPRO_PATTERN.test(code)) return "bacpro";
      }
    }
  } catch (error) {
    console.error(
      "Error determining subject category key:",
      error,
      "Subject:",
      subject
    );
  }

  return "all"; // Fallback category
};

// --- Default Mandatory Status Function ---
export const getDefaultMandatoryStatus = (
  subject: Subject | null,
  classEducationSystemCode: string | undefined
  // classLevel is not strictly needed if subject.school_level is reliable
  // but might be useful for specific class-level overrides in the future.
): boolean => {
  if (
    !subject ||
    !classEducationSystemCode ||
    !subject.education_system ||
    !subject.school_level
  ) {
    return false;
  }

  // Ensure the subject actually belongs to the class's system/level before applying rules
  if (subject.education_system.code !== classEducationSystemCode) {
    // console.warn(`Subject ${subject.code} system (${subject.education_system.code}) doesn't match class system (${classEducationSystemCode}). Mandatory check might be inaccurate.`);
    // Depending on strictness, you might want to return false here.
    // return false;
  }

  const subjectNameLower = subject.name.toLowerCase();
  const systemCode = classEducationSystemCode;
  const schoolLevel = subject.school_level; // Use subject's level

  try {
    // --- English System Rules ---
    if (systemCode.startsWith("en_")) {
      // Core subjects often mandatory across General/Technical
      if (
        subjectNameLower.includes("english language") ||
        subjectNameLower.includes("mathematics")
      ) {
        return true;
      }
      // General Paper in High School
      if (schoolLevel === "high_school") {
        if (systemCode === "en_gen" && subject.code === "GP01") return true;
        if (systemCode === "en_tech" && subject.code === "GP02") return true;
      }
      // French is often mandatory in English Secondary
      if (schoolLevel === "secondary" && subjectNameLower.includes("french")) {
        return true;
      }
      // Citizenship often mandatory
      if (subjectNameLower.includes("citizenship education")) {
        return true;
      }
    }
    // --- French System Rules ---
    else if (systemCode.startsWith("fr_")) {
      // Core subjects often mandatory across General/Technical
      if (
        subjectNameLower.includes("français") ||
        subjectNameLower.includes("mathématiques")
      ) {
        return true;
      }
      // Anglais (LV1) is often mandatory
      if (
        subjectNameLower.includes("anglais") &&
        subject.code.includes("1005")
      ) {
        return true;
      }
      // ECM/EMC often mandatory
      if (subjectNameLower.includes("civique")) {
        return true;
      }
      // Philosophy in Terminale (General High School)
      if (
        systemCode === "fr_gen" &&
        schoolLevel === "high_school" &&
        subjectNameLower === "philosophie"
      ) {
        return true;
      }
      // PSE in Technical (Secondary and High School)
      if (
        systemCode === "fr_tech" &&
        subjectNameLower.includes("prévention santé environnement")
      ) {
        return true;
      }
    }
  } catch (error) {
    console.error(
      "Error determining mandatory status:",
      error,
      "Subject:",
      subject
    );
  }

  // Default to false if no specific rule matches
  return false;
};
