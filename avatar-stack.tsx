import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarStackProps {
  avatars: { src: string; alt: string; initials: string }[];
  limit?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarStack({ avatars, limit = 3, size = "md" }: AvatarStackProps) {
  const sizeClasses = {
    sm: "h-6 w-6 -ml-1.5 first:ml-0",
    md: "h-8 w-8 -ml-2 first:ml-0",
    lg: "h-10 w-10 -ml-3 first:ml-0"
  };
  
  const borderClasses = {
    sm: "border-[1.5px]",
    md: "border-2",
    lg: "border-2"
  };
  
  const displayAvatars = avatars.slice(0, limit);
  const remainingCount = avatars.length - limit;
  
  return (
    <div className="flex items-center">
      <div className="flex">
        {displayAvatars.map((avatar, index) => (
          <Avatar 
            key={index} 
            className={`${sizeClasses[size]} ${borderClasses[size]} border-background relative z-[${10 - index}]`}
          >
            <AvatarImage src={avatar.src} alt={avatar.alt} />
            <AvatarFallback>{avatar.initials}</AvatarFallback>
          </Avatar>
        ))}
        
        {remainingCount > 0 && (
          <div className={`${sizeClasses[size]} ${borderClasses[size]} border-background flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium`}>
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}
