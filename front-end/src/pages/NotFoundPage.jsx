import ErrorPage from './ErrorPage.jsx'

export default function NotFoundPage() {
  return <ErrorPage code={404} message="Page not found" />
}
