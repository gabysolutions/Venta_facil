import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  MoreVertical,
  ShieldCheck,
  UserCog,
  ArrowLeft,
  X,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  KeyRound,
  Power,
} from "lucide-react";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Loader from "../../components/ui/Loader";

import {
  activateUser,
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
  type UserRole,
  type User as ApiUser,
} from "../../services/users.service";

import {
  assignPrivilege,
  getAllPrivileges,
  getPrivilegesByUserId,
  removePrivilege,
  type Privilege,
  type PrivilegeKey,
} from "../../services/privileges.service";

type Role = UserRole;
type Permission = PrivilegeKey;

type User = {
  id: number;
  name: string;
  paternal_lastname: string;
  maternal_lastname: string;
  role: Role;
  active: boolean;
  permissions: Permission[];
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function roleBadge(role: Role) {
  return role === "Administrador"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-slate-100 text-slate-700";
}

function uniqPerms(perms: Permission[]) {
  return Array.from(new Set(perms));
}

function fullName(u: Pick<User, "name" | "paternal_lastname" | "maternal_lastname">) {
  return [u.name, u.paternal_lastname, u.maternal_lastname].filter(Boolean).join(" ");
}

function mapApiUserToUI(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    paternal_lastname: u.paternal_lastname,
    maternal_lastname: u.maternal_lastname,
    role: u.role,
    active: u.status === 1,
    permissions: [],
  };
}

export default function UsersSettings() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [allPrivileges, setAllPrivileges] = useState<Privilege[]>([]);

  // Modal add/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  // ✅ baseline credenciales (para mandarlas en PUT aunque el usuario no cambie nada)
  const [editCreds, setEditCreds] = useState<{ user: string; password: string } | null>(null);

  // Row menu (3 dots)
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  // Delete confirm
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Password UI
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  // Permisos modal
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [permUserId, setPermUserId] = useState<number | null>(null);
  const [permDraft, setPermDraft] = useState<Permission[]>([]);
  const [permSearch, setPermSearch] = useState("");
  const [permBusy, setPermBusy] = useState(false);

  const permUser = useMemo(
    () => users.find((u) => u.id === permUserId) ?? null,
    [users, permUserId]
  );

  const [form, setForm] = useState({
    name: "",
    paternal_lastname: "",
    maternal_lastname: "",
    role: "Cajero" as Role,
    user: "",
    password: "",
    password2: "",
  });

  const totalUsers = useMemo(() => users.length, [users]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllUsers();
      if (!res.success) throw new Error(res.error || res.message || "No se pudieron cargar usuarios");
      setUsers((res.data ?? []).map(mapApiUserToUI));
    } catch (e: any) {
      setError(e?.message || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = () => {
    setEditing(null);
    setEditCreds(null);
    setShowPassword(false);
    setShowPassword2(false);
    setForm({
      name: "",
      paternal_lastname: "",
      maternal_lastname: "",
      role: "Cajero",
      user: "",
      password: "",
      password2: "",
    });
    setModalOpen(true);
  };

  // ✅ IMPORTANTE: openEdit antes del return (y antes de usarse)
  const openEdit = async (u: User) => {
    setError(null);
    setEditing(u);
    setShowPassword(false);
    setShowPassword2(false);
    setBusyId(u.id);

    try {
      const res = await getUserById(u.id);
      if (!res.success) throw new Error(res.error || res.message || "No se pudo obtener el usuario");

      const detail: any = res.data;
      if (!detail) throw new Error("Usuario no encontrado");

      const baselineUser = detail.user ?? "";
      const baselinePass = detail.password ?? "";

      setEditCreds({ user: baselineUser, password: baselinePass });

      setForm({
        name: detail.name ?? u.name,
        paternal_lastname: detail.paternal_lastname ?? u.paternal_lastname,
        maternal_lastname: detail.maternal_lastname ?? u.maternal_lastname,
        role: detail.role ?? u.role,
        user: baselineUser,
        password: baselinePass,
        password2: baselinePass,
      });

      setModalOpen(true);
    } catch (e: any) {
      setError(e?.message || "Error abriendo edición");
      setEditing(null);
      setEditCreds(null);
    } finally {
      setBusyId(null);
      setMenuOpenId(null);
    }
  };

  // ✅ permisos por ID de usuario seleccionado
  const openPermissions = async (u: User) => {
    setError(null);
    setPermUserId(u.id);
    setPermSearch("");
    setPermDraft([]);
    setPermModalOpen(true);
    setPermBusy(true);

    try {
      const [allRes, byUserRes] = await Promise.all([
        allPrivileges.length
          ? Promise.resolve({ success: true, data: allPrivileges } as any)
          : getAllPrivileges(),
        getPrivilegesByUserId(u.id),
      ]);

      if (!allRes.success) throw new Error(allRes.error || allRes.message || "No se pudieron cargar permisos");
      if (!byUserRes.success)
        throw new Error(byUserRes.error || byUserRes.message || "No se pudieron cargar permisos del usuario");

      const all = (allRes.data ?? []) as Privilege[];
      const perms = (byUserRes.data?.permissions ?? []) as Array<{ key: Permission }>;
      const keys = uniqPerms(perms.map((p) => p.key));

      setAllPrivileges(all);
      setPermDraft(keys);

      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, permissions: keys } : x)));
    } catch (e: any) {
      setError(e?.message || "Error cargando permisos");
    } finally {
      setPermBusy(false);
    }
  };

  const togglePerm = (perm: Permission) => {
    setPermDraft((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]));
  };

  const validate = () => {
    const name = form.name.trim();
    const pat = form.paternal_lastname.trim();
    const mat = form.maternal_lastname.trim();

    if (!name || !pat || !mat) {
      alert("Completa Nombre, Apellido paterno y Apellido materno");
      return false;
    }

    // ✅ Crear: user y password obligatorios
    if (!editing) {
      if (!form.user.trim()) {
        alert("Completa el usuario (login)");
        return false;
      }
      if (form.password.length < 6) {
        alert("La contraseña debe tener mínimo 6 caracteres");
        return false;
      }
      if (form.password !== form.password2) {
        alert("Las contraseñas no coinciden");
        return false;
      }
    } else {
      // ✅ Editar: como tu PUT requiere credenciales, que no vayan vacías
      if (!form.user.trim()) {
        alert("El usuario (login) no puede ir vacío");
        return false;
      }
      if (!form.password) {
        alert("La contraseña no puede ir vacía");
        return false;
      }
      if (form.password !== form.password2) {
        alert("Las contraseñas no coinciden");
        return false;
      }
    }

    return true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    const payloadBase = {
      name: form.name.trim(),
      paternal_lastname: form.paternal_lastname.trim(),
      maternal_lastname: form.maternal_lastname.trim(),
      role: form.role,
    };

    try {
      setBusyId(editing?.id ?? -1);

      if (editing) {
        const res = await updateUser({
          id: editing.id,
          ...payloadBase,
          // ✅ siempre manda credenciales en PUT (aunque no toquen nada)
          user: form.user.trim() || editCreds?.user || "",
          password: form.password || editCreds?.password || "",
        });

        if (!res.success) throw new Error(res.error || res.message || "No se pudo actualizar el usuario");
      } else {
        const res = await createUser({
          ...payloadBase,
          user: form.user.trim(),
          password: form.password,
        });

        if (!res.success) throw new Error(res.error || res.message || "No se pudo crear el usuario");
      }

      setModalOpen(false);
      setEditing(null);
      setEditCreds(null);
      setMenuOpenId(null);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "Error guardando usuario");
    } finally {
      setBusyId(null);
    }
  };

  const askDelete = (id: number) => {
    setDeleteId(id);
    setConfirmDeleteOpen(true);
    setMenuOpenId(null);
  };

  const doDelete = async () => {
    if (!deleteId) return;
    setError(null);

    try {
      setBusyId(deleteId);
      const res = await deleteUser(deleteId);
      if (!res.success) throw new Error(res.error || res.message || "No se pudo eliminar el usuario");

      setConfirmDeleteOpen(false);
      setDeleteId(null);
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "Error eliminando usuario");
    } finally {
      setBusyId(null);
    }
  };

  const doActivate = async (id: number) => {
    setError(null);
    try {
      setBusyId(id);
      const res = await activateUser(id);
      if (!res.success) throw new Error(res.error || res.message || "No se pudo activar el usuario");
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || "Error activando usuario");
    } finally {
      setBusyId(null);
    }
  };

  const savePermissions = async () => {
    if (!permUser) return;
    setError(null);
    setPermBusy(true);

    try {
      const currentKeys = new Set((permUser.permissions ?? []) as Permission[]);
      const nextKeys = new Set(uniqPerms(permDraft));

      const toAddKeys = [...nextKeys].filter((k) => !currentKeys.has(k));
      const toRemoveKeys = [...currentKeys].filter((k) => !nextKeys.has(k));

      const keyToId = new Map(allPrivileges.map((p) => [p.key, p.id] as const));

      for (const k of toAddKeys) {
        const permId = keyToId.get(k);
        if (!permId) continue;
        const res = await assignPrivilege({ user_id: permUser.id, permission: permId });
        if (!res.success) throw new Error(res.error || res.message || `No se pudo asignar ${k}`);
      }

      for (const k of toRemoveKeys) {
        const permId = keyToId.get(k);
        if (!permId) continue;
        const res = await removePrivilege({ user_id: permUser.id, permission: permId });
        if (!res.success) throw new Error(res.error || res.message || `No se pudo quitar ${k}`);
      }

      const byUserRes = await getPrivilegesByUserId(permUser.id);
      if (!byUserRes.success)
        throw new Error(byUserRes.error || byUserRes.message || "No se pudieron recargar permisos");

      const perms = (byUserRes.data?.permissions ?? []) as Array<{ key: Permission }>;
      const updatedKeys = uniqPerms(perms.map((p) => p.key));

      setUsers((prev) => prev.map((u) => (u.id === permUser.id ? { ...u, permissions: updatedKeys } : u)));

      setPermModalOpen(false);
      setPermUserId(null);
      setMenuOpenId(null);
    } catch (e: any) {
      setError(e?.message || "Error guardando permisos");
    } finally {
      setPermBusy(false);
    }
  };

  const filteredPerms = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    const list = allPrivileges.map((p) => ({
      key: p.key,
      label: p.description,
      desc: p.key,
    }));

    if (!q) return list;

    return list.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q)
    );
  }, [permSearch, allPrivileges]);

  if (loading) return <Loader fullScreen size={44} />;

  return (
    <div className="p-4 lg:p-8">
      {/* Back */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/configuracion")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-sm font-extrabold text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Configuración
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-200 grid place-items-center">
          <Users className="h-6 w-6 text-emerald-700" />
        </div>

        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Usuarios y Permisos</h1>
          <p className="text-slate-500 mt-1">Gestiona cajeros y administradores</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 font-extrabold">
          {error}
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <p className="text-sm text-slate-500">{totalUsers} usuarios registrados</p>

        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold px-4 py-2.5 transition"
        >
          <Plus className="h-4 w-4" />
          Agregar usuario
        </button>
      </div>

      {/* Users list */}
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="relative flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-sm">
                {initials(fullName(user))}
              </div>

              <div>
                <p className="font-extrabold text-slate-900 text-sm">{fullName(user)}</p>
              
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Role badge */}
              <span
                className={[
                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold",
                  roleBadge(user.role),
                ].join(" ")}
              >
                {user.role === "Administrador" ? (
                  <ShieldCheck className="h-3 w-3" />
                ) : (
                  <UserCog className="h-3 w-3" />
                )}
                {user.role}
              </span>

              {/* Status dot */}
              <span
                className={`w-2.5 h-2.5 rounded-full ${user.active ? "bg-emerald-500" : "bg-slate-400"}`}
                title={user.active ? "Activo" : "Inactivo"}
              />

              {/* Activate if inactive */}
              {!user.active && (
                <button
                  onClick={() => doActivate(user.id)}
                  disabled={busyId === user.id}
                  className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-extrabold inline-flex items-center transition"
                  title="Activar"
                >
                  <Power className="h-4 w-4 mr-2" />
                  {busyId === user.id ? "Activando..." : "Activar"}
                </button>
              )}

              {/* Menu button */}
              <button
                onClick={() => setMenuOpenId((prev) => (prev === user.id ? null : user.id))}
                className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 grid place-items-center transition"
                aria-label="Más opciones"
              >
                <MoreVertical className="h-4 w-4 text-slate-700" />
              </button>

              {/* Dropdown */}
              {menuOpenId === user.id && (
                <>
                  <button
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setMenuOpenId(null)}
                    aria-label="Cerrar menú"
                  />

                  <div className="absolute right-4 top-14 z-50 w-52 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                    <button
                      onClick={() => openPermissions(user)}
                      className="w-full px-4 py-3 text-left text-sm font-extrabold text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <KeyRound className="h-4 w-4 text-slate-600" />
                      Asignar permisos
                    </button>

                    <div className="h-px bg-slate-200" />

                    <button
                      onClick={() => openEdit(user)}
                      className="w-full px-4 py-3 text-left text-sm font-extrabold text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4 text-slate-600" />
                      Editar
                    </button>

                    <button
                      onClick={() => askDelete(user.id)}
                      className="w-full px-4 py-3 text-left text-sm font-extrabold text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setModalOpen(false);
              setEditing(null);
              setEditCreds(null);
            }}
          />

          <div className="relative h-full w-full grid place-items-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="p-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {editing ? "Editar usuario" : "Agregar usuario"}
                  </h3>
                  <p className="text-sm text-slate-500">Completa los datos del usuario.</p>
                </div>

                <button
                  onClick={() => {
                    setModalOpen(false);
                    setEditing(null);
                    setEditCreds(null);
                  }}
                  className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 grid place-items-center"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4 text-slate-700" />
                </button>
              </div>

              <form onSubmit={submit} className="p-5 pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Nombre"
                    value={form.name}
                    onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                  />
                  <Field
                    label="Apellido paterno"
                    value={form.paternal_lastname}
                    onChange={(v) => setForm((p) => ({ ...p, paternal_lastname: v }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Apellido materno"
                    value={form.maternal_lastname}
                    onChange={(v) => setForm((p) => ({ ...p, maternal_lastname: v }))}
                  />

                  <div>
                    <label className="text-sm font-extrabold text-slate-700">Rol</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as Role }))}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition"
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Cajero">Cajero</option>
                    </select>
                  </div>
                </div>

                <>
                  <Field
                    label="Usuario (login)"
                    value={form.user}
                    onChange={(v) => setForm((p) => ({ ...p, user: v }))}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PasswordField
                      label="Contraseña"
                      placeholder="mín. 6 caracteres"
                      value={form.password}
                      onChange={(v) => setForm((p) => ({ ...p, password: v }))}
                      show={showPassword}
                      onToggle={() => setShowPassword((s) => !s)}
                    />
                    <PasswordField
                      label="Confirmar contraseña"
                      placeholder="repite la contraseña"
                      value={form.password2}
                      onChange={(v) => setForm((p) => ({ ...p, password2: v }))}
                      show={showPassword2}
                      onToggle={() => setShowPassword2((s) => !s)}
                    />
                  </div>
                </>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setEditing(null);
                      setEditCreds(null);
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-3 font-extrabold text-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={busyId !== null}
                    className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white py-3 font-extrabold transition"
                  >
                    {editing ? "Guardar cambios" : "Crear usuario"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Permisos Modal */}
      {permModalOpen && permUser && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setPermModalOpen(false);
              setPermUserId(null);
            }}
          />

          <div className="relative h-full w-full grid place-items-center p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              <div className="p-5 flex items-start justify-between gap-3 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Permisos de {fullName(permUser)}</h3>
                  <p className="text-sm text-slate-500">
                    Rol: <span className="font-extrabold text-slate-700">{permUser.role}</span> · Seleccionados:{" "}
                    <span className="font-extrabold text-slate-700">{permDraft.length}</span>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPermModalOpen(false);
                    setPermUserId(null);
                  }}
                  className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 grid place-items-center"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4 text-slate-700" />
                </button>
              </div>

              <div className="p-5">
                <input
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  placeholder="Buscar permiso…"
                  className="w-full sm:max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition"
                />

                <div className="mt-4 max-h-[50vh] overflow-auto rounded-2xl border border-slate-200">
                  {permBusy ? (
                    <div className="p-8 text-center text-slate-500 font-extrabold">Cargando permisos...</div>
                  ) : (
                    <ul className="divide-y divide-slate-200">
                      {filteredPerms.map((p) => {
                        const checked = permDraft.includes(p.key);
                        return (
                          <li key={p.key} className="p-4 hover:bg-slate-50 transition">
                            <label className="flex items-start gap-3 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePerm(p.key)}
                                className="mt-1 h-4 w-4 accent-emerald-500"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-extrabold text-slate-900">{p.label}</p>
                                
                              </div>

                              {checked && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-[11px] font-extrabold">
                                  <ShieldCheck className="h-3 w-3" />
                                  Activo
                                </span>
                              )}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPermModalOpen(false);
                      setPermUserId(null);
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-3 font-extrabold text-slate-800 transition"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    disabled={permBusy}
                    onClick={savePermissions}
                    className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white py-3 font-extrabold transition"
                  >
                    {permBusy ? "Guardando..." : "Guardar permisos"}
                  </button>
                </div>

                
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDeleteOpen}
        title="Eliminar usuario"
        description="¿Seguro que quieres eliminar este usuario? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={doDelete}
      />
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-extrabold text-slate-700">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition"
      />
    </label>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-extrabold text-slate-700">{label}</span>
      <div className="mt-2 relative">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-12 py-3 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 grid place-items-center transition"
          aria-label="Mostrar/ocultar contraseña"
        >
          {show ? <EyeOff className="h-4 w-4 text-slate-700" /> : <Eye className="h-4 w-4 text-slate-700" />}
        </button>
      </div>
    </label>
  );
}