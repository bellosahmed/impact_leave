/**
 * SkeletonLoader for table rows
 */
export default function SkeletonLoader({ rows = 5, cols = 4 }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                    {Array.from({ length: cols }).map((_, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
