import { BrowserRouter, Routes, Route, Navigate } from 'react-router'

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
import Checkout from '@/pages/client/OrderPage/checkout'
import PaymentResult from '../PaymentResult'

const AppRoutes = () => {
  return (
    // LƯU Ý QUAN TRỌNG: Component này phải nằm trong <AuthProvider> ở file App.jsx
    <BrowserRouter>
      <Routes>
        {/* Admin layout pages */}
        <Route path="/" element={<Navigate to="/flareon" replace />} />
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

        <Route path="/flareon" element={<DefaultLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="category" element={<CategoryPage />} />
          <Route path="product/:id" element={<FoodDetailPage />} />
          <Route path="contact" element={<ContactPage />} />
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
    </BrowserRouter>
  )
}

export default AppRoutes
