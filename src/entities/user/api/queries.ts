import { useQuery } from "@tanstack/react-query";
import { userKeys } from "@/shared/api/queryKeys";
import { fetchUsers } from "@/services/userService";

export function useUsers(options: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: userKeys.list(), queryFn: fetchUsers, enabled: options.enabled ?? true });
}
