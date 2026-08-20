export type RoutineTemplate = {
  name: string;
  chores: { title: string; requiresPhoto: boolean }[];
};

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    name: "Morning Kitchen Reset",
    chores: [
      { title: "Load dishwasher", requiresPhoto: true },
      { title: "Wipe counters", requiresPhoto: true },
      { title: "Take out trash", requiresPhoto: false },
      { title: "Wipe the sink", requiresPhoto: true },
    ],
  },
  {
    name: "Deep Clean",
    chores: [
      { title: "Vacuum living room", requiresPhoto: true },
      { title: "Clean bathroom", requiresPhoto: true },
      { title: "Dust shelves", requiresPhoto: false },
      { title: "Mop floors", requiresPhoto: true },
    ],
  },
  {
    name: "Closing Shift Checklist",
    chores: [
      { title: "Wipe down all surfaces", requiresPhoto: true },
      { title: "Restock supplies", requiresPhoto: false },
      { title: "Empty trash bins", requiresPhoto: true },
      { title: "Lock up and set alarm", requiresPhoto: false },
    ],
  },
];
