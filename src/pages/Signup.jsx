import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import DarkContainer from '../components/ui/DarkContainer'
import DarkInput from '../components/ui/DarkInput'
import DarkButton from '../components/ui/DarkButton'
import AlertMessage from '../components/ui/AlertMessage'

export default function Signup() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    try {
      setError(null)
      setLoading(true)
      const { error } = await signUp({ email, password })
      if (error) throw error
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DarkContainer variant="auth">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-light text-white mb-2">Join PercentDone</h1>
        <p className="text-gray-400 text-sm">Create your account to start tracking progress</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-6">
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
            autoComplete="new-password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          
          <DarkInput
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <DarkButton type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </DarkButton>
      </form>

        
      <div className="text-center mt-8">
        <p className="text-gray-400 text-sm">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </DarkContainer>
  )
} 