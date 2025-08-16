/**
 * A simple, reusable skeleton loader component for tables.
 * It shows pulsing grey bars to indicate that data is being loaded.
 */
export default function SkeletonLoader({ rows = 5, cols = 4 }) {
    return (
        <tbody className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
}