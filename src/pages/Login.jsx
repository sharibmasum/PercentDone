import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import DarkContainer from '../components/DarkContainer'
import DarkInput from '../components/DarkInput'
import DarkButton from '../components/DarkButton'
import AlertMessage from '../components/AlertMessage'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      setLoading(true)
      const { error } = await signIn({ email, password })
      if (error) throw error
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DarkContainer>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-light text-white mb-2">Welcome back</h1>
        <p className="text-gray-400 text-sm">Sign in to your PercentDone account</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <AlertMessage type="error">
            {error}
          </AlertMessage>
        )}

        <div className="space-y-4">
          <DarkInput
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          
          <DarkInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <DarkButton type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </DarkButton>
      </form>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-gray-400 text-sm">
          Don't have an account?{' '}
          <Link 
            to="/signup" 
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
          >
            Create one here
          </Link>
        </p>
      </div>
    </DarkContainer>
  )
} 