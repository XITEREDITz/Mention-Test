import { UserSearch } from "@/components/user-search";
import { FriendSuggestions } from "@/components/friend-suggestions";
import { useAuth } from "@/context/auth-context";
import { FriendRequestsSent } from "@/components/friend-requests-sent";

export default function FindFriendsPage() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Find Friends</h1>
      
      <div className="space-y-6">
        <UserSearch />
        
        <FriendRequestsSent />
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Suggested for you</h2>
          <FriendSuggestions />
        </div>
      </div>
    </div>
  );
}