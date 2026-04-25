import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { Layout } from "@/components/feature/Layout";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/login/page";
import PanelPage from "@/pages/panel/page";
import PagoPage from "@/pages/pago/page";
import ProductosPage from "@/pages/productos/page";
import ReportesPage from "@/pages/reportes/page";
import ConfiguracionPage from "@/pages/configuracion/page";
import ProveedoresPage from "@/pages/proveedores/page";
import ComprasPage from "@/pages/compras/page";
import VencimientosPage from "@/pages/vencimientos/page";
import ListaInteresPage from "@/pages/lista-interes/page";
import BuscarFacturaPage from "@/pages/buscar-factura/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/acceso" replace />,
  },
  {
    path: "/acceso",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "panel", element: <PanelPage /> },
      { path: "pago", element: <PagoPage /> },
      { path: "productos", element: <ProductosPage /> },
      { path: "reportes", element: <ReportesPage /> },
      { path: "configuracion", element: <ConfiguracionPage /> },
      { path: "proveedores", element: <ProveedoresPage /> },
      { path: "compras", element: <ComprasPage /> },
      { path: "vencimientos", element: <VencimientosPage /> },
      { path: "lista-interes", element: <ListaInteresPage /> },
      { path: "buscar-factura", element: <BuscarFacturaPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
