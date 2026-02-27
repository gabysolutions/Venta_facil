import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import AuthLayout from "../components/layout/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";

import LoginPage from "../pages/Auth/LoginPage";

import DashboardPage from "../pages/Dasboard/Dasboard";
import SalesPage from "../pages/Sales/SalesPage";
import ProductsPage from "../pages/Products/ProductsPage";
import InventoryPage from "../pages/Inventory/Inventory";
import ReportPage from "../pages/Report/ReportPage";
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
        {/* Públicas */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ventas" element={<SalesPage />} />
            <Route path="/productos" element={<ProductsPage />} />
            <Route path="/inventario" element={<InventoryPage />} />
            <Route path="/reportes" element={<ReportPage />} />
            <Route path="/corte-caja" element={<CashoutPage />} />
            <Route path="/abrir-caja" element={<OpenCashoutPage />} />
            <Route path="/egresos" element={<ExpensesPage />} />

            {/* Configuración con subrutas */}
            <Route path="/configuracion" element={<ConfigLayout />}>
              <Route index element={<ConfigPage />} />
              <Route path="negocio" element={<BusinessSettings />} />
              <Route path="usuarios" element={<UsersSettings />} />
              <Route path="tickets" element={<TicketSettings />} />
              <Route path="seguridad" element={<SecuritySettings />} />
            </Route>
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
