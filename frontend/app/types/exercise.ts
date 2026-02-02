// Types pour les exercices mathématiques NovLearn

export interface Variable {
  id: number;
  name: string;
  type: 'integer' | 'decimal' | 'choice' | 'computed';
  min?: number;
  max?: number;
  decimals?: number;
  choices?: string[];
  expression?: string;
}

export interface TextContent {
  text: string;
}

export interface FunctionContent {
  name?: string;
  variable?: string;
  expression: string;
  domain?: string;
  latex?: boolean;
}

export interface VariationPoint {
  x: string;
  value: string;
  variation: 'croissante' | 'décroissante' | '';
}

export interface VariationTableContent {
  points: VariationPoint[];
}

export interface GraphContent {
  expression: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  showGrid: boolean;
  showAxes: boolean;
}

export interface SignPoint {
  x: string;
  // AJOUT DE '||' ICI pour corriger l'erreur TS(2367)
  sign: '+' | '-' | '0' | '||';
}

export interface SignTableContent {
  points: SignPoint[];
}

export interface DiscreteGraphContent {
  points?: Array<{ n: number; value: number }>;
}

export interface EquationContent {
  latex: string;
  answerType?: 'numeric' | 'text' | 'expression' | 'set';
  correctAnswer?: string;
  requireAnswer?: boolean;
  tolerance?: number;
}

export interface QuestionContent {
  question: string;
  answerFormat: 'number' | 'text'; 
  correctAnswer: string;
  points?: number;
  hint?: string;
  explanation?: string;
}

export interface MCQOption {
  text: string;
  correct: boolean;
}

export interface MCQContent {
  question: string;
  options: MCQOption[];
}

export interface SequenceContent {
  type: 'explicit' | 'recursive';
  formula: string;
  u0: string;
  relation?: string;
  reason?: string;
  showTerms: boolean;
  termsCount: number;
}

// Union de tous les types de contenu possibles
export type ElementContent = 
  | TextContent
  | FunctionContent
  | VariationTableContent
  | GraphContent
  | SignTableContent
  | DiscreteGraphContent
  | EquationContent
  | QuestionContent
  | MCQContent
  | SequenceContent;

// Union Discriminée pour typage strict
export type ExerciseElement = 
  | { id: number; type: 'text'; content: TextContent }
  | { id: number; type: 'function'; content: FunctionContent }
  | { id: number; type: 'variation_table'; content: VariationTableContent }
  | { id: number; type: 'graph'; content: GraphContent }
  | { id: number; type: 'sign_table'; content: SignTableContent }
  | { id: number; type: 'discrete_graph'; content: DiscreteGraphContent }
  | { id: number; type: 'equation'; content: EquationContent }
  | { id: number; type: 'question'; content: QuestionContent }
  | { id: number; type: 'mcq'; content: MCQContent }
  | { id: number; type: 'sequence'; content: SequenceContent };

export interface Exercise {
  id: number;
  title: string;
  chapter: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  competences: string[];
  variables: Variable[];
  elements: ExerciseElement[];
}

export type VariableValues = Record<string, number | string>;

export interface RendererProps<T = ElementContent> {
  content: T;
  variables: VariableValues;
}