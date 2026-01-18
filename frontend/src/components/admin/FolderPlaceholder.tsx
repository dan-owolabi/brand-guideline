export function FolderPlaceholder({ className = "w-24 h-24" }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M10 25C10 19.4772 14.4772 15 20 15H40C41.3261 15 42.5979 15.5268 43.5355 16.4645L48.5355 21.4645C49.4732 22.4021 50.7451 22.9289 52.0711 22.9289H80C85.5228 22.9289 90 27.4061 90 32.9289V75C90 80.5228 85.5228 85 80 85H20C14.4772 85 10 80.5228 10 75V25Z"
                fill="#EFF6FF"
                stroke="#60A5FA"
                strokeWidth="2"
            />
            <path
                d="M10 35C10 29.4772 14.4772 25 20 25H80C85.5228 25 90 29.4772 90 35V75C90 80.5228 85.5228 85 80 85H20C14.4772 85 10 80.5228 10 75V35Z"
                fill="#DBEAFE"
                stroke="#3B82F6"
                strokeWidth="2"
            />
        </svg>
    )
}
