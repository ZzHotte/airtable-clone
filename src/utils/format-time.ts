/**
 * Format a date to show relative time like "Opened 1 hour ago"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return "Opened just now";
  } else if (diffInMinutes < 60) {
    return `Opened ${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInHours < 24) {
    return `Opened ${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInDays < 7) {
    return `Opened ${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  } else {
    return `Opened ${Math.floor(diffInDays / 7)} ${Math.floor(diffInDays / 7) === 1 ? "week" : "weeks"} ago`;
  }
}
