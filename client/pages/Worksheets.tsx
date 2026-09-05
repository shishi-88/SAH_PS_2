import { ClipboardList } from "lucide-react";
import PlaceholderPage from "@/components/PlaceholderPage";

export default function Worksheets() {
  return (
    <PlaceholderPage
      icon={ClipboardList}
      title="Worksheet library"
      description="Browse every practice sheet generated so far, grouped by gap type, and see which student each one was assigned to."
    />
  );
}
