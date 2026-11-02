import ErrorPage from './ErrorPage.jsx'

export default function ForbiddenPage() {
  return <ErrorPage code={403} message="Access denied" />
}
