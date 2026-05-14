import { useLocation } from "wouter";
import { Pill, Users, BarChart, Settings } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold text-right">سند</h1>

        {/* الأدويـة */}
        <div
          onClick={() => navigate("/patient")}
          className="p-6 bg-white rounded-xl shadow cursor-pointer flex justify-between items-center"
        >
          <div>
            <h2 className="text-lg font-bold">الأدوية</h2>
            <p className="text-gray-500">إدارة الأدوية والمواعيد</p>
          </div>
          <Pill className="text-indigo-600" />
        </div>

        {/* المرافق */}
      <div
  onClick={() => navigate("/family")}
  className="p-6 bg-white rounded-xl shadow flex justify-between items-center cursor-pointer"
>
          <div>
            <h2 className="text-lg font-bold">المرافقون</h2>
            <p className="text-gray-500">متابعة المرضى</p>
          </div>
          <Users className="text-green-600" />
        </div>

        {/* التقارير */}
    <div
  onClick={() => navigate("/reports")}
  className="p-6 bg-white rounded-xl shadow flex justify-between items-center cursor-pointer"
>
          <div>
            <h2 className="text-lg font-bold">التقارير</h2>
            <p className="text-gray-500">سجلات الالتزام</p>
          </div>
          <BarChart className="text-blue-600" />
        </div>

        {/* الإعدادات */}
       <div
  onClick={() => navigate("/settings")}
  className="p-6 bg-white rounded-xl shadow flex justify-between items-center cursor-pointer"
>
          <div>
            <h2 className="text-lg font-bold">الإعدادات</h2>
            <p className="text-gray-500">إدارة الحساب</p>
          </div>
          <Settings className="text-purple-600" />
        </div>

      </div>
    </div>
  );
}