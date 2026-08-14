import { Redirect } from "expo-router";
import { useAuth } from "../auth/AuthContext";
import { getRoleHome } from "../auth/roleUtils";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  const target = user ? getRoleHome(user.role) : "/login";
  return <Redirect href={target as any} />;
}