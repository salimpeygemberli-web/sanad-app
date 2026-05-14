import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, FileText, Printer } from "lucide-react";
import { useLocation } from "wouter";

type LogStatus =
  | "reminder_sent"
  | "taken"
  | "missed"
  | "escalated";

type DoseLog = {
  id: number;
  medicineId: number;
  medicineName: string;
  scheduledTime?: string;
  status: LogStatus;
  timestamp: string;
};

export default function Reports() {
  const [, navigate] = useLocation();

  const logs: DoseLog[] = JSON.parse(
    localStorage.getItem("doseLogs") || "[]"
  );

  const takenCount = logs.filter((log) => log.status === "taken").length;
  const missedCount = logs.filter((log) => log.status === "missed").length;
  const escalatedCount = logs.filter(
    (log) => log.status === "escalated"
  ).length;

  const totalRelevant = takenCount + missedCount + escalatedCount;

  const adherenceRate =
    totalRelevant === 0
      ? 0
      : Math.round((takenCount / totalRelevant) * 100);

  function getLogText(status: LogStatus) {
    if (status === "reminder_sent") return "تم إرسال التذكير";
    if (status === "taken") return "تم أخذ الدواء";
    if (status === "missed") return "لم يأخذ الدواء";
    if (status === "escalated") return "تم تنبيه العائلة";
    return "حدث غير معروف";
  }

  function printReport() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowRight className="w-4 h-4 ml-2" />
          رجوع
        </Button>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold">تقارير الالتزام</h1>
              <p className="text-sm text-gray-500">
                سجل غير قابل للحذف لالتزام المريض بالدواء
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-50 rounded-xl p-4 border">
              <div className="text-sm text-gray-500">تم أخذ الجرعات</div>
              <div className="text-2xl font-bold text-green-700">
                {takenCount}
              </div>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 border">
              <div className="text-sm text-gray-500">جرعات فائتة</div>
              <div className="text-2xl font-bold text-orange-700">
                {missedCount}
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-4 border">
              <div className="text-sm text-gray-500">تنبيهات العائلة</div>
              <div className="text-2xl font-bold text-red-700">
                {escalatedCount}
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 border">
              <div className="text-sm text-gray-500">نسبة الالتزام</div>
              <div className="text-2xl font-bold text-indigo-700">
                {adherenceRate}%
              </div>
            </div>
          </div>

          <Button onClick={printReport} className="w-full">
            <Printer className="w-4 h-4 ml-2" />
            طباعة التقرير
          </Button>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-xl font-bold mb-4">سجل الالتزام</h2>

          {logs.length === 0 ? (
            <p className="text-sm text-gray-500">لا توجد سجلات بعد.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 bg-white"
                >
                  <div className="font-semibold">{log.medicineName}</div>

                  <div className="text-sm text-gray-600">
                    {getLogText(log.status)}
                  </div>

                  <div className="text-xs text-gray-400 mt-1">
                    الوقت المجدول: {log.scheduledTime || "غير محدد"} —{" "}
                    {log.timestamp}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}