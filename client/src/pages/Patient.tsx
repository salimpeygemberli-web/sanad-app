import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

type MedicineStatus = "pending" | "calling" | "taken" | "missed" | "escalated";
type LogStatus = "reminder_sent" | "taken" | "missed" | "escalated";

type Medicine = {
  id: number;
  patientCode: string;
  name: string;
  time: string;
  status: MedicineStatus;
  retryCount: number;
  lastReminderAt?: number;
};

type IncomingCall = {
  id: number;
  name: string;
};

type DoseLog = {
  id: number;
  patientCode: string;
  medicineId: number;
  medicineName: string;
  scheduledTime?: string;
  status: LogStatus;
  timestamp: string;
};

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

const REMINDER_TIMEOUT_MS = 10 * 1000;

export default function Patient() {
  const [, navigate] = useLocation();

  const [patientCodeInput, setPatientCodeInput] = useState("");
 const activePatientCode = patientCodeInput.trim().toLowerCase();

  const [medicationPlans, setMedicationPlans] = useState<MedicationPlan[]>(() => {
    return JSON.parse(localStorage.getItem("medicationPlans") || "[]");
  });

  
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    return JSON.parse(localStorage.getItem("medicines") || "[]");
  });
useEffect(() => {
  const latestPlans = JSON.parse(
    localStorage.getItem("medicationPlans") || "[]"
  );

  setMedicationPlans(latestPlans);
}, [activePatientCode]);

const filteredMedicationPlans = useMemo(() => {
  if (!activePatientCode) return [];

  return medicationPlans.filter(
    (plan) =>
      String(plan.patientCode || "").trim().toLowerCase() ===
      activePatientCode
  );
}, [medicationPlans, activePatientCode]);
  const visibleMedicines = useMemo(() => {
    if (!activePatientCode) return [];

    return medicines.filter(
      (medicine) =>
        String(medicine.patientCode || "").trim() === activePatientCode
    );
  }, [medicines, activePatientCode]);

  const [logs, setLogs] = useState<DoseLog[]>(() => {
    return JSON.parse(localStorage.getItem("doseLogs") || "[]");
  });

  const visibleLogs = useMemo(() => {
    if (!activePatientCode) return [];

    return logs.filter(
      (log) => String(log.patientCode || "").trim() === activePatientCode
    );
  }, [logs, activePatientCode]);

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  function saveMedicines(updated: Medicine[]) {
    setMedicines(updated);
    localStorage.setItem("medicines", JSON.stringify(updated));
  }

  function saveLogs(updated: DoseLog[]) {
    setLogs(updated);
    localStorage.setItem("doseLogs", JSON.stringify(updated));
  }

  function createLog(medicine: Medicine, status: LogStatus) {
    if (!activePatientCode) return;

    const newLog: DoseLog = {
      id: Date.now(),
      patientCode: activePatientCode,
      medicineId: medicine.id,
      medicineName: medicine.name,
      scheduledTime: medicine.time,
      status,
      timestamp: new Date().toLocaleString(),
    };

    saveLogs([newLog, ...logs]);
  }

  function speakMedicine(medicineName: string) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance(
      `حان وقت دواء ${medicineName}. هل أخذت الدواء؟`
    );

    msg.lang = "ar-SA";
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
  }

  function saveFamilyAlert(medicineName: string) {
    if (!activePatientCode) return;

    const alerts = JSON.parse(localStorage.getItem("familyAlerts") || "[]");
    const familyPhone = localStorage.getItem(`familyPhone_${activePatientCode}`) || "";

    alerts.push({
      id: Date.now(),
      patientCode: activePatientCode,
      name: medicineName,
      familyPhone,
      time: new Date().toLocaleString(),
      status: familyPhone ? "ready_to_notify" : "missing_family_phone",
    });

    localStorage.setItem("familyAlerts", JSON.stringify(alerts));
  }

  function startCall(medicine: Medicine) {
    if (!activePatientCode) return;

    setIncomingCall({ id: medicine.id, name: medicine.name });
    speakMedicine(medicine.name);
    createLog(medicine, "reminder_sent");

    const updated = medicines.map((m) =>
      m.id === medicine.id && m.patientCode === activePatientCode
        ? {
            ...m,
            status: "calling" as MedicineStatus,
            lastReminderAt: Date.now(),
          }
        : m
    );

    saveMedicines(updated);
  }

  useEffect(() => {
    if (!activePatientCode) {
      setIncomingCall(null);
      return;
    }

    const generatedMedicines: Medicine[] = [];

    filteredMedicationPlans.forEach((plan) => {
      plan.times.forEach((time, index) => {
        generatedMedicines.push({
          id: Number(`${plan.id}${index}`),
          patientCode: activePatientCode,
          name: plan.medicineName,
          time,
          status: "pending",
          retryCount: 0,
        });
      });
    });

    const otherPatientsMedicines = medicines.filter(
      (medicine) => medicine.patientCode !== activePatientCode
    );

    saveMedicines([...otherPatientsMedicines, ...generatedMedicines]);
  }, [activePatientCode, filteredMedicationPlans.length]);

  useEffect(() => {
    if (!activePatientCode) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString("en-GB").slice(0, 5);
      const nowMs = Date.now();

      visibleMedicines.forEach((medicine) => {
        if (
          medicine.status === "pending" &&
          medicine.time === currentTime &&
          !incomingCall
        ) {
          startCall(medicine);
          return;
        }

        if (
          medicine.status === "calling" &&
          medicine.lastReminderAt !== undefined &&
          nowMs - medicine.lastReminderAt >= REMINDER_TIMEOUT_MS
        ) {
          setIncomingCall(null);
          window.speechSynthesis?.cancel();

          alert("🚨 تم تنبيه العائلة");
          saveFamilyAlert(medicine.name);
          createLog(medicine, "escalated");

          const updated = medicines.map((m) =>
            m.id === medicine.id && m.patientCode === activePatientCode
              ? {
                  ...m,
                  status: "escalated" as MedicineStatus,
                  lastReminderAt: Date.now(),
                }
              : m
          );

          saveMedicines(updated);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visibleMedicines, incomingCall, activePatientCode]);

  function answerTaken() {
    if (!incomingCall || !activePatientCode) return;

    const target = visibleMedicines.find((m) => m.id === incomingCall.id);
    if (!target) return;

    createLog(target, "taken");

    const updated = medicines.map((m) =>
      m.id === incomingCall.id && m.patientCode === activePatientCode
        ? {
            ...m,
            status: "taken" as MedicineStatus,
            lastReminderAt: Date.now(),
          }
        : m
    );

    saveMedicines(updated);
    setIncomingCall(null);
    window.speechSynthesis?.cancel();
  }

function answerMissed() {
  if (!incomingCall || !activePatientCode) return;

  const target = visibleMedicines.find((m) => m.id === incomingCall.id);
  if (!target) return;

  createLog(target, "missed");
  createLog(target, "escalated");
  saveFamilyAlert(target.name);

  const updated = medicines.map((m) =>
    m.id === incomingCall.id && m.patientCode === activePatientCode
      ? {
          ...m,
         status: "missed" as MedicineStatus,
          lastReminderAt: Date.now(),
        }
      : m
  );

  saveMedicines(updated);
  setIncomingCall(null);
  window.speechSynthesis?.cancel();

 
}

  function resetMedicine(id: number) {
    if (!activePatientCode) return;

    const updated = medicines.map((m) =>
      m.id === id && m.patientCode === activePatientCode
        ? {
            ...m,
            status: "pending" as MedicineStatus,
            retryCount: 0,
            lastReminderAt: undefined,
          }
        : m
    );

    saveMedicines(updated);
  }

  function getStatusText(status: MedicineStatus) {
    if (status === "pending") return "بانتظار التذكير";
    if (status === "calling") return "جاري التذكير";
    if (status === "taken") return "تم أخذه";
    if (status === "missed") return "لم يأخذ الدواء";
    if (status === "escalated") return "تم تنبيه العائلة";
    return "غير معروف";
  }

  function getStatusClass(status: MedicineStatus) {
    if (status === "pending") return "bg-indigo-50 text-indigo-700";
    if (status === "calling") return "bg-yellow-50 text-yellow-700";
    if (status === "taken") return "bg-green-50 text-green-700";
    if (status === "missed") return "bg-orange-50 text-orange-700";
    return "bg-red-50 text-red-700";
  }

  function getLogText(status: LogStatus) {
    if (status === "reminder_sent") return "تم إرسال التذكير";
    if (status === "taken") return "تم أخذ الدواء";
    if (status === "missed") return "لم يأخذ الدواء";
    if (status === "escalated") return "تم تنبيه العائلة";
    return "حدث غير معروف";
  }

  const takenCount = visibleLogs.filter((log) => log.status === "taken").length;
  const missedCount = visibleLogs.filter((log) => log.status === "missed").length;
  const escalatedCount = visibleLogs.filter(
    (log) => log.status === "escalated"
  ).length;

  const totalRelevant = takenCount + missedCount + escalatedCount;
  const adherenceRate =
    totalRelevant === 0 ? 0 : Math.round((takenCount / totalRelevant) * 100);

  return (
    <>
      {incomingCall && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-2xl p-8 text-center w-full max-w-sm shadow-xl"
            dir="rtl"
          >
            <div className="text-5xl mb-4">📞</div>

            <h2 className="text-2xl font-bold mb-2">مكالمة تذكير</h2>

            <p className="text-gray-600 mb-6">هل أخذت الدواء الآن؟</p>

            <button
              onClick={answerTaken}
              className="w-full mb-3 rounded-xl bg-green-600 text-white py-3 font-bold"
            >
              أخذت الدواء
            </button>

            <button
              onClick={answerMissed}
              className="w-full rounded-xl bg-red-600 text-white py-3 font-bold"
            >
              لم آخذه
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowRight className="w-4 h-4 ml-2" />
            رجوع
          </Button>

          <Card className="p-4 border-0 shadow-sm">
            <input
              className="w-full border rounded-lg p-3 text-right"
              placeholder="أدخل رقم ملف المريض / Patient Code"
              value={patientCodeInput}
              onChange={(e) => setPatientCodeInput(e.target.value)}
            />
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Pill className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold">أدويتي</h1>
              </div>
              <p className="text-sm text-gray-500">
                عدد الخطط العلاجية: {filteredMedicationPlans.length}
              </p>
            </div>

            {!activePatientCode && (
              <p className="text-sm text-gray-500">
                أدخل رقم ملف المريض لعرض الأدوية الخاصة به فقط.
              </p>
            )}

            {activePatientCode && filteredMedicationPlans.length === 0 && (
              <p className="text-sm text-red-500">
                لا توجد خطط علاجية لهذا الرقم.
              </p>
            )}
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-xl font-bold mb-4">قائمة الأدوية</h2>

            <div className="space-y-3">
              {visibleMedicines.length === 0 ? (
                <p className="text-sm text-gray-500">
                  لا توجد أدوية معروضة لهذا المريض.
                </p>
              ) : (
                visibleMedicines.map((medicine) => (
                  <div
                    key={`${medicine.patientCode}-${medicine.id}`}
                    className="border rounded-lg p-4 bg-white space-y-3"
                  >
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{medicine.name}</h3>
                        <p className="text-sm text-gray-500">
                          موعد التذكير: {medicine.time}
                        </p>
                      </div>

                      <span
                        className={`text-sm px-3 py-1 rounded-full ${getStatusClass(
                          medicine.status
                        )}`}
                      >
                        {getStatusText(medicine.status)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => startCall(medicine)}>
                        تذكير الآن
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => resetMedicine(medicine.id)}
                      >
                        إعادة
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

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

          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-xl font-bold mb-4">سجل الالتزام</h2>

            {visibleLogs.length === 0 ? (
              <p className="text-sm text-gray-500">لا توجد سجلات بعد.</p>
            ) : (
              <div className="space-y-3">
                {visibleLogs.map((log) => (
                  <div
                    key={`${log.patientCode}-${log.id}`}
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
    </>
  );
}