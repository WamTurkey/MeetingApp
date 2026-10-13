file_path = "/Users/boravarol01gmail.com/Desktop/Toplantı/src/pages/followups/FollowupsPage.tsx"
with open(file_path, "r") as f:
    content = f.read()

target = """const STATUS_BADGE_VARIANT: Record<ActionStatus, "primary" | "warning" | "success" | "default"> = {
  OPEN: "primary",
  IN_PROGRESS: "warning",
  CLOSED: "success",
  CANCELLED: "default",
};"""

content = content.replace(target, "")

with open(file_path, "w") as f:
    f.write(content)
print("Removed unused STATUS_BADGE_VARIANT")
