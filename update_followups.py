file_path = "/Users/boravarol01gmail.com/Desktop/Toplantı/src/pages/followups/FollowupsPage.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Remove NO_DATE
content = content.replace(
    'const BUCKET_ORDER: FollowupBucket[] = ["OVERDUE", "TODAY", "SOON", "LATER", "NO_DATE", "CLOSED"];',
    'const BUCKET_ORDER: FollowupBucket[] = ["OVERDUE", "TODAY", "SOON", "LATER", "CLOSED"];'
)

# 2. Make column headers bold
content = content.replace('th className="px-4 py-2.5 text-left font-medium text-surface-500', 'th className="px-4 py-2.5 text-left font-bold text-surface-600')

# 3. Replace the Badge with a Select for Status
# First, ensure Select is imported
if "import { Select }" not in content:
    content = content.replace('import { Badge } from "@/shared/ui/Badge";', 'import { Badge } from "@/shared/ui/Badge";\nimport { Select } from "@/shared/ui/Select";')

# Now replace the td content
badge_target = """                          <td className="px-4 py-3">
                            <Badge variant={STATUS_BADGE_VARIANT[item.actionStatus]} size="sm">
                              {ACTION_STATUS_LABEL[item.actionStatus]}
                            </Badge>
                          </td>"""

select_replacement = """                          <td className="px-4 py-3">
                            <div onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={item.actionStatus}
                                onChange={(e) => handleUpdate(item.id, { actionStatus: e.target.value as ActionStatus })}
                                options={Object.entries(ACTION_STATUS_LABEL).map(([val, label]) => ({ value: val, label }))}
                                className="h-8 text-xs !py-1 !px-2 w-[120px]"
                              />
                            </div>
                          </td>"""

content = content.replace(badge_target, select_replacement)

with open(file_path, "w") as f:
    f.write(content)
print("Updated FollowupsPage.tsx")
