import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-screen bg-[#0b1220] text-slate-100 grid place-items-center p-4">
      <Outlet />
    </div>
  );
}
