import TimeGroup from "./TimeGroup";
import DoseCard from "./DoseCard";

interface DoseTimelineProps {
  doses: Array<{
    id: string;
    item_id: string;
    due_at: string;
    status: 'scheduled' | 'taken' | 'missed' | 'skipped';
    taken_at: string | null;
    items: {
      name: string;
      dose_text: string | null;
    };
    stock?: {
      units_left: number;
    }[];
  }>;
  period?: "today" | "week" | "month";
  onTake?: (dose: any) => void;
  onMore?: (dose: any) => void;
  groupByTime?: boolean;
}

export default function DoseTimeline({ 
  doses, 
  period = "week",
  onTake = () => {},
  onMore = () => {},
  groupByTime = true,
}: DoseTimelineProps) {
  // Group doses by time of day
  const groupDosesByPeriod = () => {
    const groups = {
      morning: [] as typeof doses,
      afternoon: [] as typeof doses,
      evening: [] as typeof doses,
      night: [] as typeof doses,
    };

    doses.forEach(dose => {
      const hour = new Date(dose.due_at).getHours();
      if (hour >= 6 && hour < 12) groups.morning.push(dose);
      else if (hour >= 12 && hour < 18) groups.afternoon.push(dose);
      else if (hour >= 18 && hour < 22) groups.evening.push(dose);
      else groups.night.push(dose);
    });

    return groups;
  };

  // If grouping by time, use TimeGroup component
  if (groupByTime && period === 'today') {
    const groups = groupDosesByPeriod();
    
    return (
      <div className="space-y-4">
        {groups.morning.length > 0 && (
          <TimeGroup
            period="morning"
            doses={groups.morning}
            onTake={onTake}
            onMore={onMore}
          />
        )}
        {groups.afternoon.length > 0 && (
          <TimeGroup
            period="afternoon"
            doses={groups.afternoon}
            onTake={onTake}
            onMore={onMore}
          />
        )}
        {groups.evening.length > 0 && (
          <TimeGroup
            period="evening"
            doses={groups.evening}
            onTake={onTake}
            onMore={onMore}
          />
        )}
        {groups.night.length > 0 && (
          <TimeGroup
            period="night"
            doses={groups.night}
            onTake={onTake}
            onMore={onMore}
          />
        )}
      </div>
    );
  }

  // Otherwise, show simple list
  return (
    <div className="space-y-3">
      {doses.map((dose) => (
        <DoseCard
          key={dose.id}
          dose={dose}
          onTake={() => onTake(dose)}
          onMore={() => onMore(dose)}
        />
      ))}
    </div>
  );
}
