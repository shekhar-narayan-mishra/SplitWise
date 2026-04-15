import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login, Register, Dashboard, CreateGroup, GroupDetail, AddExpense, EditGroup, EditExpense } from './pages';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes (Wrapped in Layout) */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/groups/create" element={<CreateGroup />} />
            <Route path="/groups/:id" element={<GroupDetail />} />
            <Route path="/groups/:id/edit" element={<EditGroup />} />
            <Route path="/groups/:id/expenses/add" element={<AddExpense />} />
            <Route path="/expenses/:expenseId/edit" element={<EditExpense />} />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
