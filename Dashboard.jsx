import {
  Bell,
  BookOpen,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LineChart,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useGet } from '@/hooks/useGet'
import { formatMoney, formatNumber, formatPercent } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import ErrorState from '@/components/ui/ErrorState'
import { CardSkeleton } from '@/components/ui/Skeleton'

const CONFIG = {
  STUDENT: [
    { key: 'attendance_percentage', label: 'Attendance', icon: ClipboardList, format: formatPercent },
    { key: 'pending_fees', label: 'Pending fees', icon: CreditCard, format: formatMoney },
    { key: 'unread_notifications', label: 'Unread notifications', icon: Bell, format: formatNumber },
    { key: 'upcoming_tests', label: 'Upcoming tests', icon: BookOpen, format: formatNumber },
    { key: 'average_score_percentage', label: 'Average score', icon: LineChart, format: formatPercent },
    { key: 'tests_taken', label: 'Tests taken', icon: GraduationCap, format: formatNumber },
  ],
  FACULTY: [
    { key: 'assigned_batches', label: 'Assigned batches', icon: GraduationCap, format: formatNumber },
    { key: 'students', label: 'Students', icon: Users, format: formatNumber },
    { key: 'tests_created', label: 'Tests created', icon: ClipboardList, format: formatNumber },
    { key: 'materials_uploaded', label: 'Materials uploaded', icon: BookOpen, format: formatNumber },
  ],
  ADMIN: [
    { key: 'students', label: 'Students', icon: Users, format: formatNumber },
    { key: 'faculty', label: 'Faculty', icon: GraduationCap, format: formatNumber },
    { key: 'active_batches', label: 'Active batches', icon: BookOpen, format: formatNumber },
    { key: 'fees_collected', label: 'Fees collected', icon: Wallet, format: formatMoney },
    { key: 'fees_pending', label: 'Fees pending', icon: CreditCard, format: formatMoney },
    { key: 'tests', label: 'Tests', icon: ClipboardList, format: formatNumber },
    { key: 'materials', label: 'Materials', icon: BookOpen, format: formatNumber },
  ],
}

export default function Dashboard() {
  const { user } = useAuth()
  const dash = useGet(['dashboard'], '/dashboard')
  const stats = dash.data?.data || {}
  const cards = CONFIG[user?.role] || []

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.full_name || ''}`} description="Your latest snapshot from StudyMate." />
      {dash.isLoading ? <CardSkeleton count={cards.length || 4} /> : null}
      {dash.isError ? <ErrorState message={getErrorMessage(dash.error)} onRetry={() => dash.refetch()} /> : null}
      {!dash.isLoading && !dash.isError ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard
              key={card.key}
              icon={card.icon}
              label={card.label}
              value={card.format(stats[card.key])}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
