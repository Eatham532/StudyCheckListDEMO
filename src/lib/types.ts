// types.ts

export interface ProgressStatus {
  unsure: boolean;
  revise: boolean;
  confident: boolean;
  practised: boolean;
}

export interface ProgressItem {
  id: string;           // e.g. "F1.1.1"
  text: string;         // the bullet text (may include nested continuations)
  status: ProgressStatus;
  subpoints?: ProgressItem[]; // child items for nested lists
}

export interface ContentSection {
  id: string;           // e.g. "F1.1"
  title: string;        // e.g. "Algebraic techniques"
  items: ProgressItem[];
}

export interface SubTopic {
  code: string;               // e.g. "MA-F1"
  title: string;              // e.g. "Working with Functions (Year 11)"
  contentSections: ContentSection[];
}

export interface Topic {
  id: string;           // slug of topic name, e.g. "functions"
  title: string;        // e.g. "Functions"
  subTopics: SubTopic[];
}

export interface ProgressDocument {
  topics: Topic[];
}
