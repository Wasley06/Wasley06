export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return "Good Morning"
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon"
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening"
  } else {
    return "Good Evening"
  }
}

export function formatUserName(title: string | null, firstName: string | null, surname: string | null): string {
  const name = `${firstName || ""} ${surname || ""}`.trim() || "User"
  const titlePrefix = title ? `${title}. ` : ""
  return `${titlePrefix}${name}`
}
