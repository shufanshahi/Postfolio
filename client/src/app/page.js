import Link from 'next/link';

export default function Home() {
  return (
      <div>
        <h1>Welcome</h1>
        <Link href="/login">Login</Link>
        <Link href="/register">Register</Link>
      </div>
  );
}