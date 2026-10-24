export interface Category {
  id: string;
  tournamentId: string;
  title: string;
  minAge: number | null;
  maxAge: number | null;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface CategoryResponse {
  category: Category;
}

export interface CategoryInput {
  title: string;
  minAge: number | null;
  maxAge: number | null;
  description: string | null;
  order?: number;
}

export interface CategoryFormValues {
  title: string;
  minAge: string;
  maxAge: string;
  description: string;
}