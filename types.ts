
export interface Mission {
  id: number;
  title: string;
  desc: string;
  expected: string;
  successMessage: string;
}

export interface TableSchema {
  tableName: string;
  columns: string[];
}

export type QueryRow = Record<string, unknown>;
export type QueryResult = QueryRow[];

// ERD Types
export interface ErdNode {
  id: string;
  x: number;
  y: number;
  label: string;
  fields: string[];
}

export interface ErdEdge {
  from: string;
  to: string;
  label?: string;
}

export interface Scenario {
  id: 'training' | 'exam' | 'exercises';
  name: string;
  description: string;
  seedSql: string;
  schema: TableSchema[];
  missions: Mission[];
  erdNodes: ErdNode[];
  erdEdges: ErdEdge[];
}

export type FontSize = 'text-xs' | 'text-sm' | 'text-base';
