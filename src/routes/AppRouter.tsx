import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import AuthLayout from "../components/layout/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";
import RootRedirect from "./RootRedirect";

import LoginPage from "../pages/Auth/LoginPage";

import DashboardPage from "../pages/Dasboard/Dasboard";
import SalesPage from "../pages/Sales/SalesPage";
import CreditSalesPage from "../pages/Sales/SalesCreditPage";
import ProductsPage from "../pages/Products/ProductsPage";
import InventoryPage from "../pages/Inventory/Inventory";
import ReportPage from "../pages/Report/ReportPage";
import HistoryPage from "../pages/Historybalance/HistoryPage";
import CashoutPage from "../pages/Cashout/CashoutPage";
import OpenCashoutPage from "../pages/Cashout/OpenCashoutPage";
import ExpensesPage from "../pages/Expenses/ExpensesPage";

import ConfigLayout from "../pages/Settings/SettingsLayout";
import ConfigPage from "../pages/Settings/ConfigPage";
import BusinessSettings from "../pages/Settings/BusinessSettings";
import UsersSettings from "../pages/Settings/UsersSettings";
import TicketSettings from "../pages/Settings/TicketSettings";
import SecuritySettings from "../pages/Settings/SecuritySettings";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        {/* Públicas */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protegidas por login */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/abrir-caja" element={<OpenCashoutPage />} />

            {/* Ventas rápidas */}
            <Route element={<ProtectedRoute requiredPermission="ACCESO_VENTAS" />}>
              <Route path="/ventas" element={<SalesPage />} />
            </Route>

            {/* Ventas a crédito */}
            <Route element={<ProtectedRoute requiredPermission="VENTA_CREDITO" />}>
              <Route path="/ventas/credito" element={<CreditSalesPage />} />
            </Route>

            {/* Productos */}
            <Route element={<ProtectedRoute requiredPermission="ADMINISTRAR_PRODUCTOS" />}>
              <Route path="/productos" element={<ProductsPage />} />
            </Route>

            {/* Inventario */}
            <Route element={<ProtectedRoute requiredPermission="ADMINISTRAR_INVENTARIO" />}>
              <Route path="/inventario" element={<InventoryPage />} />
            </Route>

            {/* Reportes */}
            <Route element={<ProtectedRoute requiredPermission="VER_REPORTES" />}>
              <Route path="/reportes" element={<ReportPage />} />
            </Route>

               {/* Historial cortes */}
            <Route element={<ProtectedRoute requiredPermission="HISTORIAL_CORTES" />}>
              <Route path="/historial-cortes" element={<HistoryPage />} />
            </Route>

            {/* Corte de caja */}
            <Route element={<ProtectedRoute requiredPermission="VISTA_CORTE" />}>
              <Route path="/corte-caja" element={<CashoutPage />} />
            </Route>

            {/* Egresos */}
            <Route element={<ProtectedRoute requiredPermission="ACCESO_EGRESOS" />}>
              <Route path="/egresos" element={<ExpensesPage />} />
            </Route>

            {/* Configuración */}
            <Route element={<ProtectedRoute requiredPermission="ACCESO_CONFIGURACION" />}>
              <Route path="/configuracion" element={<ConfigLayout />}>
                <Route index element={<ConfigPage />} />
                <Route path="negocio" element={<BusinessSettings />} />
                <Route path="usuarios" element={<UsersSettings />} />
                <Route path="tickets" element={<TicketSettings />} />
                <Route path="seguridad" element={<SecuritySettings />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}