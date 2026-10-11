import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import { AppRoutes } from './routes/AppRoutes'
import { RouteCurtain } from './components/layout/RouteCurtain'

function App() {
  return (
    <BrowserRouter>
      {/* "Sleep Banaza" loading + page-change curtain */}
      <RouteCurtain />
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppRoutes />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App