import { Link } from 'react-router'

export default function ErrorPage({ code, message }) {
  return (
    <section className="p-10">
      <h1 className="text-3xl">
        {code} · {message}
      </h1>
      <Link className="text-link mt-6" to="/dashboard">
        Back to overview
      </Link>
    </section>
  )
}
