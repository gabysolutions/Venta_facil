import { useEffect, useState } from "react";
import { Pencil, Trash2, Power, X } from "lucide-react";

import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  activateCategory,
} from "../../services/category.service";

import type { Category } from "../../services/category.service";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void; // para recargar categorías en ProductsPage
};

export default function CategoryModal({ open, onClose, onSaved }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await getAllCategories();
      if (res.success) setCategories(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadCategories();
  }, [open]);

  const save = async () => {
    if (!form.trim()) return;

    try {
      if (editing) {
        setBusyId(editing.id);
        await updateCategory({ id: editing.id, description: form.trim() });
      } else {
        await createCategory({ description: form.trim() });
      }

      setForm("");
      setEditing(null);
      await loadCategories();
      onSaved();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number) => {
    setBusyId(id);
    await deleteCategory(id);
    await loadCategories();
    onSaved();
    setBusyId(null);
  };

  const activate = async (id: number) => {
    setBusyId(id);
    await activateCategory(id);
    await loadCategories();
    onSaved();
    setBusyId(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative h-full w-full grid place-items-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">

          {/* HEADER */}
          <div className="p-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Categorías</h3>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 grid place-items-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* FORM */}
          <div className="px-5 pb-4">
            <div className="flex gap-2">
              <input
                value={form}
                onChange={(e) => setForm(e.target.value)}
                placeholder="Nueva categoría"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400"
              />

              <button
                onClick={save}
                className="px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold"
              >
                {editing ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>

          {/* LISTA */}
          <div className="max-h-80 overflow-auto px-5 pb-5 space-y-2">
            {loading ? (
              <p className="text-center text-slate-500">Cargando...</p>
            ) : categories.length === 0 ? (
              <p className="text-center text-slate-500 text-sm">Sin categorías</p>
            ) : (
              categories.map((c) => {
                const inactive = c.status === 0;

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                  >
                    <span
                      className={
                        inactive ? "text-slate-400 line-through" : "font-semibold"
                      }
                    >
                      {c.description}
                    </span>

                    <div className="flex gap-2">
                      {inactive ? (
                        <button
                          onClick={() => activate(c.id)}
                          className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                        >
                          <Power className="h-3 w-3 mr-1" />
                          Activar
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditing(c);
                              setForm(c.description);
                            }}
                            className="h-8 w-8 rounded-lg bg-slate-100 grid place-items-center"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => remove(c.id)}
                            disabled={busyId === c.id}
                            className="h-8 w-8 rounded-lg bg-rose-100 grid place-items-center"
                          >
                            <Trash2 className="h-4 w-4 text-rose-700" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}