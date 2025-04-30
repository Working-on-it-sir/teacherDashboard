function forgot({ onBack }) {
  return (
    <div>
      <h1>Forgot Password</h1>
      <form>
        <input type="email" placeholder="Enter your email" required />
        <button type="submit">Send Reset Link</button>
      </form>
      <button onClick={onBack}>Back to Login</button>
    </div>
  );
}

export default forgot;