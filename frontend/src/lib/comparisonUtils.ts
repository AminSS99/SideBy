import {
  GitCompareArrows,
  Search,
  BadgeCheck,
  BookOpenText,
  FileSearch,
  Boxes,
} from "lucide-react";
import type { ResearchStep } from "@/components/Comparison/types";

export const researchSteps: ResearchStep[] = [
  { label: "Classifying category", detail: "Applying taxonomy, safety rules, and source strategy", icon: GitCompareArrows },
  { label: "Finding sources", detail: "Prioritizing category-appropriate primary sources", icon: Search },
  { label: "Checking freshness", detail: "Flagging volatile facts and refresh windows", icon: BadgeCheck },
  { label: "Reading evidence", detail: "Extracting facts from source content", icon: BookOpenText },
  { label: "Extracting facts", detail: "Saving citations, confidence, and provenance", icon: FileSearch },
  { label: "Building comparison", detail: "Scoring category dimensions and generating the verdict", icon: Boxes },
];
