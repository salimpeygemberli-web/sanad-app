import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Settings, Save } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
export default function SettingsPage() {
  const [, navigate] = useLocation();
const [familyPhone, setFamilyPhone] = useState(
  localStorage.getItem("familyPhone") || ""
);

function saveFamilyPhone() {
  localStorage.setItem("familyPhone", familyPhone);

 
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
            <Settings className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold">الإعدادات</h1>
              <p className="text-gray-500 text-sm">إدارة الحساب والخصوصية</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border rounded-xl p-4 bg-white">
              <div className="font-semibold mb-1">اللغة</div>
              <div className="text-sm text-gray-500">العربية</div>
            </div>

          <div className="border rounded-xl p-4 bg-white space-y-3">
  <div>
    <div className="font-semibold mb-1">رقم المرافق</div>
    <div className="text-sm text-gray-500">
      الرقم الذي يستقبل التنبيهات
    </div>
  </div>

  <input
    className="w-full border rounded-lg p-3"
    placeholder="07XXXXXXXX"
    value={familyPhone}
    onChange={(e) => setFamilyPhone(e.target.value)}
  />

  <Button
  onClick={(e) => {
    saveFamilyPhone();
    e.currentTarget.blur();
  }}
  className="w-full focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
 
>
    <Save className="w-4 h-4 ml-2" />
    حفظ الرقم
  </Button>
</div>

            <div className="border rounded-xl p-4 bg-white">
              <div className="font-semibold mb-1">مشاركة التقارير</div>
              <div className="text-sm text-gray-500">غير مفعلة</div>
            </div>

            <div className="border rounded-xl p-4 bg-white">
              <div className="font-semibold mb-1">حالة الاشتراك</div>
              <div className="text-sm text-gray-500">نسخة تجريبية</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}