import { Routes, Route, Navigate } from 'react-router'
import { ToastContainer } from 'react-toastify'

import AdminLayout from '@/layouts/AdminLayout'
import DefaultLayout from '@/layouts/DefaultLayout'
import { ProtectedRoute, AuthRedirect } from '@/components/ProtectedRoute'
import AdminRoute from '../AdminRoute'
import PrivateRoute from '../PrivateRoute'
import { USER_ROLE } from '@/shared/constants/role'

// Client pages
import Home from '@/pages/client/Home'
import AboutPage from '@/pages/client/AboutPage'
import CategoryPage from '@/pages/client/CategoryPage'
import CartPage from '@/pages/client/CartPage'
import FoodDetailPage from '@/pages/client/FoodDetailPage'
import OrderPage from '@/pages/client/OrderPage'
import FeedbackPage from '@/pages/client/Feedback'
import InvoiceDetailPage from '@/pages/client/InvoiceDetail'
import ContactPage from '@/pages/client/Contact/ContactPage'
import PaymentResult from '../PaymentResult'

import Login from '@/pages/client/Login'
import Register from '@/pages/client/Register'
import GuestLogin from '@/pages/client/GuestLogin'

// Admin pages
import Dashboard from '@/pages/admin/Dashboard'
import CategoryManagement from '@/pages/admin/CategoryManagement'
import DishManagement from '@/pages/admin/DishManagement'
import TableManagement from '@/pages/admin/TableManagement'
import OrderManagement from '@/pages/admin/OrderManagement'
import PaymentAndBill from '@/pages/admin/PaymentAndBill'
import ReviewManagement from '@/pages/admin/ReviewManagement'
import StaffManagement from '@/pages/admin/StaffManagement'
import UserManagement from '@/pages/admin/UserManagement'

// Role pages
import ChefOrderPage from '@/pages/chef/ChefOrderPage'
import WaiterPage from '@/pages/waiter/WaiterPage'
import CashierPage from '@/pages/cashier/CashierPage'

const AppRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/flareon" replace />} />

        <Route path="/guest-login" element={<GuestLogin />} />

        {/* Login và Register nằm độc lập bên ngoài DefaultLayout */}
        <Route element={<AuthRedirect />}>
          <Route path="/flareon/login" element={<Login />} />
          <Route path="/flareon/register" element={<Register />} />
        </Route>

        {/* Các trang nằm trong DefaultLayout */}
        <Route path="/flareon" element={<DefaultLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="category" element={<CategoryPage />} />
          <Route path="product/:id" element={<FoodDetailPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="payment/result" element={<PaymentResult />} />
          <Route path="feedback/:orderId" element={<FeedbackPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="cart" element={<CartPage />} />
            <Route path="orders" element={<OrderPage />} />
          </Route>
        </Route>

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

        <Route element={<PrivateRoute allowedRoles={[USER_ROLE.CHEF, USER_ROLE.ADMIN]} />}>
          <Route path="/chef" element={<ChefOrderPage />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={[USER_ROLE.WAITER, USER_ROLE.ADMIN]} />}>
          <Route path="/waiter" element={<WaiterPage />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={[USER_ROLE.CASHIER, USER_ROLE.ADMIN]} />}>
          <Route path="/cashier" element={<CashierPage />} />
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