// Types pour les exercices mathématiques NovLearn

export interface Variable {
  id: number;
  name: string;
  type: 'integer' | 'decimal' | 'choice' | 'computed';
  min?: number;
  max?: number;
  decimals?: number;
  choices?: string[];
  expression?: string; // For computed variables
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
  sign: '+' | '-' | '0';
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
  answerType: 'numeric' | 'text' | 'expression';
  answer: string;
  tolerance: number;
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

export type ElementType =
  | 'text'
  | 'function'
  | 'variation_table'
  | 'graph'
  | 'sign_table'
  | 'discrete_graph'
  | 'equation'
  | 'question'
  | 'mcq'
  | 'sequence';

export interface ExerciseElement<T extends ElementContent = ElementContent> {
  id: number;
  type: ElementType;
  content: T;
}

export interface Exercise {
  id: number;
  title: string;
  chapter: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  competences: string[];
  variables: Variable[];
  elements: ExerciseElement[];
}

// Type pour les valeurs de variables générées
export type VariableValues = Record<string, number | string>;

// Props de base pour tous les renderers
export interface RendererProps<T extends ElementContent = ElementContent> {
  content: T;
  variables: VariableValues;
}