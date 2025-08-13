// Define the possible statuses as a specific type for better TypeScript safety
type LeaveStatus = 'pending' | 'approved' | 'declined';

// Define the props that this component accepts
interface StatusBadgeProps {
    status: LeaveStatus;
}

/**
 * A reusable component that displays a colored badge for a leave status.
 */
export default function StatusBadge({ status }: StatusBadgeProps) {
    // A map to associate each status with its specific Tailwind CSS classes
    const styles: Record<LeaveStatus, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        declined: 'bg-red-100 text-red-800',
    };

    return (
        <span
            className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${styles[status]}`}
        >
            {status}
        </span>
    );
}