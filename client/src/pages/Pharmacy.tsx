import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Pill } from "lucide-react";
import { useLocation } from "wouter";

type MedicationPlan = {
  id: number;
  patientName: string;
  patientCode: string;
  medicineName: string;
  times: string[];
  durationDays: number;
  source: "pharmacy";
  createdAt: string;
};

export default function Pharmacy() {
  const [, navigate] = useLocation();

  const [patientName, setPatientName] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState("7");

  const [plans, setPlans] = useState<MedicationPlan[]>(() => {
    const saved = localStorage.getItem("medicationPlans");
    return saved ? JSON.parse(saved) : [];
  });

  function normalizeCode(code: string) {
    return code.trim().toLowerCase();
  }

  function savePlans(updated: MedicationPlan[]) {
    setPlans(updated);
    localStorage.setItem("medicationPlans", JSON.stringify(updated));
  }

  function removeTime(time: string) {
    setTimes(times.filter((t) => t !== time));
  }

  function addPlan() {
    const cleanPatientName = patientName.trim();
    const cleanPatientCode = normalizeCode(patientCode);
    const cleanMedicineName = medicineName.trim();

    if (!cleanPatientName || !cleanPatientCode || !cleanMedicineName || times.length === 0) {
      alert("يرجى إدخال اسم المريض، رقم الملف، اسم الدواء، ووقت الجرعة");
      return;
    }

    const newPlan: MedicationPlan = {
      id: Date.now(),
      patientName: cleanPatientName,
      patientCode: cleanPatientCode,
      medicineName: cleanMedicineName,
      times,
      durationDays: Number(durationDays) || 1,
      source: "pharmacy",
      createdAt: new Date().toLocaleString(),
    };

    savePlans([newPlan, ...plans]);

    setPatientName("");
    setPatientCode("");
    setMedicineName("");
    setTimes([]);
    setDurationDays("7");
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
            <Pill className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">إدخال الخطة العلاجية</h1>
              <p className="text-sm text-gray-500">
                هذه الصفحة للصيدلية أو المرافق، وليست للمريض
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <input
              className="w-full border rounded-lg p-3"
              placeholder="اسم المريض"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />

            <input
              className="w-full border rounded-lg p-3"
              placeholder="رقم ملف المريض / Patient Code"
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value)}
            />

            <input
              className="w-full border rounded-lg p-3"
              placeholder="اسم الدواء"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setTimes(["08:00"])}>
                ☀ صباحًا
              </Button>

              <Button variant="outline" onClick={() => setTimes(["14:00"])}>
                🌤 ظهرًا
              </Button>

              <Button variant="outline" onClick={() => setTimes(["18:00"])}>
                🌙 مساءً
              </Button>

              <Button variant="outline" onClick={() => setTimes(["22:00"])}>
                😴 قبل النوم
              </Button>

              <Button variant="outline" onClick={() => setTimes(["08:00", "20:00"])}>
                مرتين يوميًا
              </Button>

              <Button variant="outline" onClick={() => setTimes(["08:00", "14:00", "22:00"])}>
                3 مرات يوميًا
              </Button>
            </div>

            {times.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {times.map((time) => (
                  <button
                    key={time}
                    onClick={() => removeTime(time)}
                    className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm"
                  >
                    {time} ×
                  </button>
                ))}
              </div>
            )}

            <input
              className="w-full border rounded-lg p-3"
              type="number"
              min="1"
              placeholder="مدة العلاج بالأيام"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
            />

            <Button onClick={addPlan} className="w-full">
              حفظ الخطة العلاجية
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <h2 className="text-xl font-bold mb-4">الخطط العلاجية المدخلة</h2>

          {plans.length === 0 ? (
            <p className="text-sm text-gray-500">لا توجد خطط بعد.</p>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4 bg-white space-y-2">
                  <div className="text-sm text-gray-500">
                    المريض: {plan.patientName || "غير محدد"}
                  </div>

                  <div className="text-sm font-bold text-blue-700">
                    رقم الملف: {plan.patientCode || "غير موجود"}
                  </div>

                  <div className="font-semibold text-lg">{plan.medicineName}</div>

                  <div className="text-sm text-gray-600">
                    الأوقات: {plan.times.join("، ")}
                  </div>

                  <div className="text-sm text-gray-600">
                    مدة العلاج: {plan.durationDays} يوم
                  </div>

                  <div className="text-xs text-gray-400">
                    المصدر: الصيدلية — {plan.createdAt}
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