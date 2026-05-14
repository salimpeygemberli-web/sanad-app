import { useEffect, useState } from "react";

export default function Family() {
  const [medicines, setMedicines] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("medicines");
    if (saved) setMedicines(JSON.parse(saved));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold">متابعة العائلة</h1>

        {medicines.length === 0 ? (
          <p className="text-gray-500">لا يوجد بيانات</p>
        ) : (
          medicines.map((m) => (
            <div key={m.id} className="p-4 bg-white rounded shadow">
              <h2 className="font-bold">{m.name}</h2>
              <p>الوقت: {m.time}</p>

              <p className={
                m.status === "taken"
                  ? "text-green-600"
                  : m.status === "missed"
                  ? "text-red-600"
                  : "text-gray-500"
              }>
                الحالة: {m.status || "بانتظار"}
              </p>
            </div>
          ))
        )}

      </div>
    </div>
  );
}