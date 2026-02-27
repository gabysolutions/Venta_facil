import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/ui/Loader";

import { loginRequest } from "../../services/auth.service";
import { ROLE_MAP, PERMISSIONS_BY_ROLE } from "../../config/permissions";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPass, setShowPass] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await loginRequest(username.trim(), password);

      // ✅ TS: res.data puede ser undefined, lo validamos
      if (!res?.data) {
        throw new Error("Respuesta inválida del servidor");
      }

      const apiUser = res.data.user; // { id, name, role }
      const token = res.data.token;

      if (!apiUser || !token) {
        throw new Error("Faltan datos de sesión en la respuesta");
      }

      // 🧠 Mapea el role del backend ("Administrador" | "Cajero")
      const appRole = ROLE_MAP[apiUser.role];

      // 🧩 Permisos por rol (mientras backend aún no manda permisos)
      const permissions = PERMISSIONS_BY_ROLE[appRole];

      const userForApp = {
        id: String(apiUser.id),
        name: apiUser.name,
        role: appRole,
        permissions,
      };

      login({ user: userForApp, token });

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 grid place-items-center">
          <div className="h-6 w-6 rounded-lg bg-emerald-400" />
        </div>
        <div className="leading-tight">
          <p className="text-xl font-bold text-slate-100">
            Venta<span className="text-emerald-400">Fácil</span>
          </p>
          <p className="text-xs text-slate-400">Punto de Venta</p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xl p-6">
        <h1 className="text-2xl font-bold text-slate-100">Bienvenido de vuelta</h1>
        <p className="text-slate-400 mt-1">
          Ingresa tus credenciales para acceder al sistema
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Usuario */}
          <div>
            <label className="text-sm font-medium text-slate-200">Usuario</label>
            <input
              type="text"
              placeholder="Ingresa tu usuario"
              className="mt-2 w-full rounded-xl bg-[#0f172a] border border-white/10 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-400/60"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="text-sm font-medium text-slate-200">Contraseña</label>

            <div className="mt-2 relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                className="w-full rounded-xl bg-[#0f172a] border border-white/10 px-4 py-3 pr-12 text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-400/60"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />

              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 disabled:opacity-60"
                onClick={() => setShowPass((v) => !v)}
                aria-label="Mostrar/ocultar contraseña"
                disabled={loading}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-[#0b1220] font-semibold py-3 transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={18} />
                Iniciando...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 VentaFácil. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}