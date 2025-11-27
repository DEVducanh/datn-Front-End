import { Routes, Route, Navigate } from 'react-router'

import AdminLayout from '@/layouts/AdminLayout'
import DefaultLayout from '@/layouts/DefaultLayout'

import { ProtectedRoute, AuthRedirect } from '@/components/ProtectedRoute'

// Client pages
import Home from '@/pages/client/Home'
import AboutPage from '@/pages/client/AboutPage'
import Dashboard from '@/pages/admin/Dashboard'
import CategoryPage from '@/pages/client/CategoryPage'
import CartPage from '@/pages/client/CartPage'
import FoodDetailPage from '@/pages/client/FoodDetailPage'
import OrderPage from '@/pages/client/OrderPage'

import Login from '@/pages/client/Login'
import Register from '@/pages/client/Register'
import GuestLogin from '@/pages/client/GuestLogin' // <--- 1. Import trang GuestLogin

// Admin pages
import CategoryManagement from '@/pages/admin/CategoryManagement'
import DishManagement from '@/pages/admin/DishManagement'
import TableManagement from '@/pages/admin/TableManagement'
import OrderManagement from '@/pages/admin/OrderManagement'
import PaymentAndBill from '@/pages/admin/PaymentAndBill'
import ReviewManagement from '@/pages/admin/ReviewManagement'
import StaffManagement from '@/pages/admin/StaffManagement'
import UserManagement from '@/pages/admin/UserManagement'
import ContactPage from '@/pages/client/Contact/ContactPage'
import PaymentResult from '../PaymentResult'
import InvoiceDetailPage from '@/pages/client/InvoiceDetail'
import AdminRoute from '../AdminRoute'
import { ToastContainer } from 'react-toastify'
import ChefOrderPage from '@/pages/chef/ChefOrderPage'
import PrivateRoute from '../PrivateRoute'
import { USER_ROLE } from '@/shared/constants/role'
import WaiterPage from '@/pages/waiter/WaiterPage'
import CashierPage from '@/pages/cashier/CashierPage'

const AppRoutes = () => {
  return (
    <>
      <Routes>
        {/* Redirect root to /flareon */}
        <Route path="/" element={<Navigate to="/flareon" replace />} />

        {/* --- 2. Route cho trang đăng nhập khách hàng (Quét QR) --- */}
        {/* Đặt ở ngoài DefaultLayout để nó hiển thị full màn hình */}
        <Route path="/guest-login" element={<GuestLogin />} />


        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="dishes" element={<DishManagement />} />
            <Route path="tables" element={<TableManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="payment-and-billing" element={<PaymentAndBill />} />
            <Route path="reviews" element={<ReviewManagement />} />
            <Route path="staffs" element={<StaffManagement />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Route>

        {/* Role-based Routes */}
        <Route element={<PrivateRoute allowedRoles={[USER_ROLE.CHEF, USER_ROLE.ADMIN]} />}>
          <Route path="/chef" element={<ChefOrderPage />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={[USER_ROLE.WAITER, USER_ROLE.ADMIN]} />}>
          <Route path="/waiter" element={<WaiterPage />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={[USER_ROLE.CASHIER, USER_ROLE.ADMIN]} />}>
          <Route path="/cashier" element={<CashierPage />} />
        </Route>

        {/* Client Routes (Default Layout) */}
        <Route path="/flareon" element={<DefaultLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="category" element={<CategoryPage />} />
          <Route path="product/:id" element={<FoodDetailPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="payment/result" element={<PaymentResult />} />

          <Route element={<ProtectedRoute />}>
            <Route path="cart" element={<CartPage />} />
            <Route path="orders" element={<OrderPage />} />
          </Route>

          <Route element={<AuthRedirect />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
        </Route>
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  )
}

export default AppRoutes